import type { PostgresDb } from "@fastify/postgres";
import type {
	SaveStaffMediaPayload,
	StaffMediaRepositoryPort,
} from "../../../application/ports/repos/media/MediaRepository.port.js";
import {
	Category,
	GlobalInfrastructureErrors,
} from "../../../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";

class PostgresStaffMediaRepositoryAdapter implements StaffMediaRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async save(payload: SaveStaffMediaPayload): Promise<void> {
		try {
			const query = `
				INSERT INTO identity.staff_media_assets (
					staff_id,
					media_id,
					asset_role,
					is_active,
					assigned_at
				)
				VALUES ($1,$2,$3,$4,$5)
				ON CONFLICT (staff_id, media_id)
				DO UPDATE SET
					asset_role = EXCLUDED.asset_role,
					is_active = EXCLUDED.is_active,
					assigned_at = EXCLUDED.assigned_at
			`;

			await this.dbPool.query(query, [
				payload.staffId,
				payload.mediaId,
				payload.assetRole,
				payload.isActive ?? false,
				payload.assignedAt ?? new Date(),
			]);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
				table: postgresError.details?.table,
				column: postgresError.details?.column,
			});
		}
	}

	async deactivateByRole(staffId: string, assetRole: string): Promise<void> {
		try {
			const query = `
				UPDATE identity.staff_media_assets
				SET is_active = FALSE
				WHERE staff_id = $1 AND asset_role = $2
			`;

			await this.dbPool.query(query, [staffId, assetRole]);
		} catch (error: any) {
			throw new InfrastructureError(
				GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR,
				{
					category: Category.PERSISTENCE,
					message: error.message,
				},
			);
		}
	}

	async assignOnboardingSessionMedia(
		sessionId: string,
		payload: {
			profilePictureMediaId?: string;
			signatureMediaId?: string;
		},
	): Promise<void> {
		try {
			const updates: string[] = [];
			const values: any[] = [];
			let paramCount = 1;

			if (payload.profilePictureMediaId !== undefined) {
				updates.push(`profile_picture_media_id = $${paramCount++}`);
				values.push(payload.profilePictureMediaId);
			}

			if (payload.signatureMediaId !== undefined) {
				updates.push(`signature_media_id = $${paramCount++}`);
				values.push(payload.signatureMediaId);
			}

			if (updates.length === 0) return;

			values.push(sessionId);

			const query = `
				UPDATE identity.onboarding_sessions
				SET ${updates.join(", ")}
				WHERE id = $${paramCount}
			`;

			await this.dbPool.query(query, values);
		} catch (error: any) {
			throw new InfrastructureError(
				GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR,
				{
					category: Category.PERSISTENCE,
					message: error.message,
				},
			);
		}
	}
}

export default PostgresStaffMediaRepositoryAdapter;
