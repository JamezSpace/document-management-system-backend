import ApplicationError from "../../../shared/errors/ApplicationError.js";
import ApplicationErrorTypes from "../../../shared/errors/types/ApplicationErrorTypes.js";
import type { IdentityRepositoryPort } from "../ports/IdentityRepository.port.js";
import type { IdentityEventsPort } from "../ports/IdentityEvents.port.js";

interface ExternalAuthResponse {
    externalAuthId: string;
}

class AuthenticateUser {
    private readonly identityRepository: IdentityRepositoryPort;
    private readonly identityEvents: IdentityEventsPort

    constructor(private repoInstance: IdentityRepositoryPort, private identityEventBus: IdentityEventsPort) {
        this.identityRepository = repoInstance;
        this.identityEvents = identityEventBus;
    }

    async authenticateUser(externalAuthResponse: ExternalAuthResponse){
        // pull user's identity from repo after authentication with external provider
        const userIdentity = await this.identityRepository.findIdentityByExternalAuthId(externalAuthResponse.externalAuthId);
        if(!userIdentity) throw new ApplicationError(ApplicationErrorTypes.IDENTITY_NOT_FOUND, {
            message:"User authenticated externally but has no system identity",
            details: {
                externalAuthId: externalAuthResponse.externalAuthId
            }
        })

        // authenticate user
        userIdentity.authenticate();

        // persist identity state
        await this.identityRepository.save(userIdentity);

        // emit facts
        await this.identityEvents.userAuthenticated({
            userId: userIdentity.userId,
            roles: Array.from(userIdentity.roles)
        });
        
        // return userId to create session
        return userIdentity.userId;
    }
}

export default AuthenticateUser;