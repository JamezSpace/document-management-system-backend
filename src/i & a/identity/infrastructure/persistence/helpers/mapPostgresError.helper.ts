import { GlobalInfrastructureErrors, type InfrastructureErrorType, type PersistenceErrorsType } from "../../../../../shared/errors/enum/infrastructure.enum.js";

export function mapPostgresError(err: any): PersistenceErrorsType {
    // checking for Postgres unique constraint violation
    if (err?.code === "23505") {
        return GlobalInfrastructureErrors.persistence;
    }

    // add more Postgres error mappings here if needed
    // e.g., foreign key violation = '23503'

    // Default generic persistence error
    return GlobalInfrastructureErrors.persistence;
}