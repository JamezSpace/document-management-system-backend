import { BAD_REQUEST, StatusCodes } from "http-status-codes";

export const ApiErrorEnum = {
    NOT_FOUND: {
        codeName: "resource_not_found",
        httpStatusCode: StatusCodes.NOT_FOUND
    },
    BAD_REQUEST: {
        codeName: "invalid_credentials",
        httpStatusCode: StatusCodes.BAD_REQUEST
    },
} as const;

export type ApiErrorType = typeof ApiErrorEnum[keyof typeof ApiErrorEnum];