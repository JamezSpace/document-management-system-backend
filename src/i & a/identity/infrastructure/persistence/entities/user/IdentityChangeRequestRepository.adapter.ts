import type { PostgresDb } from "@fastify/postgres";
import type { IdentityChangeRequestRepositoryPort } from "../../../../application/ports/repos/entities/user/IdentityChangeRequestRepository.port.js";
import type { IdentityChangeRequestRecord } from "../../../../application/types/user/selfService.type.js";
import type { TransactionContext } from "../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import InfrastructureError from "../../../../../../shared/errors/InfrastructureError.error.js";
import {
	Category,
} from "../../../../../../shared/errors/enum/infrastructure.enum.js";
import { mapPostgresError } from "../../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";

class IdentityChangeRequestRepositoryAdapter
	implements IdentityChangeRequestRepositoryPort
{
	constructor(private readonly dbPool: PostgresDb) {}

	async saveBatch(
		requests: IdentityChangeRequestRecord[],
		tx: TransactionContext,
	): Promise<void> {
		try {
			for (const request of requests) {
				await tx.client.query(
				`INSERT INTO identity.identity_change_requests (
					id, request_group_id, identity_id, staff_id, field_name,
					previous_value, requested_value, reason, evidence_media_ids,
					status, policy_key, policy_version, decision_reason_code,
					requested_at
				) VALUES (
					$1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9,
					$10, $11, $12, $13, $14
				)`,
				[
					request.id,
					request.requestGroupId,
					request.identityId,
					request.staffId,
					request.fieldName,
					JSON.stringify(request.previousValue),
					JSON.stringify(request.requestedValue),
					request.reason,
					request.evidenceMediaIds,
					request.status,
					request.policyKey,
					request.policyVersion,
					request.decisionReasonCode,
					request.requestedAt,
				],
				);
			}
		} catch (error: unknown) {
			const mapped = mapPostgresError(error);
			throw new InfrastructureError(mapped.summary, {
				category: Category.PERSISTENCE,
				message: mapped.details?.message ?? "Identity change request could not be saved",
				table: mapped.details?.table,
				column: mapped.details?.column,
				cause: error,
			});
		}
	}

	async listByIdentity(identityId: string): Promise<IdentityChangeRequestRecord[]> {
		const result = await this.dbPool.query(
			`SELECT *
			 FROM identity.identity_change_requests
			 WHERE identity_id = $1
			 ORDER BY requested_at DESC, id DESC`,
			[identityId],
		);
		return result.rows.map((row) => ({
			id: row.id,
			requestGroupId: row.request_group_id,
			identityId: row.identity_id,
			staffId: row.staff_id,
			fieldName: row.field_name,
			previousValue: row.previous_value,
			requestedValue: row.requested_value,
			reason: row.reason,
			evidenceMediaIds: row.evidence_media_ids ?? [],
			status: row.status,
			policyKey: row.policy_key,
			policyVersion: row.policy_version,
			decisionReasonCode: row.decision_reason_code,
			requestedAt: new Date(row.requested_at),
			reviewedBy: row.reviewed_by,
			reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
			reviewReason: row.review_reason,
			appliedAt: row.applied_at ? new Date(row.applied_at) : null,
		}));
	}
}

export default IdentityChangeRequestRepositoryAdapter;
