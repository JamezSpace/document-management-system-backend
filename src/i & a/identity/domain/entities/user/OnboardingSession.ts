import type { OnboardingSessionStatus } from "../../enum/onboardingSessionStatus.enum.js";

interface PrimaryData {
	firstName: string;
	lastName: string;
	middleName: string;
	email: string;
	staffId: string;
}

interface OnboardingSessionPayload {
	id: string;
	invite_id: string;
	email: string;

	current_step: number;
	primary_data?: PrimaryData;
	profile_picture_media_id?: string;
	signature_media_id?: string;

	status: OnboardingSessionStatus;
	started_at: Date;
	last_active_at?: Date;
	completed_at?: Date;
}

class OnboardingSession {
	id: string;
	invite_id: string;
	email: string;

	current_step: number;
	primary_data: PrimaryData | null;
	profile_picture_media_id: string | null;
	signature_media_id: string | null;

	status: OnboardingSessionStatus;
	started_at: Date;
	last_active_at: Date | null;
	completed_at: Date | null;

	constructor(payload: OnboardingSessionPayload) {
		this.id = payload.id;
		this.invite_id = payload.invite_id;
		this.email = payload.email;
		this.current_step = payload.current_step;
		this.primary_data = payload.primary_data ?? null;
		this.profile_picture_media_id =
			payload.profile_picture_media_id ?? null;
		this.signature_media_id = payload.signature_media_id ?? null;
		this.status = payload.status;
		this.started_at = payload.started_at;
		this.last_active_at = payload.last_active_at ?? null;
		this.completed_at = payload.completed_at ?? null;
	}
}

export default OnboardingSession;
export type {PrimaryData};
