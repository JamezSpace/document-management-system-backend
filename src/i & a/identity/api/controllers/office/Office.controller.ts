import type AddNewOfficeUseCase from "../../../application/usecases/office/AddNewOffice.usecase.js";
import type GetAllOfficesUseCase from "../../../application/usecases/office/GetAllOffices.usecase.js";
import type { CreateOfficeType } from "../../types/office.type.js";

class OfficeController {
    constructor(private readonly addOfficeUseCase: AddNewOfficeUseCase, private readonly getAllOfficesUseCase: GetAllOfficesUseCase){}

    async addNewOffice(payload: CreateOfficeType) {
        const newOffice = await this.addOfficeUseCase.addNewOffice(payload)

        return newOffice;
    }

    async getAllOffices() {
        const allUnits = this.getAllOfficesUseCase.getAllOffices()

        return allUnits;
    }
}

export default OfficeController;