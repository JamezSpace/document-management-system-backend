CREATE SCHEMA IF NOT EXISTS directive;

-- The old directive catalogue was never introduced by a numbered migration, but
-- some installations may have applied the reference SQL directly. Preserve and
-- migrate that data instead of silently accepting the incompatible table shape.
DROP VIEW IF EXISTS directive.directive_compliance_summary;

DO $$
BEGIN
	IF to_regclass('directive.directives') IS NOT NULL
		AND NOT EXISTS (
			SELECT 1
			FROM information_schema.columns
			WHERE table_schema = 'directive'
				AND table_name = 'directives'
				AND column_name = 'reference_number'
		)
	THEN
		ALTER TABLE directive.directives RENAME TO directives_legacy;

		IF to_regclass('directive.directive_staff_recipients') IS NOT NULL THEN
			ALTER TABLE directive.directive_staff_recipients
				RENAME TO directive_staff_recipients_legacy;
		END IF;
		IF to_regclass('directive.directive_unit_targets') IS NOT NULL THEN
			ALTER TABLE directive.directive_unit_targets
				RENAME TO directive_unit_targets_legacy;
		END IF;
		IF to_regclass('directive.directive_office_targets') IS NOT NULL THEN
			ALTER TABLE directive.directive_office_targets
				RENAME TO directive_office_targets_legacy;
		END IF;
		IF to_regclass('directive.directive_role_targets') IS NOT NULL THEN
			ALTER TABLE directive.directive_role_targets
				RENAME TO directive_role_targets_legacy;
		END IF;
	END IF;
END
$$;

DO $$
BEGIN
	IF to_regtype('directive.priority') IS NULL THEN
		CREATE TYPE directive.priority AS ENUM ('urgent', 'standard');
	END IF;
	IF to_regtype('directive.registry_volume') IS NULL THEN
		CREATE TYPE directive.registry_volume AS ENUM ('operations', 'official');
	END IF;
	IF to_regtype('directive.lifecycle_status') IS NULL THEN
		CREATE TYPE directive.lifecycle_status AS ENUM (
			'draft', 'issued', 'withdrawn', 'completed'
		);
	END IF;
	IF to_regtype('directive.target_scope_type') IS NULL THEN
		CREATE TYPE directive.target_scope_type AS ENUM (
			'organization', 'unit', 'office'
		);
	END IF;
	IF to_regtype('directive.event_actor_type') IS NULL THEN
		CREATE TYPE directive.event_actor_type AS ENUM ('staff', 'system');
	END IF;
	IF to_regtype('directive.event_type') IS NULL THEN
		CREATE TYPE directive.event_type AS ENUM (
			'created',
			'revision_created',
			'issued',
			'audience_resolved',
			'delivered',
			'seen',
			'acknowledged',
			'amended',
			'completion_evidence_added',
			'completed',
			'withdrawn'
		);
	END IF;
END
$$;

