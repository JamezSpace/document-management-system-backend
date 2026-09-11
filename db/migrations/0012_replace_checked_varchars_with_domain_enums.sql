-- Replace closed categorical VARCHAR domains with schema-owned PostgreSQL enums.
DO $$
DECLARE
	type_definition RECORD;
	quoted_labels TEXT;
BEGIN
	FOR type_definition IN
		SELECT * FROM (VALUES
			('audit', 'actor_type', ARRAY['staff', 'system', 'external']),
			('audit', 'outcome', ARRAY['success', 'denied', 'failed']),
			('registry', 'intake_channel', ARRAY['physical', 'email', 'courier', 'upload', 'postal', 'other']),
			('registry', 'priority', ARRAY['low', 'normal', 'high', 'urgent']),
			('registry', 'intake_status', ARRAY['received', 'awaiting_digitization', 'digitizing', 'awaiting_verification', 'awaiting_registration', 'awaiting_dispatch', 'dispatched', 'closed', 'cancelled']),
			('registry', 'reference_reset_period', ARRAY['annual', 'monthly', 'never']),
			('registry', 'digitization_status', ARRAY['pending', 'in_progress', 'awaiting_verification', 'verified', 'rejected', 'failed', 'cancelled']),
			('registry', 'ocr_status', ARRAY['queued', 'processing', 'completed', 'failed']),
			('registry', 'verification_outcome', ARRAY['accepted', 'rejected']),
			('registry', 'entry_status', ARRAY['registered', 'awaiting_dispatch', 'dispatched', 'closed']),
			('registry', 'custodian_type', ARRAY['staff', 'office', 'unit', 'external']),
			('registry', 'custody_event_type', ARRAY['released', 'received', 'returned', 'located']),
			('registry', 'correspondence_direction', ARRAY['incoming', 'outgoing']),
			('registry', 'correspondence_channel', ARRAY['physical', 'email', 'courier', 'internal', 'postal', 'other']),
			('records', 'retention_trigger_event', ARRAY['declaration', 'case_closed', 'contract_ended', 'last_action', 'custom']),
			('records', 'disposition_action', ARRAY['archive', 'destroy', 'review']),
			('records', 'record_status', ARRAY['active', 'on_hold', 'transferring', 'archived', 'disposed']),
			('records', 'location_type', ARRAY['room', 'cabinet', 'shelf', 'box', 'digital']),
			('records', 'placement_event_type', ARRAY['placed', 'removed']),
			('records', 'legal_hold_status', ARRAY['active', 'released']),
			('records', 'legal_hold_event_type', ARRAY['placed', 'record_added', 'released']),
			('records', 'transfer_status', ARRAY['pending', 'approved', 'rejected', 'in_transit', 'completed', 'cancelled']),
			('records', 'disposal_request_status', ARRAY['pending', 'approved', 'rejected', 'executed', 'cancelled']),
			('records', 'disposal_decision', ARRAY['approved', 'rejected']),
			('policy', 'document_grant_type', ARRAY['guest_reader', 'export']),
			('policy', 'document_grantor_authority', ARRAY['originator', 'unit_head']),
			('policy', 'sensitivity_change_status', ARRAY['pending', 'approved', 'rejected', 'applied']),
			('policy', 'extraction_action', ARRAY['export', 'print'])
		) AS definitions(schema_name, type_name, labels)
	LOOP
		IF to_regtype(format('%I.%I', type_definition.schema_name, type_definition.type_name)) IS NULL THEN
			SELECT string_agg(quote_literal(label), ', ')
			INTO quoted_labels
			FROM unnest(type_definition.labels) AS label;

			EXECUTE format(
				'CREATE TYPE %I.%I AS ENUM (%s)',
				type_definition.schema_name,
				type_definition.type_name,
				quoted_labels
			);
		END IF;
	END LOOP;
END
$$;

ALTER TABLE audit.events
	DROP CONSTRAINT events_actor_type_check,
	DROP CONSTRAINT events_outcome_check,
	ALTER COLUMN actor_type TYPE audit.actor_type USING actor_type::TEXT::audit.actor_type,
	ALTER COLUMN outcome TYPE audit.outcome USING outcome::TEXT::audit.outcome;

ALTER TABLE registry.intakes
	DROP CONSTRAINT intakes_channel_check,
	DROP CONSTRAINT intakes_priority_check,
	DROP CONSTRAINT intakes_status_check,
	ALTER COLUMN priority DROP DEFAULT,
	ALTER COLUMN status DROP DEFAULT,
	ALTER COLUMN channel TYPE registry.intake_channel USING channel::TEXT::registry.intake_channel,
	ALTER COLUMN priority TYPE registry.priority USING priority::TEXT::registry.priority,
	ALTER COLUMN status TYPE registry.intake_status USING status::TEXT::registry.intake_status,
	ALTER COLUMN priority SET DEFAULT 'normal'::registry.priority,
	ALTER COLUMN status SET DEFAULT 'received'::registry.intake_status;

ALTER TABLE registry.reference_series
	DROP CONSTRAINT reference_series_reset_period_check,
	ALTER COLUMN reset_period DROP DEFAULT,
	ALTER COLUMN reset_period TYPE registry.reference_reset_period USING reset_period::TEXT::registry.reference_reset_period,
	ALTER COLUMN reset_period SET DEFAULT 'annual'::registry.reference_reset_period;

ALTER TABLE registry.digitization_jobs
	DROP CONSTRAINT digitization_jobs_status_check,
	ALTER COLUMN status DROP DEFAULT,
	ALTER COLUMN status TYPE registry.digitization_status USING status::TEXT::registry.digitization_status,
	ALTER COLUMN status SET DEFAULT 'pending'::registry.digitization_status;

