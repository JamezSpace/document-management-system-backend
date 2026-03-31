import type AddNewOfficeDesignationUseCase from "../../../application/usecases/office/AddNewDesignation.usecase.js";
import type GetAllOfficeDesignationUseCase from "../../../application/usecases/office/GetAllOfficeDesignations.usecase.js";
import type { CreateOfficeDesignationType } from "../../types/office.type.js";

class OfficeDesignationController {
	constructor(
		private readonly addOfficeDesignationUseCase: AddNewOfficeDesignationUseCase,
		private readonly getAllOfficeDesignationUseCase: GetAllOfficeDesignationUseCase,
	) {}

	async addNewOfficeDesignation(payload: CreateOfficeDesignationType) {
		const designationPayload: CreateOfficeDesignationType = {
			title: payload.title,
			hierarchyLevel: payload.hierarchyLevel,
			officeId: payload.officeId,
		};

		if (payload.description !== undefined) {
			designationPayload.description = payload.description;
		}

		const newOfficeDesignation =
			await this.addOfficeDesignationUseCase.addNewDesignation(
				designationPayload,
			);

		return newOfficeDesignation;
	}

	async getAllDesignationsWithinAnOffice(officeId: string) {
		const allDesignations =
			this.getAllOfficeDesignationUseCase.getAllDesignationsByOffice(
				officeId,
			);

		return allDesignations;
	}

    async getAllDesignations() {
		const allDesignations =
			this.getAllOfficeDesignationUseCase.getAllDesignations()

		return allDesignations;
	}
}

export default OfficeDesignationController;