CREATE TABLE directive.directives (
	id VARCHAR(80) PRIMARY KEY,
	reference_number VARCHAR(120) UNIQUE,
	status directive.lifecycle_status NOT NULL DEFAULT 'draft',
	current_revision_id VARCHAR(80),

	issued_by_staff_id VARCHAR(50) REFERENCES identity.staff(id) ON DELETE RESTRICT,
	issued_under_assignment_id VARCHAR(50)
		REFERENCES identity.role_assignments(id) ON DELETE RESTRICT,
	issuing_unit_id VARCHAR(50)
		REFERENCES identity.organizational_units(id) ON DELETE RESTRICT,
	issuing_office_id VARCHAR(50)
		REFERENCES identity.offices(id) ON DELETE RESTRICT,
	issuer_name_snapshot VARCHAR(300),
	issuer_designation_snapshot VARCHAR(200),
	issuer_unit_name_snapshot VARCHAR(200),

	issued_at TIMESTAMPTZ,
	effective_from TIMESTAMPTZ,
	effective_until TIMESTAMPTZ,
	acknowledgement_required BOOLEAN NOT NULL DEFAULT FALSE,
	completion_required BOOLEAN NOT NULL DEFAULT FALSE,

	completed_at TIMESTAMPTZ,
	completed_by_staff_id VARCHAR(50)
		REFERENCES identity.staff(id) ON DELETE RESTRICT,
	withdrawn_at TIMESTAMPTZ,
	withdrawn_by_staff_id VARCHAR(50)
		REFERENCES identity.staff(id) ON DELETE RESTRICT,
	withdrawal_reason TEXT,

	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ,

	CONSTRAINT directive_effective_range CHECK (
		effective_until IS NULL
		OR (effective_from IS NOT NULL AND effective_until > effective_from)
	),
	CONSTRAINT directive_issuance_shape CHECK (
		status = 'draft'
		OR (
			reference_number IS NOT NULL
			AND current_revision_id IS NOT NULL
			AND issued_by_staff_id IS NOT NULL
			AND issuer_name_snapshot IS NOT NULL
			AND issued_at IS NOT NULL
			AND effective_from IS NOT NULL
		)
	),
	CONSTRAINT directive_completion_shape CHECK (
		(status = 'completed' AND completed_at IS NOT NULL AND completed_by_staff_id IS NOT NULL)
		OR (status <> 'completed' AND completed_at IS NULL AND completed_by_staff_id IS NULL)
	),
	CONSTRAINT directive_withdrawal_shape CHECK (
		(status = 'withdrawn'
			AND withdrawn_at IS NOT NULL
			AND withdrawn_by_staff_id IS NOT NULL
			AND NULLIF(BTRIM(withdrawal_reason), '') IS NOT NULL)
		OR (status <> 'withdrawn'
			AND withdrawn_at IS NULL
			AND withdrawn_by_staff_id IS NULL
			AND withdrawal_reason IS NULL)
	)
);

CREATE TABLE directive.directive_revisions (
	id VARCHAR(80) PRIMARY KEY,
	directive_id VARCHAR(80) NOT NULL
		REFERENCES directive.directives(id) ON DELETE RESTRICT,
	revision_number INTEGER NOT NULL CHECK (revision_number > 0),
	heading TEXT NOT NULL CHECK (NULLIF(BTRIM(heading), '') IS NOT NULL),
	instruction TEXT NOT NULL CHECK (NULLIF(BTRIM(instruction), '') IS NOT NULL),
	expected_outcome TEXT,
	priority directive.priority NOT NULL DEFAULT 'standard',
	registry_volume directive.registry_volume NOT NULL DEFAULT 'official',
	completion_due_at TIMESTAMPTZ,
	source_document_version_id VARCHAR(50)
		REFERENCES document.document_versions(id) ON DELETE RESTRICT,
	content_sha256 CHAR(64) CHECK (
		content_sha256 IS NULL OR content_sha256 ~ '^[0-9a-f]{64}$'
	),
	supersedes_revision_id VARCHAR(80),
	change_reason TEXT,
	created_by_staff_id VARCHAR(50) NOT NULL
		REFERENCES identity.staff(id) ON DELETE RESTRICT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (directive_id, revision_number),
	UNIQUE (directive_id, id),
	FOREIGN KEY (directive_id, supersedes_revision_id)
		REFERENCES directive.directive_revisions(directive_id, id)
		ON DELETE RESTRICT,
	CONSTRAINT directive_revision_supersession_shape CHECK (
		(revision_number = 1 AND supersedes_revision_id IS NULL)
		OR (revision_number > 1 AND supersedes_revision_id IS NOT NULL
			AND NULLIF(BTRIM(change_reason), '') IS NOT NULL)
	)
);

ALTER TABLE directive.directives
	ADD CONSTRAINT directive_current_revision_fk
	FOREIGN KEY (id, current_revision_id)
	REFERENCES directive.directive_revisions(directive_id, id)
	ON DELETE RESTRICT;

CREATE TABLE directive.directive_revision_staff_targets (
	id VARCHAR(80) PRIMARY KEY,
	directive_revision_id VARCHAR(80) NOT NULL,
	staff_id VARCHAR(50) NOT NULL REFERENCES identity.staff(id) ON DELETE RESTRICT,
	created_by_staff_id VARCHAR(50) NOT NULL
		REFERENCES identity.staff(id) ON DELETE RESTRICT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (directive_revision_id, staff_id),
	UNIQUE (directive_revision_id, id),
	FOREIGN KEY (directive_revision_id)
		REFERENCES directive.directive_revisions(id) ON DELETE RESTRICT
);

