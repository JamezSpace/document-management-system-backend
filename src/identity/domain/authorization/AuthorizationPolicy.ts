import Identity from "../Identity.js";
import { Action } from "../IdentityState.js";
import type { AuthorizationResource } from "../../application/types/AuthorizationResource.type.js";

class AuthorizationPolicy {
  static canPerform(
    identity: Identity,
    action: Action,
    resource: AuthorizationResource
  ): boolean {

    if (!identity.isAuthenticated()) return false;

    if (identity.hasRole("admin")) return true;

    if (identity.hasRole("editor")) {
      return [Action.VIEW_DOCUMENT, Action.SUBMIT_DOCUMENT].includes(action);
    }

    if (identity.hasRole("approver")) {
      return [
        Action.VIEW_DOCUMENT,
        Action.APPROVE_DOCUMENT,
        Action.REJECT_DOCUMENT
      ].includes(action);
    }

    return false;
  }
}

export default AuthorizationPolicy;
