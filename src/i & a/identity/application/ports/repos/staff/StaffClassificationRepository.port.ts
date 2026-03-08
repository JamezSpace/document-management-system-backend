import type StaffClassification from "../../../../domain/entities/staff/StaffClassification.js";

interface StaffClassificationRepositoryPort {
    save(staffClassification: StaffClassification): Promise<StaffClassification>;

    updateStaffClassification(classificationId: string, changesToMake: Partial<StaffClassification>): Promise<StaffClassification>;

    findMostRecentClassificationById(classificationId: string): Promise<StaffClassification | null>;
}

export type { StaffClassificationRepositoryPort };

