import type { LifecycleActions } from "../../domain/enum/lifecycleActions.enum.js";
import type { ClassificationMetadata } from "../../domain/metadata/Classification.metadata.js";
import type { CorrespondenceMetadata } from "../../domain/metadata/Correspondence.metadata.js";

interface DocumentTypeForCreation {
    ownerId: string;
    title: string;
    
    action: LifecycleActions;
    classification: ClassificationMetadata;
    correspondence: CorrespondenceMetadata
}

export type { DocumentTypeForCreation };
