import type { StatusCodes } from "http-status-codes";
import type { NexusAppError } from "./api/nexusAppError.type.js";
import type { DomainErrorType } from "./enum/domain.enum.js";

interface StateDetails {
	currentState: string | null;
	targetState: string;
	details?: Record<string, any>;
}

/**
 * This is a global error class for all domains of all subsystems
 */
class DomainError extends Error implements NexusAppError {
	readonly code: DomainErrorType;
	readonly context: StateDetails;

	httpStatusCode: StatusCodes;
	errorCode: string;
	details?: Record<string, any>;


	constructor(code: DomainErrorType, context: StateDetails) {
		// constructor call to parent class 'Error'
		super(code.codeName);

		this.code = code;
		this.context = context;

        this.errorCode = code.codeName;
        this.httpStatusCode = code.httpStatusCode;

        if (context.details) {
            this.details = context.details;
        }

		// properly sets the class 'DomainError' to be an instanceOf 'Error' class
		Object.setPrototypeOf(this, DomainError.prototype);
	}
}

export default DomainError;
