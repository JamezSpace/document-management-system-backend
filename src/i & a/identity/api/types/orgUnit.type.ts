import { Type, type Static } from "@sinclair/typebox";
import { OrganizationalUnitSector } from "../../domain/enum/orgUnitSector.enum.js";

const orgUnitSchema = Type.Recursive((Self) => 
    Type.Object({
        id: Type.String(),
        name: Type.String(),
        sector: Type.Enum(OrganizationalUnitSector),
        unit: Type.String(),
        // Self refers back to the orgUnitSchema itself
        subunits: Type.Array(Self)
    })
);

type OrgUnitType = Static<typeof orgUnitSchema>;

export {
    orgUnitSchema, type OrgUnitType
};