import ApplicationError from "../../../../shared/errors/ApplicationError.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import type { IdentityEventsPort } from "../ports/events/IdentityEvents.port.js";
import type { IdentityRepositoryPort } from "../ports/repos/IdentityRepository.port.js";

class AuthenticateUserUseCase {
    private readonly identityRepository: IdentityRepositoryPort;
    private readonly identityEvents: IdentityEventsPort

    constructor(private repoInstance: IdentityRepositoryPort, private identityEventBus: IdentityEventsPort) {
        this.identityRepository = repoInstance;
        this.identityEvents = identityEventBus;
    }

    async authenticateUser(uid: string){
        // pull user's identity from repo after authentication with external provider
        const userIdentity = await this.identityRepository.findIdentityByUid(uid);

        if(!userIdentity) throw new ApplicationError(ApplicationErrorEnum.IDENTITY_NOT_FOUND, {
            message:"User authenticated externally but has no system identity",
            details: {
                userId: uid
            }
        })

        // emit user authenticated event
        await this.identityEvents.userAuthenticated({
            userId: uid
        });
        
        // return user identity
        return userIdentity;
    }
}

export default AuthenticateUserUseCase;