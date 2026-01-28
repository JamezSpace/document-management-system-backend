/**
 * This enumerates all the valid states a document can be in. Refer to the "state machine" for more information on this
 */
enum DocumentState {
	DRAFT = "DRAFT",
	SUBMITTED = "SUBMITTED",
	APPROVED = "APPROVED",
	REJECTED = "REJECTED",
	ARCHIVED = "ARCHIVED",
}

export default DocumentState;
