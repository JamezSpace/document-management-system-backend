import UnauthorizedError from "../../api/errors/Unauthorized.error.js";
import type { AuthService } from "../../application/ports/AuthService.port.js";
import firebaseApp from "./Firebase.config.js";
import { type Auth, getAuth } from "firebase-admin/auth";

class FirebaseAuthAdapter implements AuthService {
    private authInstance !: Auth

    constructor() {
        this.authInstance = getAuth(firebaseApp)
    }

    async verifyIdToken(token: string) {
        try {
            const decodedToken = await this.authInstance.verifyIdToken(token, true)

            console.log("decoded", decodedToken);
            
            return decodedToken.uid;
        } catch (error: any) {
            console.log("firebase adapter error:", error);

            if(error.code.includes('id-token-expired'))
                throw new UnauthorizedError({
                errorCode: "AUTH_MIDDLEWARE_03",
                errorMessage: "Unauthenticated",
                details: "Firebase ID token has expired"
            }) 
        }
    }


}

export default FirebaseAuthAdapter;