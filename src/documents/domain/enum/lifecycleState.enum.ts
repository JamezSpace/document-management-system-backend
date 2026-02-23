/**
 * This enum holds the lifecycle states for documents. Note that it is in the past tense, this is because, the documents this enumerates the state the document is, at the moment. It is different from the action!
 * 
 * E.g. the action is 'APRROVE', the lifecycle state of the document after the action is 'APPROVED'.
 */
enum LifecycleState {
  DRAFT = "DRAFT",
  IN_REVIEW = "IN_REVIEW",
  APPROVED = "APPROVED",
  ACTIVE = "ACTIVE",
  DECLARED_RECORD = "DECLARED_RECORD",
  ARCHIVED = "ARCHIVED",
  CANCELLED = "CANCELLED", // The "Soft Delete" state for Drafts/Reviews
  DISPOSED = "DISPOSED"    // The "Legal End-of-Life" state
}

export {
    LifecycleState
}