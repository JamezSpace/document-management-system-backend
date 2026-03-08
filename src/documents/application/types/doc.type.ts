import type { LifecycleActions } from "../../domain/enum/lifecycleActions.enum.js";
import type { ClassificationMetadata } from "../../domain/metadata/Classification.metadata.js";

interface DocumentTypeForCreation {
    ownerId: string;
    title: string;

    classification: ClassificationMetadata;
    action: LifecycleActions;
}

export type {DocumentTypeForCreation};