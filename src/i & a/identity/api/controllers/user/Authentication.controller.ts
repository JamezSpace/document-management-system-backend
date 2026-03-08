import type ActivatePendingUserUseCase from "../../../application/usecases/user/ActivatePendingUser.usercase.js";
import type AddNewUserUseCase from "../../../application/usecases/user/AddNewUser.usecase.js";
import type AuthenticateUserUseCase from "../../../application/usecases/user/AuthenticateUser.usecase.js";
import type LoginStaffUseCase from "../../../application/usecases/user/LoginStaff.usecase.js";
import type { UserSignUpType } from "../../types/user.type.js";

class AuthenticationController {
	constructor(
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
}

export default AuthenticationController;