CREATE TABLE directive.directive_revision_unit_targets (
	id VARCHAR(80) PRIMARY KEY,
	directive_revision_id VARCHAR(80) NOT NULL,
	unit_id VARCHAR(50) NOT NULL
		REFERENCES identity.organizational_units(id) ON DELETE RESTRICT,
	created_by_staff_id VARCHAR(50) NOT NULL
		REFERENCES identity.staff(id) ON DELETE RESTRICT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (directive_revision_id, unit_id),
	UNIQUE (directive_revision_id, id),
	FOREIGN KEY (directive_revision_id)
		REFERENCES directive.directive_revisions(id) ON DELETE RESTRICT
);

CREATE TABLE directive.directive_revision_office_targets (
	id VARCHAR(80) PRIMARY KEY,
	directive_revision_id VARCHAR(80) NOT NULL,
	office_id VARCHAR(50) NOT NULL REFERENCES identity.offices(id) ON DELETE RESTRICT,
	created_by_staff_id VARCHAR(50) NOT NULL
		REFERENCES identity.staff(id) ON DELETE RESTRICT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (directive_revision_id, office_id),
	UNIQUE (directive_revision_id, id),
	FOREIGN KEY (directive_revision_id)
		REFERENCES directive.directive_revisions(id) ON DELETE RESTRICT
);

CREATE TABLE directive.directive_revision_role_targets (
	id VARCHAR(80) PRIMARY KEY,
	directive_revision_id VARCHAR(80) NOT NULL,
	role_id VARCHAR(50) NOT NULL REFERENCES identity.roles(id) ON DELETE RESTRICT,
	scope_type directive.target_scope_type NOT NULL DEFAULT 'organization',
	scope_unit_id VARCHAR(50)
		REFERENCES identity.organizational_units(id) ON DELETE RESTRICT,
	scope_office_id VARCHAR(50)
		REFERENCES identity.offices(id) ON DELETE RESTRICT,
	created_by_staff_id VARCHAR(50) NOT NULL
		REFERENCES identity.staff(id) ON DELETE RESTRICT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE NULLS NOT DISTINCT (
		directive_revision_id, role_id, scope_type, scope_unit_id, scope_office_id
	),
	UNIQUE (directive_revision_id, id),
	FOREIGN KEY (directive_revision_id)
		REFERENCES directive.directive_revisions(id) ON DELETE RESTRICT,
	CONSTRAINT directive_role_target_scope_shape CHECK (
		(scope_type = 'organization' AND scope_unit_id IS NULL AND scope_office_id IS NULL)
		OR (scope_type = 'unit' AND scope_unit_id IS NOT NULL AND scope_office_id IS NULL)
		OR (scope_type = 'office' AND scope_unit_id IS NULL AND scope_office_id IS NOT NULL)
	)
);

CREATE TABLE directive.directive_deliveries (
	id VARCHAR(80) PRIMARY KEY,
	directive_revision_id VARCHAR(80) NOT NULL,
	staff_id VARCHAR(50) NOT NULL REFERENCES identity.staff(id) ON DELETE RESTRICT,
	delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	seen_at TIMESTAMPTZ,
	UNIQUE (directive_revision_id, staff_id),
	UNIQUE (directive_revision_id, id),
	UNIQUE (directive_revision_id, id, staff_id),
	FOREIGN KEY (directive_revision_id)
		REFERENCES directive.directive_revisions(id) ON DELETE RESTRICT,
	CHECK (seen_at IS NULL OR seen_at >= delivered_at)
);

