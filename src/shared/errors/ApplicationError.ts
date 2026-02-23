import type { ApplicationErrorEnum } from "./enum/application.enum.js";

interface ErrorContext {
    message?: string;
    details?: any
}

/**
 * This is a global error class for all application of all subsystems
 */
class ApplicationError extends Error {
    readonly code: ApplicationErrorEnum;
    readonly context: ErrorContext;

    constructor(code: ApplicationErrorEnum, context: ErrorContext) {
        // constructor call to parent class 'Error'
        super(code);

        this.code = code;
        this.context = context;

        // properly sets the class 'ApplicationError' to be an instanceOf 'Error' class
        Object.setPrototypeOf(this, ApplicationError.prototype)
    }
}

export default ApplicationError;