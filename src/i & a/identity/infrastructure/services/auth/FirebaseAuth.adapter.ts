import { type Auth, getAuth } from "firebase-admin/auth";
import InfrastructureError from "../../../../../shared/errors/InfrastructureError.error.js";
import {
    Category,
    GlobalInfrastructureErrors,
} from "../../../../../shared/errors/enum/infrastructure.enum.js";
import type { AuthService } from "../../../application/ports/services/AuthService.port.js";
import firebaseApp from "./Firebase.config.js";

class FirebaseAuthAdapter implements AuthService {
	private authInstance!: Auth;

	constructor() {
		this.authInstance = getAuth(firebaseApp);
	}

	async verifyIdToken(token: string) {
		try {
			const decodedToken = await this.authInstance.verifyIdToken(
				token,
				true,
			);

			console.log("decoded from firebase auth adapter:", decodedToken);

			return decodedToken.uid;
		} catch (error: any) {
			console.log("firebase adapter error:", error);

			if (
				["auth/id-token-expired", "auth/argument-error"].includes(
					error.code,
				)
			)
				throw new InfrastructureError(
					GlobalInfrastructureErrors.auth.ID_TOKEN_INVALID,
					{
						category: Category.AUTH,
						message: "Firebase ID token has expired",
					},
				);

			// throw new UnauthorizedError({
			//     errorCode: "AUTH_MIDDLEWARE_03",
			//     errorMessage: "Unauthenticated",
			//     details: "Firebase ID token has expired"
			// })
		}
	}

	async createUser(email: string) {
		const userRecord = await this.authInstance.createUser({ email });

		return {
			authProviderId: userRecord.uid,
		};
	}

	async generatePasswordSetupLink(email: string) {
		const link = await this.authInstance.generatePasswordResetLink(email);

		return link;
	}
}

export default FirebaseAuthAdapter;
