import type { DocumentType } from "../../../shared/application/enum/documentTypes.enum.js";
import type { SensitivityLevel } from "../enum/sensitivityLevel.enum.js";

interface ClassificationMetadata {
  sensitivity: SensitivityLevel;
  functionCodeId: string;
  documentType: DocumentType;

  classifiedBy: string;
  classifiedAt: Date;

  lastReclassifiedAt?: Date | null;
  lastReclassifiedBy?: string | null;
}

export type { ClassificationMetadata };

