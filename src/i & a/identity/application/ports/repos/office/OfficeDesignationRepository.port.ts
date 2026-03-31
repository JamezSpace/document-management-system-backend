import type OfficeDesignation from "../../../../domain/entities/office/OfficeDesignation.js";

interface OfficeDesignationRepositoryPort {
	save(office: OfficeDesignation): Promise<OfficeDesignation>;

	findOfficeDesignationById(id: string): Promise<OfficeDesignation | null>;

	fetchAll(): Promise<OfficeDesignation[]>;

	fetchAllDesignationsWithinAnOffice(
		officeId: string,
	): Promise<{ 
        officeName: string;
        designations: OfficeDesignation[] }>;
}

export type { OfficeDesignationRepositoryPort };

