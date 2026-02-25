import type AddNewOrgUnitUseCase from "../../application/usecases/AddNewOrgUnit.usecase.js";
import type GetAllUnitsUseCase from "../../application/usecases/GetAllUnits.usecase.js";
import type { OrgUnitType } from "../types/orgUnit.type.js";

class OrgUnitController {
    
    // inject use cases here
    constructor(private readonly addOrgUnitUseCase: AddNewOrgUnitUseCase, private readonly getAllUnitsUseCase: GetAllUnitsUseCase){}

    async addNewUnit(payload: OrgUnitType) {
        const newUnit = await this.addOrgUnitUseCase.addNewOrgUnit(payload);

        return newUnit;
    }

    async getAllUnits() {
        const allUnits = this.getAllUnitsUseCase.getAllUnits()

        return allUnits;
    }
}

export default OrgUnitController;