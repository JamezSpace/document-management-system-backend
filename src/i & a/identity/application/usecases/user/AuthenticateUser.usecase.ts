import ApplicationError from "../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../shared/errors/enum/application.enum.js";
import type { IdentityEventsPort } from "../../ports/events/IdentityEvents.port.js";
import type { IdentityRepositoryPort } from "../../ports/repos/IdentityRepository.port.js";

class AuthenticateUserUseCase {
    private readonly identityRepository: IdentityRepositoryPort;
    private readonly identityEvents: IdentityEventsPort

    constructor(private repoInstance: IdentityRepositoryPort, private identityEventBus: IdentityEventsPort) {
        this.identityRepository = repoInstance;
        this.identityEvents = identityEventBus;
    }

    async authenticateUser(authProviderId: string){
        // pull user's identity from repo after authentication with external provider
        const userIdentity = await this.identityRepository.findIdentityByAuthProviderId(authProviderId);

        if (!userIdentity)
            throw new ApplicationError(ApplicationErrorEnum.IDENTITY_NOT_FOUND, {
            message:"User authenticated externally but has no system identity",
            details: {
                userId: authProviderId
            }
        })

        // emit user authenticated event
        await this.identityEvents.userAuthenticated({
            userId: userIdentity.getUserId()
        });
        
        // return user identity
        return userIdentity;
    }
}

export default AuthenticateUserUseCase;