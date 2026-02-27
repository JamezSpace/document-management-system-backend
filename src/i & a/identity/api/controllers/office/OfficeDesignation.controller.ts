import type AddNewOfficeDesignationUseCase from "../../../application/usecases/office/AddNewDesignation.usecase.js";
import type GetAllOfficeDesignationsUseCase from "../../../application/usecases/office/GetAllOfficeDesignations.usecase.js";
import type { CreateOfficeDesignationType } from "../../types/office.type.js";

class OfficeDesignationController {
	constructor(
		private readonly addOfficeDesignationUseCase: AddNewOfficeDesignationUseCase,
		private readonly getAllOfficeDesignationUseCase: GetAllOfficeDesignationsUseCase,
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

	async getAllOfficeDesignations(officeId: string) {
		const allDesignations =
			this.getAllOfficeDesignationUseCase.getAllDesignationsByOffice(
				officeId,
			);

		return allDesignations;
	}

    async getAllODesignations(officeId: string) {
		const allDesignations =
			this.getAllOfficeDesignationUseCase.getAllDesignations()

		return allDesignations;
	}
}

export default OfficeDesignationController;
