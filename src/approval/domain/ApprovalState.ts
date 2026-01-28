/**
 * This enumerates all the valid states of an approval. Refer to the "state machine" for more information on this.
 */
enum ApprovalState {
    PENDING = "PENDING",
    IN_PROGRESS = "IN PROGRESS",
    COMPLETED = "COMPLETED",
    EXPIRED = "EXPIRED",
    SUPERSEDED = "SUPERSEDED"
}

enum ApprovalSupersedeCause {
    WORKFLOW_RECONFIGURED = "WORKFLOW_RECONFIGURED",
    ESCALATION = "ESCALATION",
    HIGHER_AUTHORITY_OVERRIDE = "HIGHER_AUTHORITY_OVERRIDE",
    POLICY_CHANGE = "POLICY_CHANGE" 
}

export { ApprovalState, ApprovalSupersedeCause }    ;