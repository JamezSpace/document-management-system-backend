import type { LifecycleActions } from "../../domain/enum/lifecycleActions.enum.js";
import type { ClassificationMetadata } from "../../domain/metadata/Classification.metadata.js";
import type { CorrespondenceMetadata } from "../../domain/metadata/Correspondence.metadata.js";

interface ClassificationMetadataWithFunctionCode extends ClassificationMetadata{
    functionCode: string;
}

interface CorrespondenceMetadataWithSubjectCode extends CorrespondenceMetadata{
    subjectCode: string;
}

interface DocumentTypeForCreation {
    ownerId: string;
    title: string;
    
    action: LifecycleActions;
    classification: ClassificationMetadataWithFunctionCode;
    correspondence: CorrespondenceMetadataWithSubjectCode
}

export type { DocumentTypeForCreation };
