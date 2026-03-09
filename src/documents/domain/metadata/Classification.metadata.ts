import type { DocumentType } from "../enum/documentTypes.enum.js";
import type { SensitivityLevel } from "../enum/sensitivityLevel.enum.js";

interface ClassificationMetadata {
  sensitivity: SensitivityLevel
  businessFunctionId: string; // this covers institutional activity, that is, is it 'FINANCIAL', 'ACADEMIC'
  documentType: DocumentType;

  classifiedBy: string;
  classifiedAt: Date;

  lastReclassifiedAt?: Date | null;
  lastReclassifiedBy?: string | null;
}

export type { ClassificationMetadata };