ALTER TABLE registry.ocr_runs
	DROP CONSTRAINT ocr_runs_status_check,
	ALTER COLUMN status DROP DEFAULT,
	ALTER COLUMN status TYPE registry.ocr_status USING status::TEXT::registry.ocr_status,
	ALTER COLUMN status SET DEFAULT 'queued'::registry.ocr_status;

ALTER TABLE registry.scan_verifications
	DROP CONSTRAINT scan_verifications_outcome_check,
	ALTER COLUMN outcome TYPE registry.verification_outcome USING outcome::TEXT::registry.verification_outcome;

ALTER TABLE registry.entries
	DROP CONSTRAINT entries_status_check,
	DROP CONSTRAINT entries_current_custodian_type_check,
	ALTER COLUMN status DROP DEFAULT,
	ALTER COLUMN status TYPE registry.entry_status USING status::TEXT::registry.entry_status,
	ALTER COLUMN current_custodian_type TYPE registry.custodian_type USING current_custodian_type::TEXT::registry.custodian_type,
	ALTER COLUMN status SET DEFAULT 'registered'::registry.entry_status;

ALTER TABLE registry.custody_movements
	DROP CONSTRAINT custody_movements_event_type_check,
	DROP CONSTRAINT custody_movements_from_custodian_type_check,
	DROP CONSTRAINT custody_movements_to_custodian_type_check,
	ALTER COLUMN event_type TYPE registry.custody_event_type USING event_type::TEXT::registry.custody_event_type,
	ALTER COLUMN from_custodian_type TYPE registry.custodian_type USING from_custodian_type::TEXT::registry.custodian_type,
	ALTER COLUMN to_custodian_type TYPE registry.custodian_type USING to_custodian_type::TEXT::registry.custodian_type;

ALTER TABLE registry.correspondence_log_entries
	DROP CONSTRAINT correspondence_log_entries_direction_check,
	DROP CONSTRAINT correspondence_log_entries_channel_check,
	ALTER COLUMN direction TYPE registry.correspondence_direction USING direction::TEXT::registry.correspondence_direction,
	ALTER COLUMN channel TYPE registry.correspondence_channel USING channel::TEXT::registry.correspondence_channel;

ALTER TABLE records.retention_schedule_versions
	DROP CONSTRAINT retention_schedule_versions_trigger_event_check,
	DROP CONSTRAINT retention_schedule_versions_disposition_action_check,
	ALTER COLUMN trigger_event TYPE records.retention_trigger_event USING trigger_event::TEXT::records.retention_trigger_event,
	ALTER COLUMN disposition_action TYPE records.disposition_action USING disposition_action::TEXT::records.disposition_action;

ALTER TABLE records.records
	DROP CONSTRAINT records_status_check,
	ALTER COLUMN status DROP DEFAULT,
	ALTER COLUMN status TYPE records.record_status USING status::TEXT::records.record_status,
	ALTER COLUMN status SET DEFAULT 'active'::records.record_status;

ALTER TABLE records.storage_locations
	DROP CONSTRAINT storage_locations_location_type_check,
	ALTER COLUMN location_type TYPE records.location_type USING location_type::TEXT::records.location_type;

ALTER TABLE records.record_placements
	DROP CONSTRAINT record_placements_event_type_check,
	ALTER COLUMN event_type TYPE records.placement_event_type USING event_type::TEXT::records.placement_event_type;

ALTER TABLE records.legal_holds
	DROP CONSTRAINT legal_holds_status_check,
	ALTER COLUMN status DROP DEFAULT,
	ALTER COLUMN status TYPE records.legal_hold_status USING status::TEXT::records.legal_hold_status,
	ALTER COLUMN status SET DEFAULT 'active'::records.legal_hold_status;

ALTER TABLE records.legal_hold_events
	DROP CONSTRAINT legal_hold_events_event_type_check,
	ALTER COLUMN event_type TYPE records.legal_hold_event_type USING event_type::TEXT::records.legal_hold_event_type;

ALTER TABLE records.transfers
	DROP CONSTRAINT transfers_status_check,
	ALTER COLUMN status DROP DEFAULT,
	ALTER COLUMN status TYPE records.transfer_status USING status::TEXT::records.transfer_status,
	ALTER COLUMN status SET DEFAULT 'pending'::records.transfer_status;

ALTER TABLE records.disposal_requests
	DROP CONSTRAINT disposal_requests_status_check,
	ALTER COLUMN status DROP DEFAULT,
	ALTER COLUMN status TYPE records.disposal_request_status USING status::TEXT::records.disposal_request_status,
	ALTER COLUMN status SET DEFAULT 'pending'::records.disposal_request_status;

ALTER TABLE records.disposal_approvals
	DROP CONSTRAINT disposal_approvals_decision_check,
	ALTER COLUMN decision TYPE records.disposal_decision USING decision::TEXT::records.disposal_decision;

ALTER TABLE policy.document_governance_grants
	DROP CONSTRAINT document_governance_grants_grant_type_check,
	DROP CONSTRAINT document_governance_grants_grantor_authority_check,
	ALTER COLUMN grant_type TYPE policy.document_grant_type USING grant_type::TEXT::policy.document_grant_type,
	ALTER COLUMN grantor_authority TYPE policy.document_grantor_authority USING grantor_authority::TEXT::policy.document_grantor_authority;

ALTER TABLE policy.document_sensitivity_change_requests
	DROP CONSTRAINT document_sensitivity_change_requests_status_check,
	ALTER COLUMN status TYPE policy.sensitivity_change_status USING status::TEXT::policy.sensitivity_change_status;

ALTER TABLE policy.document_extractions
	DROP CONSTRAINT document_extractions_extraction_action_check,
	ALTER COLUMN extraction_action TYPE policy.extraction_action USING extraction_action::TEXT::policy.extraction_action;
