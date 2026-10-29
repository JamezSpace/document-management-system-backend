ALTER TABLE identity.staff
	ADD COLUMN IF NOT EXISTS revision BIGINT NOT NULL DEFAULT 1;

ALTER TABLE identity.staff
	DROP CONSTRAINT IF EXISTS staff_revision_positive;

ALTER TABLE identity.staff
	ADD CONSTRAINT staff_revision_positive CHECK (revision > 0);

INSERT INTO identity.permissions (id, name, description)
VALUES (
	'perm.identity.change.review',
	'identity.change.review',
	'review and apply governed identity change requests'
)
ON CONFLICT (id) DO UPDATE SET
	name = EXCLUDED.name,
	description = EXCLUDED.description;

INSERT INTO identity.role_permissions (role_id, permission_id)
VALUES
	('role.staff_admin', 'perm.identity.change.review'),
	('role.sys_admin', 'perm.identity.change.review')
ON CONFLICT DO NOTHING;

INSERT INTO policy.identity_governance_policies (
	id, policy_key, policy_version, schema_version, status,
	effective_from, definition_checksum, created_by, approved_by,
	approval_reason, created_at, approved_at, metadata
) VALUES (
	'IGP-STAFF-ADMIN-001',
	'nexusfons_staff_administration',
	1,
	1,
	'active',
	NOW(),
	'bc71c514b749ad6c2c9d34e9e7ca30c3cf42581c90883e76a45b2fe711b3cf18',
	'staff.system',
	'staff.system',
	'Initial governed administrative staff-management policy',
	NOW(),
	NOW(),
	'{"defaultEffect":"deny","administrativeStaffManagement":true}'::JSONB
)
ON CONFLICT (policy_key, policy_version) DO NOTHING;

INSERT INTO policy.identity_governance_rules (
	id, governance_policy_id, field_name, mode, requirements,
	reason_code, priority, created_by
) VALUES
	('IGR-STAFF-ADMIN-NUMBER', 'IGP-STAFF-ADMIN-001', 'staffNumber', 'direct',
		ARRAY['reason','audit_identity_change'], 'staff_number_administratively_managed', 10, 'staff.system'),
	('IGR-STAFF-ADMIN-EMPLOYMENT', 'IGP-STAFF-ADMIN-001', 'employmentType', 'direct',
		ARRAY['reason','audit_identity_change'], 'employment_type_administratively_managed', 10, 'staff.system'),
	('IGR-STAFF-ADMIN-UNIT', 'IGP-STAFF-ADMIN-001', 'unit', 'direct',
		ARRAY['reason','audit_identity_change'], 'unit_assignment_administratively_managed', 10, 'staff.system'),
	('IGR-STAFF-ADMIN-OFFICE', 'IGP-STAFF-ADMIN-001', 'office', 'direct',
		ARRAY['reason','audit_identity_change'], 'office_assignment_administratively_managed', 10, 'staff.system'),
	('IGR-STAFF-ADMIN-DESIGNATION', 'IGP-STAFF-ADMIN-001', 'designation', 'direct',
		ARRAY['reason','audit_identity_change'], 'designation_administratively_managed', 10, 'staff.system'),
	('IGR-STAFF-ADMIN-ACTIVE-SUSPENDED', 'IGP-STAFF-ADMIN-001', 'status.active.suspended', 'direct',
		ARRAY['reason','target_must_not_be_actor','audit_identity_change'], 'active_staff_may_be_suspended', 20, 'staff.system'),
	('IGR-STAFF-ADMIN-ACTIVE-RETIRED', 'IGP-STAFF-ADMIN-001', 'status.active.retired', 'direct',
		ARRAY['reason','target_must_not_be_actor','audit_identity_change'], 'active_staff_may_be_retired', 20, 'staff.system'),
	('IGR-STAFF-ADMIN-ACTIVE-RESIGNED', 'IGP-STAFF-ADMIN-001', 'status.active.resigned', 'direct',
		ARRAY['reason','target_must_not_be_actor','audit_identity_change'], 'staff_resignation_may_be_recorded', 20, 'staff.system'),
	('IGR-STAFF-ADMIN-ACTIVE-TERMINATED', 'IGP-STAFF-ADMIN-001', 'status.active.terminated', 'direct',
		ARRAY['reason','target_must_not_be_actor','audit_identity_change'], 'active_staff_may_be_terminated', 20, 'staff.system'),
	('IGR-STAFF-ADMIN-SUSPENDED-ACTIVE', 'IGP-STAFF-ADMIN-001', 'status.suspended.active', 'direct',
		ARRAY['reason','target_must_not_be_actor','audit_identity_change'], 'suspended_staff_may_be_reinstated', 20, 'staff.system'),
	('IGR-STAFF-ADMIN-SUSPENDED-TERMINATED', 'IGP-STAFF-ADMIN-001', 'status.suspended.terminated', 'direct',
		ARRAY['reason','target_must_not_be_actor','audit_identity_change'], 'suspended_staff_may_be_terminated', 20, 'staff.system')
ON CONFLICT (governance_policy_id, field_name) DO NOTHING;

CREATE INDEX IF NOT EXISTS identity_change_request_review_queue
	ON identity.identity_change_requests(status, requested_at DESC, id DESC);
