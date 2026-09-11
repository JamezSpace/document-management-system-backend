ALTER TYPE document.attachment_source_type
	RENAME VALUE 'external_upload' TO 'uploaded_file';

DO $$
BEGIN
	CREATE TYPE media.virus_scan_status AS ENUM (
		'pending',
		'clean',
		'infected',
		'failed'
	);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE media.media_assets
	ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
	ADD COLUMN IF NOT EXISTS virus_scan_status media.virus_scan_status
		NOT NULL DEFAULT 'pending',
	ADD COLUMN IF NOT EXISTS virus_scanned_at TIMESTAMPTZ;

ALTER TABLE media.media_assets
	ADD CONSTRAINT media_assets_virus_scan_state_shape CHECK (
		(virus_scan_status = 'pending' AND virus_scanned_at IS NULL)
		OR (virus_scan_status <> 'pending' AND virus_scanned_at IS NOT NULL)
	);

ALTER TABLE document.document_attachments
	RENAME COLUMN document_id TO parent_document_id;
ALTER TABLE document.document_attachments
	RENAME COLUMN document_version_id TO parent_document_version_id;
ALTER TABLE document.document_attachments
	RENAME COLUMN target_document_id TO source_document_id;
ALTER TABLE document.document_attachments
	RENAME COLUMN target_document_version_id TO source_document_version_id;
ALTER TABLE document.document_attachments
	RENAME COLUMN media_asset_id TO media_id;

ALTER TABLE document.document_attachments
	RENAME CONSTRAINT document_attachments_document_version_fk
	TO document_attachments_parent_version_fk;
ALTER TABLE document.document_attachments
	RENAME CONSTRAINT document_attachments_target_version_fk
	TO document_attachments_source_version_fk;

ALTER INDEX document.document_attachments_one_external_upload
	RENAME TO document_attachments_one_uploaded_file;

INSERT INTO document.document_attachments (
	id,
	parent_document_id,
	parent_document_version_id,
	source_type,
	media_id,
	attached_by,
	attached_at,
	metadata
)
SELECT
	'DOC-ATTACH-' || md5(media_link.document_id || ':' || media_link.media_id),
	media_link.document_id,
	media_link.document_version_id,
	'uploaded_file',
	media_link.media_id,
	COALESCE(uploader.id, parent.owner_id),
	media_link.assigned_at,
	'{"migratedFrom":"document_media_assets"}'::JSONB
FROM document.document_media_assets media_link
JOIN document.documents parent ON parent.id = media_link.document_id
JOIN media.media_assets media ON media.id = media_link.media_id
LEFT JOIN identity.staff uploader
	ON uploader.id = media.uploaded_by
	AND media.uploaded_by_type = 'staff'
WHERE lower(media_link.asset_role) = 'attachment'
ON CONFLICT DO NOTHING;
