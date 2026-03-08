interface RetentionMetadata {
	retentionScheduleId: string;
	retentionStartDate: Date;
	disposalEligibilityDate: Date;
	archivalRequired: boolean;
}

export type { RetentionMetadata };
