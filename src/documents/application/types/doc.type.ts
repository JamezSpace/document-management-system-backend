import type { CorrespondenceVolume } from "../../domain/enum/correspondenceVolumes.enum.js";
import type { DocumentType } from "../../domain/enum/documentTypes.enum.js";
import type { LifecycleActions } from "../../domain/enum/lifecycleActions.enum.js";
import type { ClassificationMetadata } from "../../domain/metadata/Classification.metadata.js";
import type { CorrespondenceMetadata } from "../../domain/metadata/Correspondence.metadata.js";

interface DocumentTypeForCreation {
    ownerId: string;
    title: string;
    volume: CorrespondenceVolume;
    recipientDeptId: string;
    originUnitId: string;
    
    type: DocumentType;
    action: LifecycleActions;
    classification: ClassificationMetadata;
    correspondence: CorrespondenceMetadata;
}

export type {DocumentTypeForCreation};