-- REFERENCE-ONLY SQL CATALOGUE. `db/migrations` is the authoritative schema history.
-- Do not apply this file as a schema change. Add every new or modified database change
-- to a numbered migration first; mirror it here only for browsing or test support.

CREATE VIEW directive.directive_compliance_summary AS
WITH delivery_totals AS (
    SELECT
        delivery.directive_revision_id,
        COUNT(*) AS total_recipients,
        COUNT(delivery.seen_at) AS seen_count,
        COUNT(ack.id) AS acknowledged_count,
        MIN(delivery.delivered_at) AS first_delivered_at,
        MAX(delivery.delivered_at) AS last_delivered_at
    FROM directive.directive_deliveries delivery
    LEFT JOIN directive.directive_acknowledgements ack
        ON ack.delivery_id = delivery.id
    GROUP BY delivery.directive_revision_id
), evidence_totals AS (
    SELECT
        evidence.directive_id,
        COUNT(*) AS evidence_count,
        COUNT(acceptance.id) AS accepted_evidence_count
    FROM directive.directive_completion_evidence evidence
    LEFT JOIN directive.directive_completion_evidence_acceptances acceptance
        ON acceptance.evidence_id = evidence.id
    GROUP BY evidence.directive_id
)
SELECT
    d.id AS directive_id,
    d.reference_number,
    d.status,
    d.current_revision_id,
    COALESCE(delivery.total_recipients, 0) AS total_recipients,
    COALESCE(delivery.seen_count, 0) AS seen_count,
    COALESCE(delivery.acknowledged_count, 0) AS acknowledged_count,
    GREATEST(
        COALESCE(delivery.total_recipients, 0)
            - COALESCE(delivery.acknowledged_count, 0),
        0
    ) AS pending_acknowledgement_count,
    COALESCE(evidence.evidence_count, 0) AS evidence_count,
    COALESCE(evidence.accepted_evidence_count, 0) AS accepted_evidence_count,
    delivery.first_delivered_at,
    delivery.last_delivered_at
FROM directive.directives d
LEFT JOIN delivery_totals delivery
    ON delivery.directive_revision_id = d.current_revision_id
LEFT JOIN evidence_totals evidence
    ON evidence.directive_id = d.id;
