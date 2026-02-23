import type { DomainErrorCode } from "./enum/domain.enum.js";


interface StateDetails {
    currentState: string | null, 
    targetState: string,
    details?: Record<string, any>
}

/**
 * This is a global error class for all domains of all subsystems
 */
class DomainError extends Error {
    readonly code: DomainErrorCode;
    readonly context: StateDetails;

    constructor(code: DomainErrorCode, context: StateDetails) {
        // constructor call to parent class 'Error'
        super(code);

        this.code = code;
        this.context = context;

        // properly sets the class 'DomainError' to be an instanceOf 'Error' class
        Object.setPrototypeOf(this, DomainError.prototype);
    }
}

export default DomainError;