import DomainErrorTypes from "./types/DomainErrorTypes.js";

interface StateDetails {
    currentState: string, 
    targetState: string,
    details?: Record<string, any>
}

/**
 * This is a global error class for all domains of all subsystems
 */
class DomainError extends Error {
    readonly code: DomainErrorTypes;
    readonly context: StateDetails;

    constructor(code: DomainErrorTypes, context: StateDetails) {
        // constructor call to parent class 'Error'
        super(code);

        this.code = code;
        this.context = context;

        // properly sets the class 'DomainError' to be an instanceOf 'Error' class
        Object.setPrototypeOf(this, DomainError.prototype);
    }
}

export default DomainError;