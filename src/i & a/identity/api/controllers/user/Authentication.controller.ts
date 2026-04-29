import type ActivatePendingUserUseCase from "../../../application/usecases/user/ActivatePendingUser.usercase.js";
import type AddNewUserUseCase from "../../../application/usecases/user/AddNewUser.usecase.js";
import type AuthenticateUserUseCase from "../../../application/usecases/user/AuthenticateUser.usecase.js";
import type OnboardingInviteUseCase from "../../../application/usecases/user/invites/OnboardInvite.usecase.js";
import type LoginStaffUseCase from "../../../application/usecases/user/LoginStaff.usecase.js";
import type {
    EditOnboardingSessionType,
    InitOnboardingSessionType,
    UserSignUpType,
} from "../../types/user.type.js";

class AuthenticationController {
	constructor(
        private readonly onboardInviteUseCase: OnboardingInviteUseCase,
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

    async execute(identityId: string) {
        const staff = await this.loginStaffUseCase.execute(identityId);


        return staff;
    }

    async getInvite(token: string) {
        const invite = await this.onboardInviteUseCase.getInvite(token)

        return invite;
    }

    async initOnboardingSession(payload: InitOnboardingSessionType) {
        const newOnboardingSession = await this.onboardInviteUseCase.initOnboardingSession(payload);

        return newOnboardingSession;
    }

    async getOnboardingSession(inviteId: string) {
        const onboardingSession = await this.onboardInviteUseCase.getOnboardingSessionByInviteId(inviteId);

        return onboardingSession;
    }

    async getAllOnboardingSessions() {
        const onboardingSessions = await this.onboardInviteUseCase.getAllOnboardingSessions()

        return onboardingSessions;
    }

	async updateInviteField(
		inviteId: string,
		fieldToUpdate: Parameters<OnboardingInviteUseCase["updateInviteField"]>[1],
		valueToInsert: Parameters<OnboardingInviteUseCase["updateInviteField"]>[2],
	) {
		const updatedInvite = await this.onboardInviteUseCase.updateInviteField(
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
		const updatedSession = await this.onboardInviteUseCase.updateOnboardingSession(
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
		const updatedSession = await this.onboardInviteUseCase.uploadOnboardingMedia(
			sessionId,
			payload,
		);

		return updatedSession;
	}

    async completeOnboardingSession(inviteId: string, sessionId: string, currentStep: number) {
        const completedSession = await this.onboardInviteUseCase.completeOnboardingSession(inviteId, sessionId, currentStep);

		return completedSession;
    }
}

export default AuthenticationController;
