import { StatusCodes } from "http-status-codes";

export const ApplicationErrorEnum = {
    INVALID_CREDENTIALS: {
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
    MEDIA_NOT_FOUND: {
        codeName: "media_not_found",
        httpStatusCode: StatusCodes.NOT_FOUND
    },
    USER_NOT_AUTHENTICATED: {
        codeName: "user_not_authenticated",
        httpStatusCode: StatusCodes.UNAUTHORIZED
    },
    USER_NOT_AUTHORIZED: {
        codeName: "user_not_authorized",
        httpStatusCode: StatusCodes.FORBIDDEN
    }
} as const;

export type ApplicationErrorType =
    typeof ApplicationErrorEnum[keyof typeof ApplicationErrorEnum];