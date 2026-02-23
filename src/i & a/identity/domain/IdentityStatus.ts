/**
 * This enumerates all the states of a user. Refer to the "state machine" for more information on this.
 */
enum IdentityStatus {
    PENDING = "pending",
    ACTIVE = "active",
    SUSPENDED = "suspended",
    DEACTIVATED = "deactivated"
}

export { IdentityStatus };
