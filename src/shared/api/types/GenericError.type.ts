import type { StatusCodes } from "http-status-codes";

interface GenericError {
    httpStatusCode: StatusCodes

    errorCode: string;

    errorMessage: string;

    details?: string;
}

export type {GenericError}