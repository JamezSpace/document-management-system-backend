import type { DispatchDocumentPort } from "../../../shared/application/port/intersubsystem/DispatchDocument.port.js";
import type { DispatchStaffPort } from "../../../shared/application/port/intersubsystem/DispatchStaff.port.js";
import type { RecipientResolverPort } from "../port/services/RecipientResolver.port.js";

class RecipientResolverService implements RecipientResolverPort {
    constructor(
        private readonly dispatchDocumentRepo: DispatchDocumentPort,
        private readonly dispatchStaffRepo: DispatchStaffPort,
    ) {}

    async resolveRecipients(input: { documentId: string }) {
        // right now, application allows a correspondence be addressed to one designation (which may include many staffs). For multiple addressees, use the 'getDocAddresseesByDocIdMultiple' method
        const addressee = await this.dispatchDocumentRepo.getDocAddresseeByDocIdSingle(
            input.documentId
        );

        const resolved: Array<{
            staffId: string;
            unitId: string;
            designationId: string;
        }> = [];

        
        const staffs = await this.dispatchStaffRepo.getStaffIdsByDesignationAndUnit({
            designationId: addressee.designationId,
            unitId: addressee.unitId,
        });

        for (const staff of staffs) {
            resolved.push({
                staffId: staff.id,
                unitId: addressee.unitId,
                designationId: addressee.designationId,
            });
        }
    

        return resolved;
    }
}

export default RecipientResolverService;