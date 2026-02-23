import type { OrgUnitType } from "../api/types/orgUnit.type.js";
import type { OrganizationalUnitSector } from "./enum/orgUnitSector.enum.js";

class OrganizationalUnit {
    readonly id !: string;
    readonly name: string;
    readonly sector: OrganizationalUnitSector;
    readonly unit: string;
    readonly subunits: OrganizationalUnit[];

    constructor(payload: OrgUnitType) {
        this.id = payload.id;
        this.name = payload.name;
        this.sector = payload.sector;
        this.unit = payload.unit;
        this.subunits = payload.subunits;
    }
}

export default OrganizationalUnit;