import { StatusCodes } from "http-status-codes";

enum Category {
	PERSISTENCE = "persistence",
	AUTH = "auth",
}

const PersistenceErrors = {
	UNIQUE_CONSTRAINT_VIOLATION: {
		codeName: "duplicate_entry",
		httpStatusCode: StatusCodes.CONFLICT,
	},
    NOT_FOUND: {
        codeName: "not_found",
        httpStatusCode: StatusCodes.NOT_FOUND,
    }
} as const;

export const AuthErrors = {
	ID_TOKEN_INVALID: {
		codeName: "id_token_invalid",
		httpStatusCode: StatusCodes.UNAUTHORIZED,
	},
	INVALID_CREDENTIALS: {
		codeName: "invalid_credentials",
		httpStatusCode: StatusCodes.UNAUTHORIZED,
	},
} as const;

// mapping enum values to their respective error sets
const GlobalInfrastructureErrors = {
	[Category.PERSISTENCE]: PersistenceErrors,
	[Category.AUTH]: AuthErrors,
} as const;

type ValueOf<T> = T[keyof T];
type PersistenceErrorsType = typeof PersistenceErrors;
type InfrastructureErrorType =
	| ValueOf<typeof PersistenceErrors>
	| ValueOf<typeof AuthErrors>;

export { GlobalInfrastructureErrors, Category, type PersistenceErrorsType, type InfrastructureErrorType };