CREATE TABLE directive.directive_delivery_sources (
	id VARCHAR(80) PRIMARY KEY,
	directive_revision_id VARCHAR(80) NOT NULL,
	delivery_id VARCHAR(80) NOT NULL,
	staff_target_id VARCHAR(80),
	unit_target_id VARCHAR(80),
	office_target_id VARCHAR(80),
	role_target_id VARCHAR(80),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	FOREIGN KEY (directive_revision_id, delivery_id)
		REFERENCES directive.directive_deliveries(directive_revision_id, id)
		ON DELETE RESTRICT,
	FOREIGN KEY (directive_revision_id, staff_target_id)
		REFERENCES directive.directive_revision_staff_targets(directive_revision_id, id)
		ON DELETE RESTRICT,
	FOREIGN KEY (directive_revision_id, unit_target_id)
		REFERENCES directive.directive_revision_unit_targets(directive_revision_id, id)
		ON DELETE RESTRICT,
	FOREIGN KEY (directive_revision_id, office_target_id)
		REFERENCES directive.directive_revision_office_targets(directive_revision_id, id)
		ON DELETE RESTRICT,
	FOREIGN KEY (directive_revision_id, role_target_id)
		REFERENCES directive.directive_revision_role_targets(directive_revision_id, id)
		ON DELETE RESTRICT,
	CHECK (num_nonnulls(staff_target_id, unit_target_id, office_target_id, role_target_id) = 1),
	UNIQUE NULLS NOT DISTINCT (
		delivery_id,
		staff_target_id,
		unit_target_id,
		office_target_id,
		role_target_id
	)
);

CREATE TABLE directive.directive_acknowledgements (
	id VARCHAR(80) PRIMARY KEY,
	directive_revision_id VARCHAR(80) NOT NULL,
	delivery_id VARCHAR(80) NOT NULL,
	staff_id VARCHAR(50) NOT NULL,
	statement_snapshot TEXT,
	acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB
		CHECK (jsonb_typeof(metadata) = 'object'),
	UNIQUE (delivery_id),
	FOREIGN KEY (directive_revision_id, delivery_id, staff_id)
		REFERENCES directive.directive_deliveries(directive_revision_id, id, staff_id)
		ON DELETE RESTRICT
);

CREATE TABLE directive.directive_events (
	id VARCHAR(80) PRIMARY KEY,
	directive_id VARCHAR(80) NOT NULL
		REFERENCES directive.directives(id) ON DELETE RESTRICT,
	directive_revision_id VARCHAR(80),
	event_type directive.event_type NOT NULL,
	actor_type directive.event_actor_type NOT NULL,
	actor_staff_id VARCHAR(50) REFERENCES identity.staff(id) ON DELETE RESTRICT,
	actor_assignment_id VARCHAR(50)
		REFERENCES identity.role_assignments(id) ON DELETE RESTRICT,
	correlation_id VARCHAR(100),
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB
		CHECK (jsonb_typeof(metadata) = 'object'),
	occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	FOREIGN KEY (directive_id, directive_revision_id)
		REFERENCES directive.directive_revisions(directive_id, id)
		ON DELETE RESTRICT,
	CONSTRAINT directive_event_actor_shape CHECK (
		(actor_type = 'staff' AND actor_staff_id IS NOT NULL)
		OR (actor_type = 'system' AND actor_staff_id IS NULL AND actor_assignment_id IS NULL)
	)
);

CREATE TABLE directive.directive_completion_evidence (
	id VARCHAR(80) PRIMARY KEY,
	directive_id VARCHAR(80) NOT NULL
		REFERENCES directive.directives(id) ON DELETE RESTRICT,
	directive_revision_id VARCHAR(80) NOT NULL,
	document_version_id VARCHAR(50)
		REFERENCES document.document_versions(id) ON DELETE RESTRICT,
	media_asset_id VARCHAR(50)
		REFERENCES media.media_assets(id) ON DELETE RESTRICT,
	description TEXT,
	submitted_by_staff_id VARCHAR(50) NOT NULL
		REFERENCES identity.staff(id) ON DELETE RESTRICT,
	submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	FOREIGN KEY (directive_id, directive_revision_id)
		REFERENCES directive.directive_revisions(directive_id, id)
		ON DELETE RESTRICT,
	CHECK (num_nonnulls(document_version_id, media_asset_id) = 1)
);

CREATE TABLE directive.directive_completion_evidence_acceptances (
	id VARCHAR(80) PRIMARY KEY,
	evidence_id VARCHAR(80) NOT NULL UNIQUE
		REFERENCES directive.directive_completion_evidence(id) ON DELETE RESTRICT,
	accepted_by_staff_id VARCHAR(50) NOT NULL
		REFERENCES identity.staff(id) ON DELETE RESTRICT,
	accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	note TEXT
);

