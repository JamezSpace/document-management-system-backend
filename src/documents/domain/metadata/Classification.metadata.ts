import type { SensitivityLevel } from "../enum/sensitivityLevel.enum.js";

interface ClassificationMetadata {
  sensitivity: SensitivityLevel
  businessFunctionId: string;
  documentTypeId: string
}

export type { ClassificationMetadata };

