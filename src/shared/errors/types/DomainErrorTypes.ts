enum DomainErrorTypes {
    // identity subsystem
    USER_NOT_AUTHORIZED = "User Not Authorized",
    USER_ALREADY_AUTHENTICATED = "User Already Authenticated",
    USER_NOT_AUTHENTICATED = "User Not Authenticated",

    // document subsystem
    INVALID_DOCUMENT_STATE = "Invalid Document State",

    // workflow subsystem
    INVALID_APPROVAL_STATE = "Invalid Approval State"
}

export default DomainErrorTypes;