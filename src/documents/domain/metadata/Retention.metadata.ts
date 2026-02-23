import type { DisposalStatus } from "../enum/disposalStatus.enum.js"
import type { RecordStatus } from "../enum/recordStatus.enum.js"


interface RetentionMetadata {
  recordStatus: RecordStatus

  declaredAt?: Date
  declaredByRoleId?: string

  retentionScheduleId?: string
  retentionTriggerDate?: Date
  disposalEligibleAt?: Date

  legalHold: boolean
  auditHold: boolean

  disposalStatus: DisposalStatus
  disposalApprovedByRoleId?: string
  disposalApprovedAt?: Date
  disposalExecutedAt?: Date
}

export type { RetentionMetadata }

