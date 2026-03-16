CREATE OR REPLACE VIEW document.full_document_details AS
SELECT doc.*,
    docVersion.id as version_id,
    docVersion.version_number,
    docVersion.media_id,
    docVersion.lifecycle_state
FROM document.documents doc
LEFT JOIN document.document_versions docVersion ON docVersion.id = doc.current_version_id;