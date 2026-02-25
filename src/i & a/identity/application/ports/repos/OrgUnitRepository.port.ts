import type OrganizationalUnit from "../../../domain/OrganizationalUnit.js";

interface OrgUnitRepository {
    save(orgUnit: OrganizationalUnit): Promise<OrganizationalUnit>;

    findOrgUnitById(id: string): Promise<OrganizationalUnit | null>;

    findAllUnitsBySector(sector: string): Promise<OrganizationalUnit[]>;

    fetchAllUnits(): Promise<OrganizationalUnit[]>
}

export type {OrgUnitRepository};