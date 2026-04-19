import type ActivatePendingUserUseCase from "../../../application/usecases/user/ActivatePendingUser.usercase.js";
import type AddNewUserUseCase from "../../../application/usecases/user/AddNewUser.usecase.js";
import type AuthenticateUserUseCase from "../../../application/usecases/user/AuthenticateUser.usecase.js";
import type LoginStaffUseCase from "../../../application/usecases/user/LoginStaff.usecase.js";
import type OnboardingEntityUseCase from "../../../application/usecases/user/OnboardEntity.usecase.js";
import type {
	EditOnboardingSessionType,
	InitOnboardingSessionType,
	UserSignUpType,
} from "../../types/user.type.js";

class AuthenticationController {
	constructor(
        private readonly onboardingEntityUseCase: OnboardingEntityUseCase,
		private readonly authenticateUserUseCase: AuthenticateUserUseCase,
		private readonly addNewUserUseCase: AddNewUserUseCase,
		private readonly activatePendingUserUseCase: ActivatePendingUserUseCase,
		private readonly loginStaffUseCase: LoginStaffUseCase
	) {}

	async authenticate(uid: string) {
		const userIdentity =
			await this.authenticateUserUseCase.authenticateUser(uid);

		return userIdentity;
	}

    // manual disjointed approach (not for frontend). Use registerNewStaff of StaffController instead
	async addNewUser(payload: UserSignUpType) {
		const userIdentity = await this.addNewUserUseCase.addNewUser(payload);

		return userIdentity;
	}

	async activatePendingUser(authProviderId: string) {
		const userIdentity =
			await this.activatePendingUserUseCase.activatePendingUser(
				authProviderId,
			);

		return userIdentity;
	}

    async loginStaff(identityId: string) {
        const staff = await this.loginStaffUseCase.loginStaff(identityId);


        return staff;
    }

    async getInvite(token: string) {
        const invite = await this.onboardingEntityUseCase.getInvite(token)

        return invite;
    }

    async initOnboardingSession(payload: InitOnboardingSessionType) {
        const newOnboardingSession = await this.onboardingEntityUseCase.initOnboardingSession(payload);

        return newOnboardingSession;
    }

    async getOnboardingSession(inviteId: string) {
        const onboardingSession = await this.onboardingEntityUseCase.getOnboardingSessionByInviteId(inviteId);

        return onboardingSession;
    }

	async updateInviteField(
		inviteId: string,
		fieldToUpdate: Parameters<OnboardingEntityUseCase["updateInviteField"]>[1],
		valueToInsert: Parameters<OnboardingEntityUseCase["updateInviteField"]>[2],
	) {
		const updatedInvite = await this.onboardingEntityUseCase.updateInviteField(
			inviteId,
			fieldToUpdate,
			valueToInsert,
		);

		return updatedInvite;
	}

	async updateOnboardingSession(
		sessionId: string,
		payload: EditOnboardingSessionType
	) {
		const updatedSession = await this.onboardingEntityUseCase.updateOnboardingSession(
			sessionId,
			payload,
		);

		return updatedSession;
	}

	async uploadOnboardingMedia(
		sessionId: string,
		payload: {
			profilePic?: { buffer: Buffer; mimeType?: string };
			signatureFile?: { buffer: Buffer; mimeType?: string };
			currentStep: number;
		},
	) {
		const updatedSession = await this.onboardingEntityUseCase.uploadOnboardingMedia(
			sessionId,
			payload,
		);

		return updatedSession;
	}

    async completeOnboardingSession(sessionId: string, currentStep: number) {
        const completedSession = await this.onboardingEntityUseCase.completeOnboardingSession(sessionId, currentStep);

		return completedSession;
    }
}

export default AuthenticationController;
