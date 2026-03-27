import { AccessDomainErrors } from "../../../shared/errors/enum/domain.enum.js";
import AccessDomainError from "./errors/AccessDomainError.js";
import type Role from "./role/Role.js";

interface RoleAssignmentDTO {
	identityId: string;
	role: Role;
	validFrom: Date;
	delegatedBy?: string;
	validTo?: Date;
}

/**
 * This class "RoleAssignment" represents the assignment of roles to a staff member for a duration.
 * It is responsible for "James is Director from Jan 1 to Mar 30, delegated by CEO"
 *
 * Note the following:
 * - delegatedBy is only null in the instance where the role is the person's official role
 * - if delegatedBy is defined, then the validTo field must be defined as well (every delegation of role must have an expiry date)
 *
 */
class RoleAssignment {
	readonly staffId: string;
	readonly role: Role;
	readonly validFrom: Date;
	readonly delegatedBy?: string | undefined;
	private validTo?: Date | undefined;

	constructor(dto: RoleAssignmentDTO) {
		this.staffId = dto.identityId;
		this.role = dto.role;
		this.validFrom = dto.validFrom;

		if (dto.delegatedBy && !dto.validTo) {
			throw new AccessDomainError(
				AccessDomainErrors.DELEGATED_ROLE_MISSING_EXPIRY,
			);
		}

		this.delegatedBy = dto.delegatedBy;
		this.validTo = dto.validTo;
	}

	isActive(): boolean {
		const currentDate = new Date();

		if (currentDate < this.validFrom) return false;
		if (this.validTo && currentDate > this.validTo) return false;

		return true;
	}

	close(revokedAt: Date): void {
		if (revokedAt < this.validFrom) {
			throw new AccessDomainError(
				AccessDomainErrors.INVALID_ROLE_REVOCATION_DATE,
			);
		}

		if (this.validTo && revokedAt >= this.validTo) {
			throw new AccessDomainError(AccessDomainErrors.ROLE_ALREADY_CLOSED);
		}

		this.validTo = revokedAt;
	}
}

export default RoleAssignment;
