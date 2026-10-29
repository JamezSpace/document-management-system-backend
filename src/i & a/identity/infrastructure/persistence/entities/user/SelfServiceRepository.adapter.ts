import type { PostgresDb } from "@fastify/postgres";
import type { SelfServiceRepositoryPort } from "../../../../application/ports/repos/entities/user/SelfServiceRepository.port.js";
import type { SelfServiceSettingsRecord } from "../../../../application/types/user/selfService.type.js";
import type { TransactionContext } from "../../../../../../shared/infrastructure/persistence/primary/postgres.js";

class SelfServiceRepositoryAdapter implements SelfServiceRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async findSettings(
		identityId: string,
		staffId: string,
		tx?: TransactionContext,
	): Promise<SelfServiceSettingsRecord | null> {
		const executor = tx?.client ?? this.dbPool;
		const result = await executor.query(
			`SELECT
				u.id AS identity_id,
				s.id AS staff_id,
				u.revision,
				u.first_name,
				u.middle_name,
				u.last_name,
				u.email,
				u.phone_number,
				s.staff_number,
				s.employment_type,
				s.status,
				unit.id AS unit_id,
				unit.full_name AS unit_name,
				office.id AS office_id,
				office.name AS office_name,
				designation.id AS designation_id,
				designation.title AS designation_title,
				profile.object_key AS profile_object_key,
				profile.format AS profile_format,
				profile.uploaded_at AS profile_updated_at,
				(signature.id IS NOT NULL) AS signature_present,
				signature.uploaded_at AS signature_updated_at
			FROM identity.users u
			JOIN identity.staff s ON s.identity_id = u.id
			LEFT JOIN identity.organizational_units unit ON unit.id = s.unit_id
			LEFT JOIN identity.offices office ON office.id = s.office_id
			LEFT JOIN identity.designations designation ON designation.id = s.designation_id
			LEFT JOIN LATERAL (
				SELECT media.object_key, media.format, media.uploaded_at
				FROM identity.staff_media_assets link
				JOIN media.media_assets media ON media.id = link.media_id
				WHERE link.staff_id = s.id
				  AND upper(link.asset_role) = 'PROFILE_PICTURE'
				  AND link.is_active = TRUE
				ORDER BY link.assigned_at DESC
				LIMIT 1
			) profile ON TRUE
			LEFT JOIN LATERAL (
				SELECT media.id, media.uploaded_at
				FROM identity.staff_media_assets link
				JOIN media.media_assets media ON media.id = link.media_id
				WHERE link.staff_id = s.id
				  AND upper(link.asset_role) = 'SIGNATURE'
				  AND link.is_active = TRUE
				ORDER BY link.assigned_at DESC
				LIMIT 1
			) signature ON TRUE
			WHERE u.id = $1 AND s.id = $2
			LIMIT 1`,
			[identityId, staffId],
		);

		if (result.rows.length === 0) return null;
		const row = result.rows[0];
		return {
			identityId: row.identity_id,
			staffId: row.staff_id,
			revision: Number(row.revision),
			firstName: row.first_name,
			middleName: row.middle_name,
			lastName: row.last_name,
			email: row.email,
			phoneNumber: row.phone_number,
			staffNumber: row.staff_number,
			employmentType: row.employment_type,
			status: row.status,
			unit: { id: row.unit_id, name: row.unit_name },
			office: { id: row.office_id, name: row.office_name },
			designation: { id: row.designation_id, title: row.designation_title },
			profilePicture: row.profile_object_key
				? {
						objectKey: row.profile_object_key,
						format: row.profile_format,
						updatedAt: new Date(row.profile_updated_at),
					}
				: null,
			signature: {
				present: row.signature_present,
				updatedAt: row.signature_updated_at
					? new Date(row.signature_updated_at)
					: null,
			},
		};
	}

	async updatePhoneNumber(
		identityId: string,
		phoneNumber: string,
		expectedRevision: number,
		tx: TransactionContext,
	): Promise<number | null> {
		const result = await tx.client.query<{ revision: string }>(
			`UPDATE identity.users
			 SET phone_number = $1,
			     revision = revision + 1,
			     updated_at = NOW()
			 WHERE id = $2 AND revision = $3
			 RETURNING revision`,
			[phoneNumber, identityId, expectedRevision],
		);
		return result.rows[0] ? Number(result.rows[0].revision) : null;
	}

	async incrementRevision(
		identityId: string,
		expectedRevision: number,
		tx: TransactionContext,
	): Promise<number | null> {
		const result = await tx.client.query<{ revision: string }>(
			`UPDATE identity.users
			 SET revision = revision + 1,
			     updated_at = NOW()
			 WHERE id = $1 AND revision = $2
			 RETURNING revision`,
			[identityId, expectedRevision],
		);
		return result.rows[0] ? Number(result.rows[0].revision) : null;
	}

	async staffOwnsMedia(staffId: string, mediaId: string): Promise<boolean> {
		const result = await this.dbPool.query<{ owned: boolean }>(
			`SELECT EXISTS (
				SELECT 1
				FROM media.media_assets media
				WHERE media.id = $2
				  AND (
					(media.uploaded_by = $1 AND media.uploaded_by_type = 'staff')
					OR EXISTS (
						SELECT 1
						FROM identity.staff_media_assets link
						WHERE link.staff_id = $1 AND link.media_id = media.id
					)
				  )
			) AS owned`,
			[staffId, mediaId],
		);
		return result.rows[0]?.owned ?? false;
	}
}

export default SelfServiceRepositoryAdapter;
