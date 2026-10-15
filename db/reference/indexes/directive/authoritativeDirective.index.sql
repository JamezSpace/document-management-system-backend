-- REFERENCE-ONLY SQL CATALOGUE. `db/migrations` is the authoritative schema history.
-- Do not apply this file as a schema change. Add every new or modified database change
-- to a numbered migration first; mirror it here only for browsing or test support.

CREATE INDEX directive_directives_status_issued
	ON directive.directives(status, issued_at DESC, id DESC);
CREATE INDEX directive_directives_unit_status
	ON directive.directives(issuing_unit_id, status, effective_from);
CREATE INDEX directive_directives_office_status
	ON directive.directives(issuing_office_id, status, effective_from);
CREATE INDEX directive_revisions_history
	ON directive.directive_revisions(directive_id, revision_number DESC);
CREATE INDEX directive_revisions_due
	ON directive.directive_revisions(completion_due_at, directive_id);
CREATE INDEX directive_staff_targets_staff
	ON directive.directive_revision_staff_targets(staff_id, directive_revision_id);
CREATE INDEX directive_unit_targets_unit
	ON directive.directive_revision_unit_targets(unit_id, directive_revision_id);
CREATE INDEX directive_office_targets_office
	ON directive.directive_revision_office_targets(office_id, directive_revision_id);
CREATE INDEX directive_role_targets_role_scope
	ON directive.directive_revision_role_targets(
		role_id, scope_type, scope_unit_id, scope_office_id, directive_revision_id
	);
CREATE INDEX directive_deliveries_staff
	ON directive.directive_deliveries(staff_id, delivered_at DESC);
CREATE INDEX directive_events_history
	ON directive.directive_events(directive_id, occurred_at DESC, id DESC);
CREATE INDEX directive_events_correlation
	ON directive.directive_events(correlation_id, occurred_at)
	WHERE correlation_id IS NOT NULL;
CREATE INDEX directive_completion_evidence_directive
	ON directive.directive_completion_evidence(directive_id, submitted_at DESC);
CREATE INDEX directive_completion_evidence_acceptances_time
	ON directive.directive_completion_evidence_acceptances(accepted_at DESC);
