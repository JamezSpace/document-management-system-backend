/**
 * This enumerates all the states of a user. Refer to the "state machine" for more information on this.
 */
enum IdentityState {
    NOT_AUTHENTICATED = "Not Authenticated",
    AUTHENTICATED = "Authenticated",
}

enum Action {
    VIEW_DOCUMENT = "View Document",
    SUBMIT_DOCUMENT = "Submit Document",
    APPROVE_DOCUMENT = "Approve Document",
    REJECT_DOCUMENT = "Reject Document"
}

export { IdentityState, Action };