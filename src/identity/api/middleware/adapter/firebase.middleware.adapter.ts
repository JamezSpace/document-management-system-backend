import type { FastifyReply, FastifyRequest } from "fastify";
import type { MiddlewarePort } from "../port/Auth.middleware.port.js";
import UnauthorizedError from "../../errors/Unauthorized.error.js";
import FirebaseAuthAdapter from "../../../infrastructure/auth/FirebaseAuth.adapter.js";

class FirebaseMiddlewareAdapter implements MiddlewarePort {
	authAdapter: FirebaseAuthAdapter;

	constructor() {
		this.authAdapter = new FirebaseAuthAdapter();
	}

    private extractToken(header: string) {
        // asserting not null or undefined because that has been pre-handled in the main fuction
        return header.split(' ')[1];
    }

	validateUserIsAuthenticated = async (
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> => {
		const authHeader = request.headers["authorization"];

		// if auth header isn't present
		if (!authHeader)
			throw new UnauthorizedError({
				errorCode: "AUTH_MIDDLEWARE_01",
				errorMessage: "Unauthenticated",
				details: "Missing Authorization Header",
        });
		else if (!authHeader.startsWith("Bearer")) 
			throw new UnauthorizedError({
		        errorCode: "AUTH_MIDDLEWARE_01",
				errorMessage: "Unauthenticated",
				details: "No 'Bearer' Token provided",
        });

		const token = this.extractToken(authHeader)
        
        if(!token)
            throw new UnauthorizedError({
		        errorCode: "AUTH_MIDDLEWARE_01",
				errorMessage: "Unauthenticated",
				details: "Broken/Incomplete token",})
        
        const user_id = await this.authAdapter.verifyIdToken(token);

		request.user = {
            uid: user_id!
        }

		return;
	}
}

const firebaseMiddlewareAdapterInstance = new FirebaseMiddlewareAdapter();

export default firebaseMiddlewareAdapterInstance;
