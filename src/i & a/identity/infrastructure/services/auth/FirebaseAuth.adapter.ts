import { type Auth, getAuth } from "firebase-admin/auth";
import InfrastructureError from "../../../../../shared/errors/InfrastructureError.error.js";
import {
	Category,
	GlobalInfrastructureErrors,
} from "../../../../../shared/errors/enum/infrastructure.enum.js";
import type { AuthServicePort } from "../../../application/ports/services/AuthService.port.js";
import firebaseApp from "./Firebase.config.js";

class FirebaseAuthAdapter implements AuthServicePort {
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
		try {
			const userRecord = await this.authInstance.createUser({ email });

			return {
				authProviderId: userRecord.uid,
			};
		} catch (error: any) {
			// if(error.code.includes('email-alreay-exists'))
			throw new InfrastructureError(
				GlobalInfrastructureErrors.auth.EMAIL_ALREADY_EXISTS,
				{
					category: Category.AUTH,
					message: error.message,
				},
			);
		}
	}

	async generatePasswordSetupLink(email: string, staffId: string) {
		const link = await this.authInstance.generatePasswordResetLink(email);

		const url = new URL(link);
		const oobCode = url.searchParams.get("oobCode");

		if (!oobCode) {
			throw new Error("Failed to extract oobCode from reset link");
		}

		const customLink = `${process.env.FRONTEND_ORIGIN}/staff/passwordReset?oobCode=${oobCode}&id=${staffId}`;

		return customLink;
	}
}

export default FirebaseAuthAdapter;
