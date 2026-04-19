interface SaveStaffMediaPayload {
	staffId: string;
	mediaId: string;
	assetRole: string;
	isActive?: boolean;
	assignedAt?: Date;
}

interface StaffMediaRepositoryPort {
	save(payload: SaveStaffMediaPayload): Promise<void>;

	deactivateByRole(staffId: string, assetRole: string): Promise<void>;

	assignOnboardingSessionMedia(
		sessionId: string,
		payload: {
			profilePictureMediaId?: string;
			signatureMediaId?: string;
		},
	): Promise<void>;
}

export type { SaveStaffMediaPayload, StaffMediaRepositoryPort };
