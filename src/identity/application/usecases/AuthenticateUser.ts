import ApplicationError from "../../../shared/errors/ApplicationError.js";
import ApplicationErrorTypes from "../../../shared/errors/types/ApplicationErrorTypes.js";
import type { IdentityRepositoryPort } from "../ports/IdentityRepository.port.js";
import type { IdentityEventsPort } from "../ports/IdentityEvents.port.js";

interface AuthenticatedExternalUser {
    externalAuthId: string;
}

interface AuthenticateUserInput {
  externalUser: AuthenticatedExternalUser;
}

class AuthenticateUser {
    private readonly identityRepository: IdentityRepositoryPort;
    private readonly identityEvents: IdentityEventsPort

    constructor(private repoInstance: IdentityRepositoryPort, private identityEventBus: IdentityEventsPort) {
        this.identityRepository = repoInstance;
        this.identityEvents = identityEventBus;
    }

    async authenticateUser(input: AuthenticateUserInput){
        // pull user's identity from repo after authentication with external provider
        const userIdentity = await this.identityRepository.findIdentityByExternalAuthId(input.externalUser.externalAuthId);
        if(!userIdentity) throw new ApplicationError(ApplicationErrorTypes.IDENTITY_NOT_FOUND, {
            message:"User authenticated externally but has no system identity",
            details: {
                externalAuthId: input.externalUser.externalAuthId
            }
        })

        // authenticate user
        userIdentity.authenticate();

        // persist identity state
        await this.identityRepository.save(userIdentity);

        // emit user authenticated event
        await this.identityEvents.userAuthenticated({
            userId: userIdentity.userId,
            roles: Array.from(userIdentity.roles)
        });
        
        // return userId
        return userIdentity.userId;
    }
}

export default AuthenticateUser;