import type ActivatePendingUserUseCase from "../../application/usecases/ActivatePendingUser.usercase.js";
import AddNewUserUseCase from "../../application/usecases/AddNewUser.usecase.js";
import AuthenticateUserUseCase from "../../application/usecases/AuthenticateUser.usecase.js";
import type { UserSignUpType } from "../types/user.type.js";

class AuthenticationController {
	constructor(
		private readonly authenticateUserUseCase: AuthenticateUserUseCase,
		private readonly addNewUserUseCase: AddNewUserUseCase,
        private readonly activatePendingUserUseCase: ActivatePendingUserUseCase
	) {}

	async authenticate(uid: string) {
		const userIdentity =
			await this.authenticateUserUseCase.authenticateUser(uid);

		return userIdentity;
	}

	async addNewUser(payload: UserSignUpType) {
		const userIdentity = await this.addNewUserUseCase.addNewUser(payload);

		return userIdentity;
	}

    async activatePendingUser(authProviderId: string) {
        const userIdentity = await this.activatePendingUserUseCase.activatePendingUser(authProviderId)

        return userIdentity;
    }
}

export default AuthenticationController;