CREATE OR REPLACE FUNCTION directive.enforce_directive_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
	IF NEW.version <> OLD.version + 1 THEN
		RAISE EXCEPTION 'directive version must increment by exactly one'
			USING ERRCODE = '40001';
	END IF;

	IF OLD.status <> NEW.status AND NOT (
		(OLD.status = 'draft' AND NEW.status = 'issued')
		OR (OLD.status = 'issued' AND NEW.status IN ('withdrawn', 'completed'))
	) THEN
		RAISE EXCEPTION 'invalid directive lifecycle transition from % to %', OLD.status, NEW.status
			USING ERRCODE = '23514';
	END IF;

	IF OLD.status <> 'draft' AND (
		NEW.reference_number IS DISTINCT FROM OLD.reference_number
		OR NEW.issued_by_staff_id IS DISTINCT FROM OLD.issued_by_staff_id
		OR NEW.issued_under_assignment_id IS DISTINCT FROM OLD.issued_under_assignment_id
		OR NEW.issuing_unit_id IS DISTINCT FROM OLD.issuing_unit_id
		OR NEW.issuing_office_id IS DISTINCT FROM OLD.issuing_office_id
		OR NEW.issuer_name_snapshot IS DISTINCT FROM OLD.issuer_name_snapshot
		OR NEW.issuer_designation_snapshot IS DISTINCT FROM OLD.issuer_designation_snapshot
		OR NEW.issuer_unit_name_snapshot IS DISTINCT FROM OLD.issuer_unit_name_snapshot
		OR NEW.issued_at IS DISTINCT FROM OLD.issued_at
		OR NEW.created_at IS DISTINCT FROM OLD.created_at
	) THEN
		RAISE EXCEPTION 'issued directive authority evidence is immutable'
			USING ERRCODE = '55000';
	END IF;

	RETURN NEW;
END
$$;

CREATE OR REPLACE FUNCTION directive.enforce_delivery_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
	IF TG_OP = 'DELETE' THEN
		RAISE EXCEPTION 'directive_deliveries is append-only; DELETE is not permitted'
			USING ERRCODE = '55000';
	END IF;

	IF NEW.id IS DISTINCT FROM OLD.id
		OR NEW.directive_revision_id IS DISTINCT FROM OLD.directive_revision_id
		OR NEW.staff_id IS DISTINCT FROM OLD.staff_id
		OR NEW.delivered_at IS DISTINCT FROM OLD.delivered_at
		OR OLD.seen_at IS NOT NULL
		OR NEW.seen_at IS NULL
	THEN
		RAISE EXCEPTION 'only the first seen_at update is permitted on directive deliveries'
			USING ERRCODE = '55000';
	END IF;

	RETURN NEW;
END
$$;

CREATE TRIGGER enforce_directive_transition
	BEFORE UPDATE ON directive.directives
	FOR EACH ROW EXECUTE FUNCTION directive.enforce_directive_transition();

CREATE TRIGGER enforce_delivery_mutation
	BEFORE UPDATE OR DELETE ON directive.directive_deliveries
	FOR EACH ROW EXECUTE FUNCTION directive.enforce_delivery_mutation();

DO $$
DECLARE
	table_name TEXT;
BEGIN
	FOREACH table_name IN ARRAY ARRAY[
		'directive_revisions',
		'directive_revision_staff_targets',
		'directive_revision_unit_targets',
		'directive_revision_office_targets',
		'directive_revision_role_targets',
		'directive_delivery_sources',
		'directive_acknowledgements',
		'directive_events',
		'directive_completion_evidence',
		'directive_completion_evidence_acceptances'
	]
	LOOP
		EXECUTE format(
			'CREATE TRIGGER prevent_mutation BEFORE UPDATE OR DELETE ON directive.%I FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation()',
			table_name
		);
	END LOOP;
END
$$;

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

