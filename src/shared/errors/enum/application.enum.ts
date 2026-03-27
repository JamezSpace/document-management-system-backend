import { StatusCodes } from "http-status-codes";

export const ApplicationErrorEnum = {
    INVALID_CREDENTIALS: {
        codeName: "invalid_credentials",
        httpStatusCode: StatusCodes.BAD_REQUEST
    },
    INCOMPLETE_REQUEST: {
        codeName: "invalid_credentials",
        httpStatusCode: StatusCodes.BAD_REQUEST
    },
    ROLE_NOT_FOUND: {
        codeName: "role_not_found",
        httpStatusCode: StatusCodes.NOT_FOUND
    },
    IDENTITY_NOT_FOUND: {
        codeName: "identity_not_found",
        httpStatusCode: StatusCodes.NOT_FOUND
    },
    STAFF_NOT_FOUND: {
        codeName: "staff_not_found",
        httpStatusCode: StatusCodes.NOT_FOUND
    },
    APPROVER_NOT_FOUND: {
        codeName: "approver_not_found",
        httpStatusCode: StatusCodes.NOT_FOUND
    },
    TASK_NOT_FOUND: {
        codeName: "task_not_found",
        httpStatusCode: StatusCodes.NOT_FOUND
    },
    WRKFLOW_NOT_FOUND: {
        codeName: "workflow_instance_not_found",
        httpStatusCode: StatusCodes.NOT_FOUND
    },
    MEDIA_NOT_FOUND: {
        codeName: "media_not_found",
        httpStatusCode: StatusCodes.NOT_FOUND
    },
    DOCUMENT_NOT_FOUND: {
        codeName: "document_not_found",
        httpStatusCode: StatusCodes.NOT_FOUND
    },
    POLICY_NOT_FOUND: {
        codeName: "policy_not_found",
        httpStatusCode: StatusCodes.NOT_FOUND
    },
    CONFLICT: {
        codeName: "conflict",
        httpStatusCode: StatusCodes.CONFLICT
    },
    USER_NOT_AUTHENTICATED: {
        codeName: "user_not_authenticated",
        httpStatusCode: StatusCodes.UNAUTHORIZED
    },
    USER_NOT_AUTHORIZED: {
        codeName: "user_not_authorized",
        httpStatusCode: StatusCodes.FORBIDDEN
    },
    NOT_ALLOWED: {
        codeName: "not_allowed",
        httpStatusCode: StatusCodes.FORBIDDEN
    }
} as const;

export type ApplicationErrorType =
    typeof ApplicationErrorEnum[keyof typeof ApplicationErrorEnum];