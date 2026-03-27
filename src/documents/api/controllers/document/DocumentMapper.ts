import Document from "../../../domain/entities/document/Document.js";
import DocumentVersion from "../../../domain/entities/document/DocumentVersion.js";
import type { DocumentSchemaType } from "../../types/document.type.js";

class DocumentMapper {
  static toDomain(doc: DocumentSchemaType): Document {
    const version = doc.currentVersion
      ? new DocumentVersion({
          id: doc.currentVersion.id,
          documentId: doc.id,
          contentDelta: doc.currentVersion.contentDelta,
          versionNumber: doc.currentVersion.versionNumber,
          mediaId: doc.currentVersion.mediaId ?? null,
          createdAt: new Date(doc.currentVersion.createdAt),
          createdBy: doc.currentVersion.createdBy,
          lifecycle: {
            currentState: doc.currentVersion.lifecycle.currentState,
            stateEnteredAt: new Date(doc.currentVersion.lifecycle.stateEnteredAt),
            stateEnteredBy: doc.currentVersion.lifecycle.stateEnteredBy,
          },
        })
      : null;

    return new Document({
      ...doc,
      version,
      classification: {
        ...doc.classification,
        classifiedAt: new Date(doc.classification.classifiedAt),
        lastReclassifiedAt: doc.classification.lastReclassifiedAt
          ? new Date(doc.classification.lastReclassifiedAt)
          : null,
        lastReclassifiedBy:
          doc.classification.lastReclassifiedBy &&
          doc.classification.lastReclassifiedBy.trim() !== ""
            ? doc.classification.lastReclassifiedBy
            : null,
      },
      retention: {
        ...doc.retention,
        retentionStartDate: new Date(doc.retention.retentionStartDate),
        disposalEligibilityDate: new Date(doc.retention.disposalEligibilityDate),
      },
      createdAt: new Date(doc.createdAt),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : null,
    });
  }
}

export default DocumentMapper;