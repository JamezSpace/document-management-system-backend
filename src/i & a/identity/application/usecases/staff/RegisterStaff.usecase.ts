import type { IdGeneratorPort } from "../../../../../shared/application/port/services/IdGenerator.port.js";
import ApplicationError from "../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../shared/errors/enum/application.enum.js";
import Identity from "../../../domain/entities/user/Identity.js";
import { IdentityStatus } from "../../../domain/entities/user/IdentityStatus.js";
import { InviteStatus, Status } from "../../../domain/enum/staff.enum.js";
import type { UserEventsPort } from "../../ports/events/user/UserEvents.port.js";
import type { InviteRepositoryPort } from "../../ports/repos/user/InviteRepository.port.js";
import type { UserRepositoryPort } from "../../ports/repos/user/UserRepository.port.js";
import type { AuthServicePort } from "../../ports/services/AuthService.port.js";
import type { IdentityEmailServicePort } from "../../ports/services/EmailService.port.js";
import type { TokenServicePort } from "../../ports/services/TokenService.port.js";
import { generateNewInviteTemplate } from "../../templates/NewInvite.template.js";
import type { CompleteOnboardingPayload, RegisterStaffPayload } from "../../types/staff/staff.type.js";
import type AddNewStaffUseCase from "./AddNewStaff.usecase.js";

class RegisterNewStaffUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly identityEvents: UserEventsPort,
		private readonly identityRepo: UserRepositoryPort,
		private readonly inviteRepo: InviteRepositoryPort,
		private readonly addNewStaffUsecase: AddNewStaffUseCase,
		private readonly authService: AuthServicePort,
		private readonly emailService: IdentityEmailServicePort,
		private readonly tokenService: TokenServicePort,
	) {}

	async completeOnboarding(payload: CompleteOnboardingPayload) {
		// validate invite
		const invite = await this.inviteRepo.findByToken(payload.token);

		if (!invite || invite.status !== InviteStatus.PENDING) {
            throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
                message: "Invalid invite"
            })
		}

        if (Date.now() > new Date(invite.expiresAt).getMilliseconds()) {
            throw new ApplicationError(ApplicationErrorEnum.INVALID_CREDENTIALS, {
                message: "Expired invite"
            })
        }

		// create auth user (Firebase)
		const { authProviderId } = await this.authService.createUser(
			invite.email,
		);

		// create Identity
		const userId = "USER-" + this.idGenerator.generate();

		const identity = new Identity({
			id: userId,
			authProviderId,
			email: invite.email,
			phoneNum: payload.phoneNumber,
			status: IdentityStatus.ACTIVE,
			firstName: payload.firstName,
			lastName: payload.lastName,
			middleName: payload.middleName,
		});

		const savedIdentity = await this.identityRepo.save({
			authProvider: "firebase",
			identity,
		});

		const identityId = savedIdentity.getUserId();

		// create Staff
		const newStaff = await this.addNewStaffUsecase.addNewStaff({
			identityId,
			staffNumber: payload.staffNumber,
			employmentType: invite.employmentType,
			unitId: invite.unitId,
			officeId: invite.officeId,
			designationId: invite.designationId,
			status: Status.ACTIVE,
			createdBy: invite.invitedBy,
		});

		// mark invite as used
		await this.inviteRepo.update(invite.id, {
			status: InviteStatus.ACCEPTED,
			acceptedAt: new Date(),
		});

		// 6. audit log
		await this.identityEvents.userCreated({
			userId: identityId,
		});

		return { staffId: newStaff.getStaffId() };
	}

	async registerNewStaff(payload: RegisterStaffPayload) {
		const { authProviderId } = await this.authService.createUser(
			payload.email,
		);

		// generate system uid
		const uuid = this.idGenerator.generate();
		const userId = "USER-" + uuid;

		// create Identity
		const identity = new Identity({
			id: userId,
			authProviderId,
			email: payload.email,
			phoneNum: payload.phoneNumber,
			status: IdentityStatus.PENDING,
			firstName: payload.firstName,
			lastName: payload.lastName,
			middleName: payload.middleName,
		});

		const newUserIdentity = await this.identityRepo.save({
			authProvider: "firebase",
			identity,
		});

		const identityId = newUserIdentity.getUserId();

		if (newUserIdentity)
			await this.identityEvents.userCreated({
				userId: identityId,
			});

		// create Staff - event emission is handled internally
		const newStaff = await this.addNewStaffUsecase.addNewStaff({
			identityId,
			staffNumber: payload.staffNumber,
			employmentType: payload.employmentType,
			unitId: payload.unitId,
			officeId: payload.officeId,
			designationId: payload.designationId,
			status: Status.PENDING,
			createdBy: payload.createdBy,
		});

		const staffId = newStaff.getStaffId();

		// generate password setup link
		const setupLink = await this.authService.generatePasswordSetupLink(
			payload.email,
			staffId,
		);

		// Send onboarding email
		await this.emailService.sendOnboardingLink(
			newUserIdentity.getEmail(),
			generateNewInviteTemplate(setupLink),
		);

		return { staffId };
	}
}

export default RegisterNewStaffUseCase;
