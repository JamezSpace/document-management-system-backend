import AuthenticateUser from "../../application/usecases/AuthenticateUser.js";
import type { AuthenticateUserRequest } from "../types/AuthenticateUserRequest.js";

class AuthController {
	constructor(private authenticateUser: AuthenticateUser) {}

	async authenticate(authenticateUser: AuthenticateUserRequest) {
		const userId = await this.authenticateUser.authenticateUser({
			externalUser: {
				externalAuthId: authenticateUser.externalAuthId,
			},
		});

		return {
			userId,
		};
	}

    async authorizeImplicitly(){
        
    }

    async authorizeContextually(){

    }
}

export default AuthController;
