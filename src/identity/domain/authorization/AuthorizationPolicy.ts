import Identity from "../Identity.js";
import { ActionToBeAuthorized } from "./types/ActionToBeAuthorized.js";
import type { AuthorizationResource } from "../../application/types/AuthorizationResource.type.js";

class AuthorizationPolicy {
	static canPerform(
		identity: Identity,
		action: ActionToBeAuthorized,
		resource: AuthorizationResource,
	): boolean {
		if (!identity.isAuthenticated()) return false;

		if (identity.hasRole("admin")) return true;

		if (identity.hasRole("editor")) {
			return [
				ActionToBeAuthorized.VIEW_DOCUMENT,
				ActionToBeAuthorized.SUBMIT_DOCUMENT,
			].includes(action);
		}

		if (identity.hasRole("approver")) {
			return [
				ActionToBeAuthorized.VIEW_DOCUMENT,
				ActionToBeAuthorized.APPROVE_DOCUMENT,
				ActionToBeAuthorized.REJECT_DOCUMENT,
			].includes(action);
		}

		return false;
	}
}

export default AuthorizationPolicy;
