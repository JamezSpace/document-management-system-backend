import type { OrgUnitEvents } from "../ports/events/OrgUnitEvents.port.js";
import type { OrgUnitRepository } from "../ports/repos/OrgUnitRepository.port.js";

class GetAllUnitsUseCase {
    constructor(private readonly unitEvents: OrgUnitEvents,
		private readonly unitRepo: OrgUnitRepository){}

    async getAllUnits() {
        const allUnits = this.unitRepo.fetchAllUnits()

        return allUnits;
    }
}

export default GetAllUnitsUseCase;