-- Migrate the optional pre-migration reference model if it was found above.
DO $$
BEGIN
	IF to_regclass('directive.directives_legacy') IS NOT NULL THEN
		INSERT INTO directive.directives (
			id,
			reference_number,
			status,
			issued_by_staff_id,
			issuing_unit_id,
			issuing_office_id,
			issuer_name_snapshot,
			issuer_designation_snapshot,
			issuer_unit_name_snapshot,
			issued_at,
			effective_from,
			withdrawn_at,
			withdrawn_by_staff_id,
			withdrawal_reason,
			created_at,
			updated_at
		)
		SELECT
			d.id,
			'LEGACY/' || d.id,
			'draft'::directive.lifecycle_status,
			d.issued_by,
			s.unit_id,
			s.office_id,
			COALESCE(
				NULLIF(BTRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''),
				'Legacy staff ' || s.staff_number::TEXT
			),
			des.title,
			ou.full_name,
			COALESCE(d.issued_at, d.created_at),
			COALESCE(d.issued_at, d.created_at),
			NULL,
			NULL,
			NULL,
			d.created_at,
			d.updated_at
		FROM directive.directives_legacy d
		JOIN identity.staff s ON s.id = d.issued_by
		LEFT JOIN identity.users u ON u.id = s.identity_id
		LEFT JOIN identity.designations des ON des.id = s.designation_id
		LEFT JOIN identity.organizational_units ou ON ou.id = s.unit_id;

		INSERT INTO directive.directive_revisions (
			id,
			directive_id,
			revision_number,
			heading,
			instruction,
			priority,
			registry_volume,
			created_by_staff_id,
			created_at
		)
		SELECT
			'DRV-' || MD5(d.id),
			d.id,
			1,
			d.heading,
			d.instruction,
			d.priority,
			d.registry_volume,
			d.issued_by,
			d.created_at
		FROM directive.directives_legacy d;

		UPDATE directive.directives current
		SET
			current_revision_id = 'DRV-' || MD5(legacy.id),
			status = CASE legacy.status::TEXT
				WHEN 'active' THEN 'issued'::directive.lifecycle_status
				WHEN 'cancelled' THEN 'issued'::directive.lifecycle_status
				ELSE 'draft'::directive.lifecycle_status
			END,
			version = 2,
			updated_at = COALESCE(legacy.updated_at, NOW())
		FROM directive.directives_legacy legacy
		WHERE current.id = legacy.id;

		UPDATE directive.directives current
		SET
			status = 'withdrawn',
			withdrawn_at = COALESCE(legacy.updated_at, legacy.issued_at, legacy.created_at),
			withdrawn_by_staff_id = legacy.issued_by,
			withdrawal_reason = 'Migrated from the legacy cancelled state',
			version = 3,
			updated_at = COALESCE(legacy.updated_at, NOW())
		FROM directive.directives_legacy legacy
		WHERE current.id = legacy.id
			AND legacy.status::TEXT = 'cancelled';
	END IF;
END
$$;

