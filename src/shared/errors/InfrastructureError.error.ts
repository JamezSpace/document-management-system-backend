import type { StatusCodes } from "http-status-codes";
import type { NexusAppError } from "./api/nexusAppError.type.js";
import type {
	Category,
	InfrastructureErrorType,
} from "./enum/infrastructure.enum.js";

interface ErrorContext {
	category: Category;
	message: string;
	table?: string;
	column?: string;
}

class InfrastructureError extends Error implements NexusAppError {
	readonly code: InfrastructureErrorType;
	readonly context: ErrorContext;

	httpStatusCode: StatusCodes;
	errorCode: string;
	errorMessage?: string;
	details?: Record<string, any>;

	constructor(code: InfrastructureErrorType, context: ErrorContext) {
		// constructor call to parent class 'Error'
		super(code.codeName);

		this.code = code;
		this.context = context;
        this.errorMessage = context.message;
		this.errorCode = code.codeName;
		this.httpStatusCode = code.httpStatusCode;

		if (context) {
			const { message, ...contextDetails } = context;
			this.details = contextDetails;
		}

		// properly sets the class 'ApplicationError' to be an instanceOf 'Error' class
		Object.setPrototypeOf(this, InfrastructureError.prototype);
	}
}

export default InfrastructureError;
