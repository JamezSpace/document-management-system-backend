import OrganizationalUnit from "../../domain/OrganizationalUnit.js";
import type { OrgUnitEvents } from "../ports/events/OrgUnitEvents.port.js";
import type { OrgUnitRepository } from "../ports/repos/OrgUnitRepository.port.js";
import type { OrgUnit } from "../types/orgUnit.type.js";

class AddNewOrgUnitUseCase {
	constructor(
		private readonly unitEvents: OrgUnitEvents,
		private readonly unitRepo: OrgUnitRepository,
	) {}

    async addNewOrgUnit(payload: OrgUnit) {
        const newOrgUnit = new OrganizationalUnit(payload);

        const newlySavedUnit = await this.unitRepo.save(newOrgUnit)

        await this.unitEvents.unitCreated({
            unitId: newlySavedUnit.id
        })

        return newlySavedUnit;
    }
}

export default AddNewOrgUnitUseCase;