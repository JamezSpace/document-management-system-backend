import type { IdGeneratorPort } from "../../../../../shared/application/port/IdGenerator.port.js";
import Identity from "../../../domain/entities/user/Identity.js";
import { IdentityStatus } from "../../../domain/entities/user/IdentityStatus.js";
import { Status } from "../../../domain/enum/staff.enum.js";
import type { UserEventsPort } from "../../ports/events/user/UserEvents.port.js";
import type { UserRepositoryPort } from "../../ports/repos/user/UserRepository.port.js";
import type { AuthService } from "../../ports/services/AuthService.port.js";
import type { IdentityEmailServicePort } from "../../ports/services/EmailService.port.js";
import type { RegisterStaffPayload } from "../../types/staff/staff.type.js";
import type AddNewStaffUseCase from "./AddNewStaff.usecase.js";

class RegisterNewStaffUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly identityEvents: UserEventsPort,
		private readonly identityRepo: UserRepositoryPort,
		private readonly addNewStaffUsecase: AddNewStaffUseCase,
		private readonly authService: AuthService,
		private readonly emailService: IdentityEmailServicePort,
	) {}

	async registerNewStaff(payload: RegisterStaffPayload) {
		const { authProviderId } = await this.authService.createUser(
			payload.email,
		);

		// generate system uid
		const uuid = this.idGenerator.generate();
		const userId = "USER-" + uuid;

		// create Identity
		const identity = new Identity({
			uid: userId,
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

		// generate password setup link
		const setupLink = await this.authService.generatePasswordSetupLink(
			payload.email,
		);

		// 3️⃣ Send onboarding email
		await this.emailService.sendOnboardingLink(
			newUserIdentity.getEmail(),
			setupLink,
		);

		return { staffId: newStaff.getStaffId() };
	}
}

export default RegisterNewStaffUseCase;
