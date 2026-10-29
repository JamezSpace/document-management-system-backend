ALTER TABLE identity.users
	ADD COLUMN IF NOT EXISTS revision BIGINT NOT NULL DEFAULT 1;

ALTER TABLE identity.users
	DROP CONSTRAINT IF EXISTS identity_user_revision_positive;

ALTER TABLE identity.users
	ADD CONSTRAINT identity_user_revision_positive CHECK (revision > 0);

CREATE TABLE IF NOT EXISTS policy.identity_governance_policies (
	id VARCHAR(80) PRIMARY KEY,
	policy_key VARCHAR(100) NOT NULL,
	policy_version INT NOT NULL CHECK (policy_version > 0),
	schema_version INT NOT NULL CHECK (schema_version > 0),
	status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'active', 'retired')),
	effective_from TIMESTAMPTZ NOT NULL,
	effective_to TIMESTAMPTZ,
	definition_checksum CHAR(64) NOT NULL CHECK (
		definition_checksum ~ '^[0-9a-fA-F]{64}$'
	),
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	approved_by VARCHAR(50) REFERENCES identity.staff(id),
	approval_reason TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	approved_at TIMESTAMPTZ,
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (
		jsonb_typeof(metadata) = 'object'
	),
	UNIQUE (policy_key, policy_version),
	CHECK (effective_to IS NULL OR effective_to > effective_from),
	CHECK (
		status = 'draft'
		OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)
	)
);

CREATE UNIQUE INDEX IF NOT EXISTS identity_governance_one_active_policy
	ON policy.identity_governance_policies(policy_key)
	WHERE status = 'active';

CREATE TABLE IF NOT EXISTS policy.identity_governance_rules (
	id VARCHAR(80) PRIMARY KEY,
	governance_policy_id VARCHAR(80) NOT NULL
		REFERENCES policy.identity_governance_policies(id) ON DELETE CASCADE,
	field_name VARCHAR(80) NOT NULL,
	mode VARCHAR(30) NOT NULL CHECK (
		mode IN ('direct', 'verification_required', 'approval_required', 'read_only')
	),
	requirements TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
	reason_code VARCHAR(120) NOT NULL,
	priority INT NOT NULL DEFAULT 100 CHECK (priority >= 0),
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (governance_policy_id, field_name)
);

CREATE INDEX IF NOT EXISTS identity_governance_rule_lookup
	ON policy.identity_governance_rules(governance_policy_id, field_name, priority);

CREATE TABLE IF NOT EXISTS identity.identity_change_requests (
	id VARCHAR(80) PRIMARY KEY,
	request_group_id VARCHAR(80) NOT NULL,
	identity_id VARCHAR(50) NOT NULL REFERENCES identity.users(id),
	staff_id VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	field_name VARCHAR(80) NOT NULL,
	previous_value JSONB NOT NULL,
	requested_value JSONB NOT NULL,
	reason TEXT NOT NULL CHECK (length(trim(reason)) >= 2),
	evidence_media_ids VARCHAR(80)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(80)[],
	status VARCHAR(30) NOT NULL CHECK (
		status IN ('pending', 'approved', 'rejected', 'applied', 'cancelled')
	),
	policy_key VARCHAR(100) NOT NULL,
	policy_version INT NOT NULL CHECK (policy_version > 0),
	decision_reason_code VARCHAR(120) NOT NULL,
	requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	reviewed_by VARCHAR(50) REFERENCES identity.staff(id),
	reviewed_at TIMESTAMPTZ,
	review_reason TEXT,
	applied_at TIMESTAMPTZ,
	CHECK (
		(status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL)
		OR status <> 'pending'
	)
);

