import type { DocumentType } from "../../domain/enum/documentTypes.enum.js";
import type { LifecycleActions } from "../../domain/enum/lifecycleActions.enum.js";
import type { ClassificationMetadata } from "../../domain/metadata/Classification.metadata.js";

interface DocumentTypeForCreation {
    ownerId: string;
    title: string;
    
    type: DocumentType;
    action: LifecycleActions;
    classification: ClassificationMetadata;
}

export type {DocumentTypeForCreation};