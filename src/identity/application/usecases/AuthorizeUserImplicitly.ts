import ApplicationError from "../../../shared/errors/ApplicationError.js";
import ApplicationErrorTypes from "../../../shared/errors/types/ApplicationErrorTypes.js";
import type Identity from "../../domain/Identity.js";

class AuthorizeUserImplicitly {
    private readonly userIdentity: Identity;

    constructor(userIdentity: Identity) {
        this.userIdentity = userIdentity;
    }

    async authorizeUser(){
        if(!this.userIdentity.isAuthenticated()){
            throw new ApplicationError(
                ApplicationErrorTypes.USER_NOT_AUTHENTICATED,
                {
                    message: "User must be authenticated to be implicitly authorized",
                    details: {
                        userId: this.userIdentity.userId
                    }
                }
            );
        }
    }
}

export default AuthorizeUserImplicitly;