import type { PostgresDb } from "@fastify/postgres";
import type { OnboardingSessionRepositoryPort } from "../../../application/ports/repos/user/OnboardingSessionRepository.port.js";
import OnboardingSession from "../../../domain/entities/user/OnboardingSession.js";
import { Category, GlobalInfrastructureErrors } from "../../../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import OnboardingSessionView from "../../../domain/views/invites/OnboardingSessionView.js";

class PostgresqlOnboardingSessionRepositoryAdapter implements OnboardingSessionRepositoryPort {
    constructor(private readonly dbPool: PostgresDb) {}

	private toSession(row: any): OnboardingSession {
		return new OnboardingSession({
			id: row.id,
			invite_id: row.invite_id,
			email: row.email,
			current_step: row.current_step,
			primary_data: row.primary_data,
			profile_picture_media_id: row.profile_picture_media_id,
			signature_media_id: row.signature_media_id,
			status: row.status,
			started_at: row.started_at,
			last_active_at: row.last_active_at,
			completed_at: row.completed_at,
		});
	}

	private toSessionView(row: any): OnboardingSessionView {
		return new OnboardingSessionView({
			id: row.id,
			inviteId: row.invite_id,
			email: row.email,
			currentStep: row.current_step,
			primaryData: row.primary_data,
			storageProvider: row.storage_provider,
			profilePictureBucketName: row.profile_picture_bucket_name,
			profilePictureObjectKey: row.profile_picture_object_key,
			signatureBucketName: row.signature_bucket_name,
			signatureObjectKey: row.signature_object_key,
			status: row.status,
			startedAt: row.started_at,
			lastActiveAt: row.last_active_at,
			completedAt: row.completed_at
		});
	}

	async save(payload: OnboardingSession): Promise<OnboardingSession> {
		try {
			const query = `
				INSERT INTO identity.onboarding_sessions (
					id,
					invite_id,
					email,
					current_step,
					primary_data,
					profile_picture_media_id,
					signature_media_id,
					status,
					started_at,
					last_active_at,
					completed_at
				)
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
				RETURNING id, invite_id, email, current_step, primary_data, profile_picture_media_id, signature_media_id, status, started_at, last_active_at, completed_at
			`;

			const result = await this.dbPool.query(query, [
				payload.id,
				payload.invite_id,
				payload.email,
				payload.current_step,
				payload.primary_data,
				payload.profile_picture_media_id,
				payload.signature_media_id,
				payload.status,
				payload.started_at,
				payload.last_active_at,
				payload.completed_at,
			]);

			return this.toSession(result.rows[0]);
		} catch (error: any) {
			console.log("error saving onboarding session", error);

			const err = mapPostgresError(error);

			throw new InfrastructureError(err.summary, {
				category: Category.PERSISTENCE,
				message: err.details?.message ?? error.message,
				table: err.details?.table,
			});
		}
	}

	async findSessionById(sessionId: string): Promise<OnboardingSession | null> {
		try {
			const query =
				"SELECT id, invite_id, email, current_step, primary_data, profile_picture_media_id, signature_media_id, status, started_at, last_active_at, completed_at FROM identity.onboarding_sessions WHERE id = $1 LIMIT 1";
			const result = await this.dbPool.query(query, [sessionId]);

			if (!result.rows || result.rows.length === 0) return null;

			return this.toSession(result.rows[0]);
		} catch (error: any) {
			console.log("error fetching onboarding session by id", error);

			const err = mapPostgresError(error);

			throw new InfrastructureError(err.summary, {
				category: Category.PERSISTENCE,
				message: err.details?.message ?? error.message,
				table: err.details?.table,
			});
		}
	}

	async findSessionByInviteId(
		inviteId: string,
	): Promise<OnboardingSession | null> {
		try {
			const query =
				"SELECT id, invite_id, email, current_step, primary_data, profile_picture_media_id, signature_media_id, status, started_at, last_active_at, completed_at FROM identity.onboarding_sessions WHERE invite_id = $1 LIMIT 1";
			const result = await this.dbPool.query(query, [inviteId]);

			if (!result.rows || result.rows.length === 0) return null;

			return this.toSession(result.rows[0]);
		} catch (error: any) {
			console.log("error fetching onboarding session by invite id", error);

			const err = mapPostgresError(error);

			throw new InfrastructureError(err.summary, {
				category: Category.PERSISTENCE,
				message: err.details?.message ?? error.message,
				table: err.details?.table,
			});
		}
	}

	async update(
		sessionId: string,
		payload: Partial<OnboardingSession>,
	): Promise<OnboardingSession> {
		try {
			const updates: string[] = [];
			const values: any[] = [];
			let paramCount = 1;

			if (payload.email !== undefined) {
				updates.push(`email = $${paramCount++}`);
				values.push(payload.email);
			}
			if (payload.current_step !== undefined) {
				updates.push(`current_step = $${paramCount++}`);
				values.push(payload.current_step);
			}
			if (payload.primary_data !== undefined) {
				updates.push(`primary_data = $${paramCount++}`);
				values.push(payload.primary_data);
			}
			if (payload.profile_picture_media_id !== undefined) {
				updates.push(`profile_picture_media_id = $${paramCount++}`);
				values.push(payload.profile_picture_media_id);
			}
			if (payload.signature_media_id !== undefined) {
				updates.push(`signature_media_id = $${paramCount++}`);
				values.push(payload.signature_media_id);
			}
			if (payload.status !== undefined) {
				updates.push(`status = $${paramCount++}`);
				values.push(payload.status);
			}
			if (payload.last_active_at !== undefined) {
				updates.push(`last_active_at = $${paramCount++}`);
				values.push(payload.last_active_at);
			}
			if (payload.completed_at !== undefined) {
				updates.push(`completed_at = $${paramCount++}`);
				values.push(payload.completed_at);
			}

			if (updates.length === 0) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.INVALID_OPERATION,
					{
						category: Category.PERSISTENCE,
						message: "No changes provided for onboarding session update",
					},
				);
			}

			values.push(sessionId);
			const query = `
				UPDATE identity.onboarding_sessions
				SET ${updates.join(", ")}
				WHERE id = $${paramCount}
				RETURNING id, invite_id, email, current_step, primary_data, profile_picture_media_id, signature_media_id, status, started_at, last_active_at, completed_at
			`;

			const result = await this.dbPool.query(query, values);

			if (!result.rows || result.rows.length === 0) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.NOT_FOUND,
					{
						category: Category.PERSISTENCE,
						message: "Onboarding session not found for update",
					},
				);
			}

			return this.toSession(result.rows[0]);
		} catch (error: any) {
			console.log("error updating onboarding session", error);

			const err = mapPostgresError(error);

			throw new InfrastructureError(err.summary, {
				category: Category.PERSISTENCE,
				message: err.details?.message ?? error.message,
				table: err.details?.table,
			});
		}
	}

    async fetchAll(): Promise<OnboardingSessionView[]> {
        try {
			const query =
				"SELECT * FROM identity.all_onboarding_sessions";

			const result = await this.dbPool.query(query);

			if (!result.rows || result.rows.length === 0) return [];

			return result.rows.map(session => {
                return this.toSessionView(session);
            })
		} catch (error: any) {
			console.log("error fetching onboarding session by invite id", error);

			const err = mapPostgresError(error);

			throw new InfrastructureError(err.summary, {
				category: Category.PERSISTENCE,
				message: err.details?.message ?? error.message,
				table: err.details?.table,
			});
		}
    }
}

export default PostgresqlOnboardingSessionRepositoryAdapter;
