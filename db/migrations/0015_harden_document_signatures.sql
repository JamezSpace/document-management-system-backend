ALTER TABLE document.document_unit_head_signatures
	ADD COLUMN IF NOT EXISTS document_version_id VARCHAR(50)
		REFERENCES document.document_versions(id),
	ADD COLUMN IF NOT EXISTS signed_revision BIGINT,
	ADD COLUMN IF NOT EXISTS content_sha256 CHAR(64),
	ADD COLUMN IF NOT EXISTS signature_media_id VARCHAR(50)
		REFERENCES media.media_assets(id),
	ADD COLUMN IF NOT EXISTS signer_name VARCHAR(300),
	ADD COLUMN IF NOT EXISTS signer_designation VARCHAR(200),
	ADD COLUMN IF NOT EXISTS invalidated_at TIMESTAMPTZ,
	ADD COLUMN IF NOT EXISTS invalidation_reason TEXT;

UPDATE document.document_unit_head_signatures signature
SET document_version_id = document.current_version_id,
	signed_revision = document.revision
FROM document.documents document
WHERE document.id = signature.document_id
	AND signature.document_version_id IS NULL;

UPDATE document.document_unit_head_signatures signature
SET signature_media_id = (
	SELECT staff_media.media_id
	FROM identity.staff_media_assets staff_media
	WHERE staff_media.staff_id = signature.signed_by
		AND upper(staff_media.asset_role) = 'SIGNATURE'
		AND staff_media.is_active = TRUE
	ORDER BY staff_media.assigned_at DESC
	LIMIT 1
)
WHERE signature.signature_media_id IS NULL;

UPDATE document.document_unit_head_signatures signature
SET signer_name = COALESCE(
		signature.signer_name,
		NULLIF(CONCAT_WS(' ', signer_user.first_name, signer_user.middle_name, signer_user.last_name), '')
	),
	signer_designation = COALESCE(signature.signer_designation, designation.title)
FROM identity.staff signer
JOIN identity.users signer_user ON signer_user.id = signer.identity_id
LEFT JOIN identity.designations designation ON designation.id = signer.designation_id
WHERE signer.id = signature.signed_by
	AND signature.signer_name IS NULL;

UPDATE document.document_unit_head_signatures
SET invalidated_at = COALESCE(invalidated_at, NOW()),
	invalidation_reason = COALESCE(invalidation_reason, 'legacy_signature_requires_content_bound_resigning')
WHERE content_sha256 IS NULL
	AND revoked_at IS NULL;

DROP INDEX IF EXISTS document.document_one_effective_unit_head_signature;

CREATE UNIQUE INDEX document_one_effective_unit_head_signature
	ON document.document_unit_head_signatures(document_id)
	WHERE revoked_at IS NULL AND invalidated_at IS NULL;

CREATE INDEX document_signature_history
	ON document.document_unit_head_signatures(document_id, signed_at DESC, id DESC);

INSERT INTO identity.permissions (id, code, description)
VALUES ('perm.document.sign', 'document.sign', 'Authorize and visibly sign a document')
ON CONFLICT (id) DO UPDATE SET
	code = EXCLUDED.code,
	description = EXCLUDED.description;

INSERT INTO identity.role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM identity.roles role
JOIN identity.permissions permission ON permission.code = 'document.sign'
WHERE role.name = 'reviewing_officer'
ON CONFLICT DO NOTHING;
