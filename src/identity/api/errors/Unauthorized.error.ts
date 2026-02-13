import { StatusCodes } from "http-status-codes";
import type { GenericError } from "../../../shared/api/types/GenericError.type.js";

class UnauthorizedError implements GenericError {
    httpStatusCode = StatusCodes.UNAUTHORIZED;

    // this is just a string containing the operation e.g AUTH_001
    errorCode !: string;

    errorMessage !: string;

    details?: string;

    constructor(error: {errorCode: string, errorMessage: string, details?: string}) {
        this.errorCode = error.errorCode;
        this.errorMessage = error.errorMessage

        if(error.details) this.details = error.details;
    }

}

export default UnauthorizedError;