DO $$
BEGIN
	IF to_regclass('directive.directive_staff_recipients_legacy') IS NOT NULL THEN
		INSERT INTO directive.directive_revision_staff_targets (
			id, directive_revision_id, staff_id, created_by_staff_id, created_at
		)
		SELECT
			r.id,
			'DRV-' || MD5(r.directive_id),
			r.staff_id,
			d.issued_by,
			r.created_at
		FROM directive.directive_staff_recipients_legacy r
		JOIN directive.directives_legacy d ON d.id = r.directive_id;

		INSERT INTO directive.directive_deliveries (
			id, directive_revision_id, staff_id, delivered_at, seen_at
		)
		SELECT
			'DDL-' || MD5(r.id),
			'DRV-' || MD5(r.directive_id),
			r.staff_id,
			CASE
				WHEN r.seen_at IS NULL THEN COALESCE(d.issued_at, r.created_at)
				ELSE LEAST(COALESCE(d.issued_at, r.created_at), r.seen_at)
			END,
			r.seen_at
		FROM directive.directive_staff_recipients_legacy r
		JOIN directive.directives_legacy d ON d.id = r.directive_id;

		INSERT INTO directive.directive_delivery_sources (
			id, directive_revision_id, delivery_id, staff_target_id, created_at
		)
		SELECT
			'DDS-' || MD5(r.id),
			'DRV-' || MD5(r.directive_id),
			'DDL-' || MD5(r.id),
			r.id,
			r.created_at
		FROM directive.directive_staff_recipients_legacy r;

		INSERT INTO directive.directive_acknowledgements (
			id, directive_revision_id, delivery_id, staff_id, acknowledged_at,
			statement_snapshot, metadata
		)
		SELECT
			'DAK-' || MD5(r.id),
			'DRV-' || MD5(r.directive_id),
			'DDL-' || MD5(r.id),
			r.staff_id,
			r.acknowledged_at,
			'Legacy acknowledgement',
			'{"migrationSource":"directive_staff_recipients"}'::JSONB
		FROM directive.directive_staff_recipients_legacy r
		WHERE r.acknowledged_at IS NOT NULL;
	END IF;

	IF to_regclass('directive.directive_unit_targets_legacy') IS NOT NULL THEN
		INSERT INTO directive.directive_revision_unit_targets (
			id, directive_revision_id, unit_id, created_by_staff_id, created_at
		)
		SELECT t.id, 'DRV-' || MD5(t.directive_id), t.unit_id, d.issued_by, t.created_at
		FROM directive.directive_unit_targets_legacy t
		JOIN directive.directives_legacy d ON d.id = t.directive_id;
	END IF;

	IF to_regclass('directive.directive_office_targets_legacy') IS NOT NULL THEN
		INSERT INTO directive.directive_revision_office_targets (
			id, directive_revision_id, office_id, created_by_staff_id, created_at
		)
		SELECT t.id, 'DRV-' || MD5(t.directive_id), t.office_id, d.issued_by, t.created_at
		FROM directive.directive_office_targets_legacy t
		JOIN directive.directives_legacy d ON d.id = t.directive_id;
	END IF;

	IF to_regclass('directive.directive_role_targets_legacy') IS NOT NULL THEN
		INSERT INTO directive.directive_revision_role_targets (
			id, directive_revision_id, role_id, scope_type, created_by_staff_id, created_at
		)
		SELECT
			t.id,
			'DRV-' || MD5(t.directive_id),
			t.role_id,
			'organization'::directive.target_scope_type,
			d.issued_by,
			t.created_at
		FROM directive.directive_role_targets_legacy t
		JOIN directive.directives_legacy d ON d.id = t.directive_id;
	END IF;
END
$$;

DROP TABLE IF EXISTS directive.directive_staff_recipients_legacy;
DROP TABLE IF EXISTS directive.directive_unit_targets_legacy;
DROP TABLE IF EXISTS directive.directive_office_targets_legacy;
DROP TABLE IF EXISTS directive.directive_role_targets_legacy;
DROP TABLE IF EXISTS directive.directives_legacy;

CREATE VIEW directive.directive_compliance_summary AS
WITH delivery_totals AS (
	SELECT
		delivery.directive_revision_id,
		COUNT(*) AS total_recipients,
		COUNT(seen_at) AS seen_count,
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

REVOKE UPDATE, DELETE, TRUNCATE ON
	directive.directive_revisions,
	directive.directive_revision_staff_targets,
	directive.directive_revision_unit_targets,
	directive.directive_revision_office_targets,
	directive.directive_revision_role_targets,
	directive.directive_delivery_sources,
	directive.directive_acknowledgements,
	directive.directive_events,
	directive.directive_completion_evidence,
	directive.directive_completion_evidence_acceptances
FROM PUBLIC;

COMMENT ON TABLE directive.directives IS
	'Authoritative directive aggregate and lifecycle state. Exact wording lives in immutable revisions.';
COMMENT ON TABLE directive.directive_revisions IS
	'Immutable snapshots of directive wording, expected outcome, deadlines, and source document evidence.';
COMMENT ON TABLE directive.directive_deliveries IS
	'Resolved staff audience for a specific directive revision; seen_at may be set once.';
COMMENT ON TABLE directive.directive_events IS
	'Append-only directive lifecycle and authority evidence.';
COMMENT ON VIEW directive.directive_compliance_summary IS
	'Compliance totals for each directive current revision; target specifications are not counted as recipients.';
