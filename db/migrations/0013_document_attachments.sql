DO $$
BEGIN
	CREATE TYPE document.attachment_source_type AS ENUM (
		'internal_document',
		'external_upload'
	);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE document.document_versions
	ADD CONSTRAINT document_versions_document_id_id_unique
	UNIQUE (document_id, id);

CREATE TABLE document.document_attachments (
	id VARCHAR(80) PRIMARY KEY,
	document_id VARCHAR(50) NOT NULL
		REFERENCES document.documents(id) ON DELETE CASCADE,
	document_version_id VARCHAR(50),
	source_type document.attachment_source_type NOT NULL,
	target_document_id VARCHAR(50)
		REFERENCES document.documents(id),
	target_document_version_id VARCHAR(50),
	media_asset_id VARCHAR(50)
		REFERENCES media.media_assets(id),
	display_order INTEGER NOT NULL DEFAULT 0,
	attached_by VARCHAR(50) NOT NULL
		REFERENCES identity.staff(id),
	attached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
	CONSTRAINT document_attachments_document_version_fk
		FOREIGN KEY (document_id, document_version_id)
		REFERENCES document.document_versions(document_id, id),
	CONSTRAINT document_attachments_target_version_fk
		FOREIGN KEY (target_document_id, target_document_version_id)
		REFERENCES document.document_versions(document_id, id),
	CONSTRAINT document_attachments_source_shape CHECK (
		(
			source_type = 'internal_document'
			AND target_document_id IS NOT NULL
			AND target_document_version_id IS NOT NULL
			AND media_asset_id IS NULL
		)
		OR (
			source_type = 'external_upload'
			AND target_document_id IS NULL
			AND target_document_version_id IS NULL
			AND media_asset_id IS NOT NULL
		)
	),
	CONSTRAINT document_attachments_not_self_referencing CHECK (
		target_document_id IS NULL OR target_document_id <> document_id
	),
	CONSTRAINT document_attachments_display_order_non_negative CHECK (
		display_order >= 0
	),
	CONSTRAINT document_attachments_metadata_object CHECK (
		jsonb_typeof(metadata) = 'object'
	)
);

CREATE UNIQUE INDEX document_attachments_one_internal_document
	ON document.document_attachments(document_id, target_document_id)
	WHERE source_type = 'internal_document';

CREATE UNIQUE INDEX document_attachments_one_external_upload
	ON document.document_attachments(document_id, media_asset_id)
	WHERE source_type = 'external_upload';

CREATE INDEX document_attachments_document_listing
	ON document.document_attachments(document_id, display_order, attached_at, id);

CREATE INDEX document_attachments_internal_reverse_lookup
	ON document.document_attachments(target_document_id)
	WHERE source_type = 'internal_document';