CREATE UNIQUE INDEX IF NOT EXISTS identity_one_pending_change_per_field
	ON identity.identity_change_requests(identity_id, field_name)
	WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS identity_change_request_owner_history
	ON identity.identity_change_requests(identity_id, requested_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS identity_change_request_review_queue
	ON identity.identity_change_requests(status, requested_at, id)
	WHERE status = 'pending';

WITH ranked_active_media AS (
	SELECT
		staff_id,
		media_id,
		ROW_NUMBER() OVER (
			PARTITION BY staff_id, asset_role
			ORDER BY assigned_at DESC, media_id DESC
		) AS row_number
	FROM identity.staff_media_assets
	WHERE is_active = TRUE
)
UPDATE identity.staff_media_assets link
SET is_active = FALSE
FROM ranked_active_media ranked
WHERE link.staff_id = ranked.staff_id
	AND link.media_id = ranked.media_id
	AND ranked.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS unique_active_staff_media_role
	ON identity.staff_media_assets(staff_id, asset_role)
	WHERE is_active = TRUE;

INSERT INTO policy.identity_governance_policies (
	id, policy_key, policy_version, schema_version, status,
	effective_from, definition_checksum, created_by, approved_by,
	approval_reason, created_at, approved_at, metadata
) VALUES (
	'IGP-001', 'nexusfons_identity_governance', 1, 1, 'active',
	NOW(),
	'2f60fa07c78f1c508f5e116694c5f09581578cb674e78203554d69d033eab841',
	'staff.system', 'staff.system',
	'Initial self-service identity governance policy', NOW(), NOW(),
	'{"defaultEffect":"deny","selfService":true}'::JSONB
)
ON CONFLICT (policy_key, policy_version) DO NOTHING;

INSERT INTO policy.identity_governance_rules (
	id, governance_policy_id, field_name, mode, requirements,
	reason_code, priority, created_by
) VALUES
	('IGR-001-PHONE', 'IGP-001', 'phoneNumber', 'direct',
		ARRAY['audit_identity_change'], 'self_phone_change_allowed', 10, 'staff.system'),
	('IGR-001-PHOTO', 'IGP-001', 'profilePicture', 'direct',
		ARRAY['validate_image','audit_identity_change'], 'self_profile_picture_change_allowed', 10, 'staff.system'),
	('IGR-001-FIRST', 'IGP-001', 'firstName', 'approval_required',
		ARRAY['reason','supporting_evidence','hr_approval'], 'legal_name_change_requires_approval', 10, 'staff.system'),
	('IGR-001-MIDDLE', 'IGP-001', 'middleName', 'approval_required',
		ARRAY['reason','supporting_evidence','hr_approval'], 'legal_name_change_requires_approval', 10, 'staff.system'),
	('IGR-001-LAST', 'IGP-001', 'lastName', 'approval_required',
		ARRAY['reason','supporting_evidence','hr_approval'], 'legal_name_change_requires_approval', 10, 'staff.system'),
	('IGR-001-EMAIL', 'IGP-001', 'email', 'approval_required',
		ARRAY['verify_new_email','hr_approval','synchronize_auth_provider'], 'institutional_email_change_requires_verification', 10, 'staff.system'),
	('IGR-001-SIGNATURE', 'IGP-001', 'signature', 'approval_required',
		ARRAY['supporting_evidence','authorized_approval','preserve_historical_signatures'], 'legal_signature_change_requires_approval', 10, 'staff.system'),
	('IGR-001-STAFF-NUMBER', 'IGP-001', 'staffNumber', 'read_only',
		ARRAY[]::TEXT[], 'staff_number_is_institutionally_managed', 10, 'staff.system'),
	('IGR-001-EMPLOYMENT', 'IGP-001', 'employmentType', 'read_only',
		ARRAY[]::TEXT[], 'employment_type_is_institutionally_managed', 10, 'staff.system'),
	('IGR-001-UNIT', 'IGP-001', 'unit', 'read_only',
		ARRAY[]::TEXT[], 'organizational_assignment_is_institutionally_managed', 10, 'staff.system'),
	('IGR-001-OFFICE', 'IGP-001', 'office', 'read_only',
		ARRAY[]::TEXT[], 'organizational_assignment_is_institutionally_managed', 10, 'staff.system'),
	('IGR-001-DESIGNATION', 'IGP-001', 'designation', 'read_only',
		ARRAY[]::TEXT[], 'organizational_assignment_is_institutionally_managed', 10, 'staff.system'),
	('IGR-001-STATUS', 'IGP-001', 'status', 'read_only',
		ARRAY[]::TEXT[], 'account_status_is_institutionally_managed', 10, 'staff.system'),
	('IGR-001-ROLES', 'IGP-001', 'roles', 'read_only',
		ARRAY[]::TEXT[], 'authority_is_not_self_service', 10, 'staff.system'),
	('IGR-001-CAPABILITIES', 'IGP-001', 'capabilities', 'read_only',
		ARRAY[]::TEXT[], 'authority_is_not_self_service', 10, 'staff.system'),
	('IGR-001-CLASSIFICATION', 'IGP-001', 'classification', 'read_only',
		ARRAY[]::TEXT[], 'classification_is_not_self_service', 10, 'staff.system')
ON CONFLICT (governance_policy_id, field_name) DO NOTHING;
