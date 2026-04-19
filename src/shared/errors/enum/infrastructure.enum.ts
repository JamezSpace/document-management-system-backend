import { StatusCodes } from "http-status-codes";

enum Category {
	PERSISTENCE = "persistence",
	AUTH = "auth",
    SERVICE = "service"
}

const PersistenceErrors = {
	INVALID_OPERATION: {
		codeName: "invalid_operation",
		httpStatusCode: StatusCodes.BAD_REQUEST,
	},
	UNIQUE_CONSTRAINT_VIOLATION: {
		codeName: "duplicate_entry",
		httpStatusCode: StatusCodes.CONFLICT,
	},
    NOT_FOUND: {
        codeName: "not_found",
        httpStatusCode: StatusCodes.NOT_FOUND,
    },
    INVALID_INPUT_VALUE: {
        codeName: "invalid_input",
        httpStatusCode: StatusCodes.NOT_ACCEPTABLE,
    },
    UNREGISTERED_ERROR: {
        codeName: "unregistered_error",
        httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    }
} as const;

const AuthErrors = {
	ID_TOKEN_INVALID: {
		codeName: "id_token_invalid",
		httpStatusCode: StatusCodes.UNAUTHORIZED,
	},
	INVALID_CREDENTIALS: {
		codeName: "invalid_credentials",
		httpStatusCode: StatusCodes.UNAUTHORIZED,
	},
	EMAIL_ALREADY_EXISTS: {
		codeName: "email_already_exists",
		httpStatusCode: StatusCodes.CONFLICT,
	},
} as const;

const ServiceErrors = {
	JWT_TOKEN_INVALID: {
		codeName: "jwt_token_invalid",
		httpStatusCode: StatusCodes.BAD_REQUEST,
	},
	INVALID_TOKEN_FORMAT: {
		codeName: "invalid_token_format",
		httpStatusCode: StatusCodes.BAD_REQUEST,
	},
} as const;

// mapping enum values to their respective error sets
const GlobalInfrastructureErrors = {
	[Category.PERSISTENCE]: PersistenceErrors,
	[Category.AUTH]: AuthErrors,
	[Category.SERVICE]: ServiceErrors,
} as const;

type ValueOf<T> = T[keyof T];
type PersistenceErrorsType = typeof PersistenceErrors;
type InfrastructureErrorType =
	| ValueOf<typeof PersistenceErrors>
	| ValueOf<typeof AuthErrors>
	| ValueOf<typeof ServiceErrors>;

export { GlobalInfrastructureErrors, Category, type PersistenceErrorsType, type InfrastructureErrorType };
