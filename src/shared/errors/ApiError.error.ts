import type { StatusCodes } from "http-status-codes";
import type { NexusAppError } from "./api/nexusAppError.type.js";
import type { ApiErrorType } from "./enum/api.enum.js";

interface ErrorContext {
	message: string;
	details?: any;
}

class ApiError extends Error implements NexusAppError {
	readonly code: ApiErrorType;
	readonly context: ErrorContext;

	errorCode: string;
	errorMessage: string = "";
	httpStatusCode: StatusCodes;

	constructor(code: ApiErrorType, context: ErrorContext) {
		// constructor call to parent class 'Error'
		super(code.codeName);

		this.code = code;
		this.context = context;

		this.errorCode = code.codeName;
		this.httpStatusCode = code.httpStatusCode;
		this.errorMessage = context.message;

		// properly sets the class 'ApplicationError' to be an instanceOf 'Error' class
		Object.setPrototypeOf(this, ApiError.prototype);
	}

	details?: Record<string, any>;
}

export default ApiError;
