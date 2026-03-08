import type { ClassificationMetadata } from "../../domain/metadata/Classification.metadata.js";

interface DocumentTypeForCreation {
    ownerId: string;
    title: string;

    classification: ClassificationMetadata;
}

export type {DocumentTypeForCreation};