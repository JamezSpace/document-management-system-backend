import type { StatusCodes } from "http-status-codes";
import type { NexusAppError } from "./api/nexusAppError.type.js";
import type { ApplicationErrorType } from "./enum/application.enum.js";

interface ErrorContext {
    message?: string;
    details?: any
}

/**
 * This is a global error class for all application of all subsystems
 */
class ApplicationError extends Error implements NexusAppError {
    readonly code: ApplicationErrorType;
    readonly context: ErrorContext;

    httpStatusCode: StatusCodes;
    errorCode: string;
    errorMessage: string = '';

    constructor(code: ApplicationErrorType, context: ErrorContext) {
        // constructor call to parent class 'Error'
        super(code.codeName);

        this.code = code;
        this.context = context;

        this.errorCode = code.codeName;
        this.httpStatusCode = code.httpStatusCode;

        if (context.message) {
            this.errorMessage = context.message;
        }

        // properly sets the class 'ApplicationError' to be an instanceOf 'Error' class
        Object.setPrototypeOf(this, ApplicationError.prototype)
    }
}

export default ApplicationError;