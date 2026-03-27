import type { IdGeneratorPort } from "../../../../../shared/application/port/services/IdGenerator.port.js";
import OfficeDesignation from "../../../domain/entities/office/OfficeDesignation.js";
import type { OfficeDesignationEventsPort } from "../../ports/events/office/OfficeDesignationEvents.port.js";
import type { OfficeDesignationRepositoryPort } from "../../ports/repos/office/OfficeDesignationRepository.port.js";
import type { OfficeDesignationTypeForCreation } from "../../types/office/officeDesignation.type.js";

class AddNewOfficeDesignationUseCase {
    constructor(
            private readonly idGenerator: IdGeneratorPort,
            private readonly designationEvents: OfficeDesignationEventsPort,
            private readonly designationRepo: OfficeDesignationRepositoryPort,
        ) {}

    async addNewDesignation(payload: OfficeDesignationTypeForCreation) {
        const uuid = this.idGenerator.generate();
		const designationId = "OFFICE-DESIG-" + uuid;

        // create an office designation
        const officeDesignation = payload.description ? new OfficeDesignation({
            id: designationId,
            description: payload.description,
            hierarchyLevel: payload.hierarchyLevel,
            officeId: payload.officeId,
            title: payload.title
        }) : new OfficeDesignation({
            id: designationId,
            hierarchyLevel: payload.hierarchyLevel,
            officeId: payload.officeId,
            title: payload.title
        });

		const newOfficeDesignation = await this.designationRepo.save(officeDesignation)        

		if (newOfficeDesignation)
			await this.designationEvents.officeDesignationCreated({
				designationId: newOfficeDesignation.getOfficeDesignationId(),
			});

		return newOfficeDesignation;
    }
}

export default AddNewOfficeDesignationUseCase;