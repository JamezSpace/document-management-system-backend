import type { TransactionContext } from "../../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type OfficeDesignation from "../../../../../domain/entities/office/OfficeDesignation.js";

interface OfficeDesignationRepositoryPort {
	save(office: OfficeDesignation): Promise<OfficeDesignation>;

	findOfficeDesignationById(id: string, tx?:TransactionContext): Promise<OfficeDesignation | null>;

	fetchAll(): Promise<OfficeDesignation[]>;

	fetchAllDesignationsWithinAnOffice(
		officeId: string,
	): Promise<{ 
        officeName: string;
        designations: OfficeDesignation[] }>;
}

export type { OfficeDesignationRepositoryPort };

