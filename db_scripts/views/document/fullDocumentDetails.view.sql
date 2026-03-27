CREATE OR REPLACE VIEW document.full_document_details AS
SELECT doc.*,
    docVersion.id as version_id,
    docVersion.version_number,
    docVersion.content_delta,
    docVersion.media_id,
    docVersion.lifecycle_state,
    docVersion.created_at as version_created_at,
    docVersion.created_by as version_created_by,
    docVersion.state_entered_at as version_state_entered_at,
    docVersion.state_entered_by as version_state_entered_by
FROM document.documents doc
LEFT JOIN document.document_versions docVersion 
ON docVersion.id = doc.current_version_id;
