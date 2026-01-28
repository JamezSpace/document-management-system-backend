import DomainError from "../../shared/errors/DomainError.js";
import DomainErrorTypes from "../../shared/errors/types/DomainErrorTypes.js";
import {IdentityState, Action} from "./IdentityState.js";
import IdentityTransition from "./IdentityStateTransition.js";


interface IdentityDTO {
    userId: string;
    roles: string[];
    initialState: IdentityState;
}

class Identity {
    readonly userId: string;
    readonly roles: Set<string>;
    readonly createdAt: Date;
    private state: IdentityState;

    constructor(identity : IdentityDTO) {
        this.userId = identity.userId;
        this.roles = new Set(identity.roles);
        this.createdAt = new Date();
        this.state = identity.initialState;
    }

    public getState(): IdentityState {
        return this.state;
    }

    public authenticate()  {
        IdentityTransition.assertCanAuthenticate(this.state);
        
        this.state = IdentityState.AUTHENTICATED;
    }

    private canPerformAction(action: Action): boolean {

        // this prevents user from approving or rejecting documents if they are only editors, that is, they can only submit and view documents
        if (this.roles.has("editor") && (action === Action.SUBMIT_DOCUMENT || action !== Action.VIEW_DOCUMENT)) {
            return true;
        }

        // this prevents user from submitting documents if they are only approvers, that is, they can only view, approve and reject documents
        if(this.roles.has("approver") && [Action.VIEW_DOCUMENT, Action.APPROVE_DOCUMENT, Action.REJECT_DOCUMENT].includes(action)) {
            return true
        }


        if (this.roles.has("admin")) return true;

        return false;
    }

    public authorize(action: Action) {
        IdentityTransition.assertIsAuthenticated(this.state);

        if(!this.canPerformAction(action)) {
            throw new DomainError(DomainErrorTypes.USER_NOT_AUTHORIZED, {
                currentState: this.state,
                targetState: IdentityState.AUTHORIZED,
                details: {
                    attemptedAction: action,
                    userRoles: Array.from(this.roles)
                }
            });
        }
        
        this.state = IdentityState.AUTHORIZED;
    }
}

export default Identity;