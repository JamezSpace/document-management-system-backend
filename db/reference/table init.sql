-- REFERENCE-ONLY SQL CATALOGUE. `db/migrations` is the authoritative schema history.
-- Do not apply this file as a schema change. Add every new or modified database change
-- to a numbered migration first; mirror it here only for browsing or test support.
-- This catalogue shows the final structural state. Data backfills, permission inserts,
-- and versioned governance-policy/rule records remain in their numbered migrations.

CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS media;
CREATE SCHEMA IF NOT EXISTS document;
CREATE SCHEMA IF NOT EXISTS directive;
CREATE SCHEMA IF NOT EXISTS dispatch;
CREATE SCHEMA IF NOT EXISTS policy;
CREATE SCHEMA IF NOT EXISTS workflow;
CREATE SCHEMA IF NOT EXISTS notifications;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS registry;
CREATE SCHEMA IF NOT EXISTS records;

CREATE EXTENSION IF NOT EXISTS btree_gist;

drop table if exists identity.users cascade;
drop table if exists identity.staff;
drop table if exists document.correspondence_subjects;
drop table if exists document.business_functions;

-- IDENTITY SCHEMA TYPES
CREATE TYPE identity.user_status AS ENUM (
    'pending','active','suspended', 'deleted', 'retired', 'resigned', 'terminated'
);
CREATE TYPE identity.invite_status AS ENUM (
    'pending','accepted','rejected', 'expired'
);
CREATE TYPE identity.onboarding_session_status AS ENUM (
    'in_progress','completed','abandoned'
);
CREATE TYPE identity.employment_type AS ENUM (
    'permanent', 'probationary', 'contract', 'intern', 'ad_hoc', 'sabbatical'
);
CREATE TYPE identity.org_unit_sector AS ENUM(
	'academic', 'non-academic'
);
CREATE TYPE identity.capability_class_category AS ENUM(
	'leadership', 'professional officers', 'clerical & records', 'operational support'
);
CREATE TYPE identity.role_assignments_source AS ENUM(
	'derived', 'manual', 'delegated'
);
CREATE TYPE identity.authorization_scope_type AS ENUM (
	'organization', 'unit', 'office'
);
CREATE TYPE identity.activation_status AS ENUM (
    'pending',
    'processing',
    'failed',
    'completed'
);
CREATE TYPE identity.recovery_task_status AS ENUM (
    'pending',
    'resolved',
    'failed'
);
CREATE TYPE identity.recovery_task_type AS ENUM (
    'staff_creation',
    'staff_activation',
    'email_delivery'
);

-- POLICY-OWNED DOCUMENT GOVERNANCE TYPES
CREATE TYPE policy.document_sensitivity_level AS ENUM(
	'public', 'internal', 'confidential', 'restricted'
);

CREATE TYPE policy.document_governance_policy_status AS ENUM(
	'draft', 'approved', 'active', 'retired'
);

CREATE TYPE policy.document_governance_rule_effect AS ENUM(
	'allow', 'deny'
);
CREATE TYPE policy.document_grant_type AS ENUM(
	'guest_reader', 'export'
);
CREATE TYPE policy.document_grantor_authority AS ENUM(
	'originator', 'unit_head'
);
CREATE TYPE policy.sensitivity_change_status AS ENUM(
	'pending', 'approved', 'rejected', 'applied'
);
CREATE TYPE policy.extraction_action AS ENUM(
	'export', 'print'
);

-- DOCUMENT SCHEMA TYPES
CREATE TYPE document.correspondence_direction AS ENUM(
	'internal', 'external'
);
CREATE TYPE document.lifecycle_state AS ENUM(
	'draft', 'in_review', 'active', 'declared_record', 'archived', 'cancelled', 'disposed'
);
CREATE TYPE document.lifecycle_actions AS ENUM(
	'save', 'create', 'submit', 'approve', 'reject',  'cancel', 'activate', 'declare_record', 'archive', 'delete', 'dispose'
);
CREATE TYPE document.minute_action AS ENUM(
	'comment', 'instruction', 'recommend', 'approve',
    'reject', 'forward', 'escalate', 'acknowledge'
);
CREATE TYPE document.relationship_type AS ENUM (
    'attachment', 'annexure',
    'reference', 'related'
);
CREATE TYPE document.attachment_source_type AS ENUM (
	'internal_document', 'external_upload'
);


-- DISPATCH SCHEMA TYPES
CREATE TYPE dispatch.dispatch_type AS ENUM(
    'direct', 'cc', 'broadcast', 'forward', 'escalation'
);
CREATE TYPE dispatch.status AS ENUM(
    'pending', 'delivered', 'read', 'acknowledged', 'forwarded',
	'in_transit', 'returned', 'failed', 'cancelled'
);
CREATE TYPE dispatch.inbox_entry_status AS ENUM(
	'unread', 'read', 'acknowledged', 'in_handover'
);
CREATE TYPE dispatch.delivery_channel AS ENUM (
	'internal_inbox', 'email', 'courier', 'hand_delivery', 'postal'
);
CREATE TYPE dispatch.recipient_type AS ENUM (
	'staff', 'designation', 'office', 'unit', 'external'
);
CREATE TYPE dispatch.source_type AS ENUM (
	'document', 'registry_entry'
);

-- WORKFLOW SCHEMA TYPES
CREATE TYPE workflow.instance_status as ENUM(
    'in_progress','completed', 'rejected'
);

CREATE TYPE workflow.task_status as ENUM(
    'pending','approved', 'rejected'
);

-- POLICY SCHEMA TYPES
CREATE TYPE policy.resolution_strategy AS ENUM (
    'direct_supervisor',
    'role_in_unit',
    'role_in_office'
);

-- DIRECTIVE SCHEMA TYPES
CREATE TYPE directive.priority AS ENUM (
    'urgent',
    'standard'
);
CREATE TYPE directive.registry_volume AS ENUM (
    'operations',
    'official'
);
CREATE TYPE directive.status AS ENUM (
    'draft',
    'active',
    'cancelled'
);

-- NOTIFICATIONS SCHEMA TYPES
CREATE TYPE notifications.recipient_type as ENUM (
    'user', 'role'
);
CREATE TYPE notifications.preference as ENUM (
    'in app', 'email'
);
CREATE TYPE notifications.priority as ENUM (
    'low', 'high', 'normal'
);
CREATE TYPE notifications.state as ENUM (
    'pending', 'sent', 'failed', 'read'
);

-- MEDIA TYPES
CREATE TYPE media.uploaded_by_type as ENUM (
    'staff', 'onboarding_session', 'system'
);

-- AUDIT SCHEMA TYPES
CREATE TYPE audit.actor_type AS ENUM (
	'staff', 'system', 'external'
);
CREATE TYPE audit.outcome AS ENUM (
	'success', 'denied', 'failed'
);

-- REGISTRY SCHEMA TYPES
CREATE TYPE registry.intake_channel AS ENUM (
	'physical', 'email', 'courier', 'upload', 'postal', 'other'
);
CREATE TYPE registry.priority AS ENUM (
	'low', 'normal', 'high', 'urgent'
);
CREATE TYPE registry.intake_status AS ENUM (
	'received', 'awaiting_digitization', 'digitizing', 'awaiting_verification',
	'awaiting_registration', 'awaiting_dispatch', 'dispatched', 'closed', 'cancelled'
);
CREATE TYPE registry.reference_reset_period AS ENUM (
	'annual', 'monthly', 'never'
);
CREATE TYPE registry.digitization_status AS ENUM (
	'pending', 'in_progress', 'awaiting_verification', 'verified', 'rejected', 'failed', 'cancelled'
);
CREATE TYPE registry.ocr_status AS ENUM (
	'queued', 'processing', 'completed', 'failed'
);
CREATE TYPE registry.verification_outcome AS ENUM (
	'accepted', 'rejected'
);
CREATE TYPE registry.entry_status AS ENUM (
	'registered', 'awaiting_dispatch', 'dispatched', 'closed'
);
CREATE TYPE registry.custodian_type AS ENUM (
	'staff', 'office', 'unit', 'external'
);
CREATE TYPE registry.custody_event_type AS ENUM (
	'released', 'received', 'returned', 'located'
);
CREATE TYPE registry.correspondence_direction AS ENUM (
	'incoming', 'outgoing'
);
CREATE TYPE registry.correspondence_channel AS ENUM (
	'physical', 'email', 'courier', 'internal', 'postal', 'other'
);

-- RECORDS SCHEMA TYPES
CREATE TYPE records.retention_trigger_event AS ENUM (
	'declaration', 'case_closed', 'contract_ended', 'last_action', 'custom'
);
CREATE TYPE records.disposition_action AS ENUM (
	'archive', 'destroy', 'review'
);
CREATE TYPE records.record_status AS ENUM (
	'active', 'on_hold', 'transferring', 'archived', 'disposed'
);
CREATE TYPE records.location_type AS ENUM (
	'room', 'cabinet', 'shelf', 'box', 'digital'
);
CREATE TYPE records.placement_event_type AS ENUM (
	'placed', 'removed'
);
CREATE TYPE records.legal_hold_status AS ENUM (
	'active', 'released'
);
CREATE TYPE records.legal_hold_event_type AS ENUM (
	'placed', 'record_added', 'released'
);
CREATE TYPE records.transfer_status AS ENUM (
	'pending', 'approved', 'rejected', 'in_transit', 'completed', 'cancelled'
);
CREATE TYPE records.disposal_request_status AS ENUM (
	'pending', 'approved', 'rejected', 'executed', 'cancelled'
);
CREATE TYPE records.disposal_decision AS ENUM (
	'approved', 'rejected'
);



-- IDENTITY SCHEMA
-- users table
create table identity.users (
	id varchar(50) primary key not null,
	auth_provider VARCHAR(50) NOT NULL,
	auth_provider_id VARCHAR(255) unique NOT NULL,
	email varchar(255) unique not null,
	first_name varchar(25) not null,
	last_name varchar(25) not null,
	middle_name varchar(25),
	phone_number varchar(25) not null,
	status identity.user_status NOT NULL,
	created_at TIMESTAMPTZ NOT NULL,
	updated_at TIMESTAMPTZ
);

-- invite table
create table identity.invites (
	id varchar(50) primary key not null,
	email varchar(255) not null,
	unit_id varchar(50) REFERENCES identity.organizational_units(id) not null,
	office_id varchar(50) REFERENCES identity.offices(id) not null,
	designation_id varchar(50) REFERENCES identity.designations(id) not null,
    employment_type identity.employment_type NOT NULL,
    invited_by varchar(50) REFERENCES identity.staff(id) NOT NULL,
    token TEXT,
    is_used BOOLEAN default false,
    expires_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    status identity.invite_status NOT NULL,
	created_at TIMESTAMPTZ NOT NULL,
	updated_at TIMESTAMPTZ
);

-- onboarding session
CREATE TABLE identity.onboarding_sessions (
    id VARCHAR(50) PRIMARY KEY,
    invite_id VARCHAR(50) REFERENCES identity.invites(id) UNIQUE NOT NULL,

    email VARCHAR(255) NOT NULL,

    -- step tracking
    current_step INT NOT NULL DEFAULT 1,

    -- partial data storage
    primary_data JSONB,
    profile_picture_media_id VARCHAR(50) REFERENCES media.media_assets(id),
    signature_media_id VARCHAR(50) REFERENCES media.media_assets(id),

    status identity.onboarding_session_status NOT NULL,

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- organizational units table
CREATE TABLE identity.organizational_units(
	id varchar(50) PRIMARY KEY,
	code VARCHAR(50),
	full_name VARCHAR(150) NOT NULL,
	description TEXT NOT NULL,
	sector identity.org_unit_sector NOT NULL,
    parent_id varchar(50) REFERENCES identity.organizational_units(id),
	created_at TIMESTAMPTZ NOT NULL,
	updated_at TIMESTAMPTZ
);

-- offices table
CREATE TABLE identity.offices(
	id VARCHAR(50) PRIMARY KEY,
	name VARCHAR(150) NOT NULL,
	unit_id VARCHAR(50) REFERENCES identity.organizational_units(id),
	created_at TIMESTAMPTZ NOT NULL,
	updated_at TIMESTAMPTZ
);

-- designations table (this comes directly from the organogram)
CREATE TABLE identity.designations(
	id VARCHAR(50) PRIMARY KEY,
	title VARCHAR(150) NOT NULL,
	description TEXT,
	office_id VARCHAR(50) REFERENCES identity.offices(id),
	created_at TIMESTAMPTZ NOT NULL,
	updated_at TIMESTAMPTZ 
);

-- table allows same designation in different units to have different hierarchy_level
CREATE TABLE identity.office_designations(
    id VARCHAR(50) PRIMARY KEY,
    office_id VARCHAR(50) REFERENCES identity.offices(id) ON DELETE CASCADE,
    designation_id VARCHAR(50) REFERENCES identity.designations(id),
    hierarchy_level INTEGER NOT NULL, 
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ,
    
    UNIQUE(office_id, designation_id) -- prevents duplicate designations in the same office
);

-- staff table
CREATE TABLE identity.staff(
	id varchar(50) PRIMARY KEY,
	identity_id varchar(50) UNIQUE REFERENCES identity.users(id),
	staff_number integer UNIQUE NOT NULL,
	employment_type identity.employment_type NOT NULL,
	unit_id varchar(50) references identity.organizational_units(id),
	office_id VARCHAR(50) references identity.offices(id),
	designation_id VARCHAR(50) REFERENCES identity.designations(id),
	status identity.user_status not null,
	created_at TIMESTAMPTZ NOT NULL,
	created_by VARCHAR(50) REFERENCES identity.staff(id),
	activated_by VARCHAR(50) REFERENCES identity.staff(id),
	activated_at TIMESTAMPTZ,
	updated_at TIMESTAMPTZ,

    CONSTRAINT fk_staff_office_designation 
        FOREIGN KEY (office_id, designation_id) 
        REFERENCES identity.office_designations(office_id, designation_id)
);

-- staff reporting line
CREATE TABLE identity.staff_reporting_lines (
    id VARCHAR(50) PRIMARY KEY,
    staff_id VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
    supervisor_id VARCHAR(50) NOT NULL REFERENCES identity.staff(id),

    type VARCHAR(30) NOT NULL, 
    -- 'PRIMARY', 'DELEGATED'

    delegated_by VARCHAR(50) REFERENCES identity.staff(id),

    effective_from TIMESTAMPTZ NOT NULL,
    effective_to TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL
);

-- capability class
CREATE TABLE identity.capability_classes(
    id varchar(50) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category identity.capability_class_category NOT NULL,     
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE identity.designation_capability_defaults (
    designation_id VARCHAR(50) 
        REFERENCES identity.designations(id),
    capability_class_id VARCHAR(50) 
        REFERENCES identity.capability_classes(id),
    PRIMARY KEY (designation_id)
);

-- staff classification
CREATE TABLE identity.staff_classifications(
	id varchar(50) PRIMARY KEY,
	staff_id varchar(50) REFERENCES identity.staff(id),
	capability_class_id VARCHAR(50) REFERENCES identity.capability_classes(id),
	authority_level INTEGER NOT NULL,
	effective_from DATE NOT NULL,
	effective_to DATE,
	created_at TIMESTAMPTZ NOT NULL,
	updated_at TIMESTAMPTZ
);

-- permissions table
CREATE TABLE identity.permissions(
	id varchar(50) PRIMARY KEY,
	code VARCHAR(100) UNIQUE NOT NULL,
	description TEXT
);

-- roles table
CREATE TABLE identity.roles(
	id varchar(50) PRIMARY KEY,
	name VARCHAR(100) UNIQUE NOT NULL,
	created_at TIMESTAMPTZ NOT NULL
);

-- roles-permissions table
CREATE TABLE identity.role_permissions(
    role_id varchar(50) REFERENCES identity.roles(id),
    permission_id varchar(50) REFERENCES identity.permissions(id),
	PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE identity.capability_role_mappings (
    capability_class_id VARCHAR(50) 
        REFERENCES identity.capability_classes(id),
    role_id VARCHAR(50) 
        REFERENCES identity.roles(id),
    PRIMARY KEY (capability_class_id, role_id)
);

-- role assignments
CREATE TABLE identity.role_assignments(
	id varchar(50) PRIMARY KEY,
	staff_id varchar(50) REFERENCES identity.staff(id),
	role_id varchar(50) REFERENCES identity.roles(id),
	scope JSONB, -- deprecated compatibility column
	scope_type identity.authorization_scope_type NOT NULL DEFAULT 'organization',
	scope_unit_id VARCHAR(50),
	scope_office_id VARCHAR(50),
	delegated_by varchar(50) REFERENCES identity.staff(id),
	assigned_by VARCHAR(50),
	revoked_by VARCHAR(50),
	revoked_at TIMESTAMPTZ,
    source identity.role_assignments_source not null,
	valid_from TIMESTAMPTZ NOT NULL,
	valid_to TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL,
	CONSTRAINT fk_role_assignments_scope_unit FOREIGN KEY (scope_unit_id)
		REFERENCES identity.organizational_units(id),
	CONSTRAINT fk_role_assignments_scope_office FOREIGN KEY (scope_office_id)
		REFERENCES identity.offices(id),
	CONSTRAINT fk_role_assignments_assigned_by FOREIGN KEY (assigned_by)
		REFERENCES identity.staff(id),
	CONSTRAINT fk_role_assignments_revoked_by FOREIGN KEY (revoked_by)
		REFERENCES identity.staff(id),
	CONSTRAINT role_assignments_valid_range
		CHECK (valid_to IS NULL OR valid_to > valid_from),
	CONSTRAINT role_assignments_scope_shape CHECK (
		(scope_type = 'organization' AND scope_unit_id IS NULL AND scope_office_id IS NULL)
		OR (scope_type = 'unit' AND scope_unit_id IS NOT NULL AND scope_office_id IS NULL)
		OR (scope_type = 'office' AND scope_unit_id IS NULL AND scope_office_id IS NOT NULL)
	),
	CONSTRAINT role_assignments_revocation_shape CHECK (
		(revoked_at IS NULL AND revoked_by IS NULL)
		OR (revoked_at IS NOT NULL AND revoked_by IS NOT NULL)
	),
	CONSTRAINT role_assignments_no_overlapping_scope EXCLUDE USING gist (
		staff_id WITH =,
		role_id WITH =,
		scope_type WITH =,
		(COALESCE(scope_unit_id, '')) WITH =,
		(COALESCE(scope_office_id, '')) WITH =,
		tstzrange(valid_from, COALESCE(valid_to, 'infinity'::TIMESTAMPTZ), '[)') WITH &&
	) WHERE (revoked_at IS NULL)
);

COMMENT ON COLUMN identity.role_assignments.scope IS
	'Deprecated compatibility column. Use scope_type, scope_unit_id and scope_office_id.';

-- staff media
CREATE TABLE identity.staff_media_assets (
    staff_id VARCHAR(50) REFERENCES identity.staff(id) ON DELETE CASCADE NOT NULL,
    media_id VARCHAR(50) REFERENCES media.media_assets(id) ON DELETE CASCADE NOT NULL,

    asset_role VARCHAR(50) NOT NULL, 
    -- e.g. PROFILE_PICTURE, SIGNATURE,
    is_active BOOLEAN DEFAULT FALSE,

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (staff_id, media_id),
    CONSTRAINT unique_staff_media UNIQUE (staff_id, media_id)
);

-- failure records
CREATE TABLE identity.staff_activation_failures (
    id VARCHAR(70) PRIMARY KEY,
    staff_id VARCHAR(50)
        REFERENCES identity.staff(id) NOT NULL,

    invite_id VARCHAR(50)
        REFERENCES identity.invites(id) NOT NULL,
    failure_stage VARCHAR(100) NOT NULL,
    failure_reason TEXT NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    retry_count INTEGER NOT NULL DEFAULT 0,

    first_failed_at TIMESTAMPTZ NOT NULL,
    last_failed_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ
);

CREATE TABLE identity.recovery_tasks (
    id VARCHAR(50) PRIMARY KEY,
    task_type identity.recovery_task_type NOT NULL,
    -- staff id / invite id / user id
    entity_id VARCHAR(50) NOT NULL,

    payload JSONB NOT NULL,
    error_message TEXT NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,

    status identity.recovery_task_status NOT NULL DEFAULT 'pending',
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);

-- MEDIA SCHEMA
-- media-assets
CREATE TABLE media.media_assets (
    id VARCHAR(50) PRIMARY KEY,

    storage_provider VARCHAR(50) NOT NULL, 
    -- e.g. LOCAL, S3, AZURE

    bucket_name VARCHAR(100),
    object_key VARCHAR(255) NOT NULL,
    format VARCHAR(5) NOT NULL,

    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    checksum VARCHAR(255) NOT NULL, -- SHA-256 recommended

    uploaded_at TIMESTAMPTZ NOT NULL,
    uploaded_by VARCHAR(50) NOT NULL,
    uploaded_by_type media.uploaded_by_type NOT NULL
);


-- DOCUMENTS SCHEMA
-- documents types
CREATE TABLE document.document_type (
    id VARCHAR(50) PRIMARY KEY,
    code varchar(10) UNIQUE NOT NULL,
    name varchar(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ
);

-- documents volumes
CREATE TABLE document.correspondence_subjects (
    id VARCHAR(50) PRIMARY KEY,
    code varchar(10) UNIQUE NOT NULL,
    name varchar(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ
);

CREATE TABLE document.business_functions (
    id VARCHAR(50) PRIMARY KEY,
    subject_id VARCHAR(50) REFERENCES document.correspondence_subjects(id) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ
);

-- ref number
CREATE TABLE document.reference_sequences (
    year INT NOT NULL,
    origin_unit_id varchar(50) REFERENCES identity.organizational_units NOT NULL,
    recipient_unit_id varchar(50) REFERENCES identity.organizational_units,
    subject_code varchar(50) REFERENCES document.correspondence_subjects(code) NOT NULL,
    function_code varchar(50) REFERENCES document.business_functions(code) NOT NULL,
    current_value INT NOT NULL,
	UNIQUE(year, origin_unit_id, recipient_unit_id, subject_code, function_code)
);

CREATE TABLE document.documents (
    id VARCHAR(50) PRIMARY KEY,

    -- core
    title VARCHAR(200) NOT NULL,
    owner_id varchar(50) REFERENCES identity.staff(id) NOT NULL,
    reference_number VARCHAR(50),
	revision BIGINT NOT NULL DEFAULT 1
		CONSTRAINT document_revision_positive CHECK (revision > 0),

	-- version data
	current_version_id varchar(50),

    -- correspondence metadata
    originating_unit_id varchar(50) REFERENCES identity.organizational_units(id) NOT NULL,
    subject_code_id varchar(50) REFERENCES document.correspondence_subjects(id) NOT NULL,
    direction document.correspondence_direction NOT NULL,

    -- classification metadata
    sensitivity policy.document_sensitivity_level NOT NULL,
	governance_policy_key VARCHAR(100) NOT NULL,
	governance_policy_version INT NOT NULL
		CONSTRAINT documents_governance_policy_version_positive CHECK(governance_policy_version > 0),
    business_function_id varchar(50) REFERENCES document.business_functions(id) NOT NULL,
    document_type_id varchar(50) REFERENCES document.document_type(id) NOT NULL,

    classified_by varchar(50) REFERENCES identity.staff(id) NOT NULL,
    classified_at TIMESTAMPTZ NOT NULL,

    last_reclassified_at TIMESTAMPTZ,
    last_reclassified_by varchar(50) REFERENCES identity.staff(id),

    -- retention metadata
	policy_version INT NOT NULL,
    retention_schedule_id VARCHAR(50) REFERENCES policy.document_retention(id) NOT NULL,
    retention_start_date TIMESTAMPTZ NOT NULL,
    disposal_eligibility_date TIMESTAMPTZ NOT NULL,
    archival_required BOOLEAN NOT NULL,

    -- audit sake
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- documents versions
CREATE TABLE document.document_versions (
    id VARCHAR(50) PRIMARY KEY,
    document_id varchar(50) REFERENCES document.documents(id)  ON DELETE CASCADE NOT NULL,
    version_number INT NOT NULL,

    content_delta JSONB NOT NULL,

    media_id varchar(50) REFERENCES media.media_assets(id) NULL,
    created_at TIMESTAMPTZ NOT NULL,
    created_by varchar(50) REFERENCES identity.staff(id) NOT NULL,
    lifecycle_state document.lifecycle_state NOT NULL,

    state_entered_at TIMESTAMPTZ NOT NULL,
    state_entered_by VARCHAR(50) 
    REFERENCES identity.staff(id) NOT NULL
);

-- MUST RUN TO ENFORCE FOREIGN KEY CONSTRAINT BETWEEN document.documents and document.document_versions
ALTER TABLE document.documents
ADD CONSTRAINT fk_document_version
FOREIGN KEY (current_version_id)
REFERENCES document.document_versions(id)
ON DELETE SET NULL;

ALTER TABLE document.document_versions
	ADD CONSTRAINT document_versions_document_id_id_unique
	UNIQUE (document_id, id);

-- documents lifecycle history
CREATE TABLE document.document_lifecycle_history (
    id VARCHAR(50) PRIMARY KEY,

    document_id VARCHAR(50) NOT NULL REFERENCES document.documents(id),
    document_version_id VARCHAR(50) REFERENCES document.document_versions(id),

    from_state document.lifecycle_state,
    to_state document.lifecycle_state NOT NULL,

    action document.lifecycle_actions NOT NULL,

    actor_id VARCHAR(50) NOT NULL REFERENCES identity.staff(id),

    metadata JSONB, -- optional (reason, comments, etc.)

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- documents addressee
CREATE TABLE document.document_addressee (
    document_id varchar(50) REFERENCES document.documents(id) NOT NULL,
    recipient_unit_id varchar(50) REFERENCES identity.organizational_units(id) NOT NULL,
    addressed_to_designation_id varchar(50) REFERENCES identity.designations(id) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    PRIMARY KEY (document_id, recipient_unit_id, addressed_to_designation_id)
);

-- documents media
CREATE TABLE document.document_media_assets (
    document_id VARCHAR(50) REFERENCES document.documents(id) ON DELETE CASCADE NOT NULL,
    document_version_id VARCHAR(50) REFERENCES document.document_versions(id) ON DELETE CASCADE,
    media_id VARCHAR(50) REFERENCES media.media_assets(id) ON DELETE CASCADE NOT NULL,
    
    asset_role VARCHAR(50) NOT NULL, 
    -- e.g. PRIMARY_CONTENT, ATTACHMENT

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (document_id, media_id)
);

-- Unified attachments: NexusFons documents are pinned to a version;
-- external files reference an uploaded media asset.
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

-- effective digital authorization used by governance rules for internal attachments.
CREATE TABLE document.document_unit_head_signatures (
	id VARCHAR(80) PRIMARY KEY,
	document_id VARCHAR(50) NOT NULL REFERENCES document.documents(id) ON DELETE CASCADE,
	signed_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	revoked_by VARCHAR(50) REFERENCES identity.staff(id),
	revoked_at TIMESTAMPTZ,
	revocation_reason TEXT,
	CHECK (
		(revoked_at IS NULL AND revoked_by IS NULL AND revocation_reason IS NULL)
		OR (revoked_at IS NOT NULL AND revoked_by IS NOT NULL AND revocation_reason IS NOT NULL)
	)
);

-- documents minutes
CREATE TABLE document.minutes (
    id VARCHAR(50) PRIMARY KEY,

    document_id VARCHAR(50)
        REFERENCES document.documents(id)
        ON DELETE CASCADE NOT NULL,

    inbox_entry_id VARCHAR(50)
        REFERENCES dispatch.inbox_entries(id),

    author_staff_id VARCHAR(50)
        REFERENCES identity.staff(id)
        NOT NULL,

    parent_minute_id VARCHAR(50)
        REFERENCES document.minutes(id),

    action document.minute_action NOT NULL,

    content TEXT DEFAULT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- makes attachments on docs possible
CREATE TABLE document.document_relationships (
    id VARCHAR(50) PRIMARY KEY,

    source_document_id VARCHAR(50)
        REFERENCES document.documents(id),

    target_document_id VARCHAR(50)
        REFERENCES document.documents(id),

    relationship_type document.relationship_type NOT NULL,

    created_by VARCHAR(50)
        REFERENCES identity.staff(id),

    created_at TIMESTAMPTZ NOT NULL
);

-- DISPATCH SCHEMA
CREATE TABLE dispatch.dispatch_records (
	id VARCHAR(50) PRIMARY KEY,
	document_id VARCHAR(50) REFERENCES document.documents(id) ON DELETE CASCADE,
	source_type dispatch.source_type NOT NULL DEFAULT 'document',
	registry_entry_id VARCHAR(80) REFERENCES registry.entries(id),
	sender_staff_id VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	sender_designation_id VARCHAR(50) REFERENCES identity.designations(id),
	sender_unit_id VARCHAR(50) NOT NULL REFERENCES identity.organizational_units(id),
	recipient_type dispatch.recipient_type NOT NULL DEFAULT 'designation',
	recipient_staff_id VARCHAR(50) REFERENCES identity.staff(id),
	recipient_designation_id VARCHAR(50) REFERENCES identity.designations(id),
	recipient_office_id VARCHAR(50) REFERENCES identity.offices(id),
	recipient_unit_id VARCHAR(50) REFERENCES identity.organizational_units(id),
	external_recipient JSONB,
	dispatch_type dispatch.dispatch_type NOT NULL,
	delivery_channel dispatch.delivery_channel NOT NULL DEFAULT 'internal_inbox',
	status dispatch.status NOT NULL,
	tracking_number VARCHAR(150),
	acknowledgement_required BOOLEAN NOT NULL DEFAULT FALSE,
	dispatched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	delivered_at TIMESTAMPTZ,
	returned_at TIMESTAMPTZ,
	failure_reason TEXT,
	delivery_evidence_media_id VARCHAR(50) REFERENCES media.media_assets(id),
	parent_dispatch_id VARCHAR(50) REFERENCES dispatch.dispatch_records(id),
	version INTEGER NOT NULL DEFAULT 1,
	CONSTRAINT dispatch_records_source_shape CHECK (
		(source_type = 'document' AND document_id IS NOT NULL AND registry_entry_id IS NULL)
		OR (source_type = 'registry_entry' AND document_id IS NULL AND registry_entry_id IS NOT NULL)
	),
	CONSTRAINT dispatch_records_recipient_shape CHECK (
		(recipient_type = 'staff' AND recipient_staff_id IS NOT NULL)
		OR (recipient_type = 'designation' AND recipient_designation_id IS NOT NULL AND recipient_unit_id IS NOT NULL)
		OR (recipient_type = 'office' AND recipient_office_id IS NOT NULL)
		OR (recipient_type = 'unit' AND recipient_unit_id IS NOT NULL)
		OR (recipient_type = 'external' AND external_recipient IS NOT NULL AND jsonb_typeof(external_recipient) = 'object')
	),
	CONSTRAINT dispatch_records_version_positive CHECK (version > 0)
);

CREATE TABLE dispatch.inbox_entries (
    id VARCHAR(50) PRIMARY KEY,

    dispatch_id VARCHAR(50)
        REFERENCES dispatch.dispatch_records(id)
        ON DELETE CASCADE NOT NULL,

    document_id VARCHAR(50)
        REFERENCES document.documents(id)
        ON DELETE CASCADE NOT NULL,

    -- actual recipient (resolved from designation)
    staff_id VARCHAR(50)
        REFERENCES identity.staff(id) NOT NULL,

    -- context snapshot
    designation_id VARCHAR(50) REFERENCES identity.designations(id) NOT NULL,
    unit_id VARCHAR(50) REFERENCES identity.organizational_units(id) NOT NULL,

    -- state
    status dispatch.inbox_entry_status NOT NULL DEFAULT 'unread', 

    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
	 acknowledged_at TIMESTAMPTZ,
	previous_staff_id VARCHAR(50) REFERENCES identity.staff(id),
	handed_over_at TIMESTAMPTZ,

	 UNIQUE (dispatch_id, staff_id)
);


-- POLICY SCHEMA
CREATE TABLE policy.document_retention (
    id VARCHAR(50) PRIMARY KEY,
	policy_version INT NOT NULL
		CONSTRAINT document_retention_policy_version_positive CHECK(policy_version > 0),
    document_type_id varchar(50) REFERENCES document.document_type(id) NOT NULL,
    archival_required BOOLEAN NOT NULL,
	retention_duration INT NOT NULL
		CONSTRAINT document_retention_duration_positive CHECK(retention_duration > 0),
    effective_from DATE NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

	UNIQUE(document_type_id, policy_version),
	UNIQUE(document_type_id, effective_from)
);

CREATE TABLE policy.document_retention_version_counters (
	document_type_id VARCHAR(50) PRIMARY KEY
		REFERENCES document.document_type(id) ON DELETE CASCADE,
	last_version INT NOT NULL CHECK(last_version > 0)
);

CREATE TABLE policy.document_governance_policies (
	id VARCHAR(80) PRIMARY KEY,
	policy_key VARCHAR(100) NOT NULL,
	policy_version INT NOT NULL CHECK(policy_version > 0),
	schema_version INT NOT NULL CHECK(schema_version > 0),
	status policy.document_governance_policy_status NOT NULL DEFAULT 'draft',
	effective_from TIMESTAMPTZ NOT NULL,
	effective_to TIMESTAMPTZ,
	definition_checksum CHAR(64) NOT NULL CHECK(
		definition_checksum ~ '^[0-9a-fA-F]{64}$'
	),
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	approved_by VARCHAR(50) REFERENCES identity.staff(id),
	approval_reason TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	approved_at TIMESTAMPTZ,
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK(
		jsonb_typeof(metadata) = 'object'
	),
	UNIQUE(policy_key, policy_version),
	CHECK(effective_to IS NULL OR effective_to > effective_from),
	CHECK(
		status = 'draft'
		OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)
	)
);

CREATE TABLE policy.document_governance_rules (
	id VARCHAR(80) PRIMARY KEY,
	governance_policy_id VARCHAR(80) NOT NULL
		REFERENCES policy.document_governance_policies(id) ON DELETE CASCADE,
	sensitivity policy.document_sensitivity_level,
	action VARCHAR(80) NOT NULL,
	effect policy.document_governance_rule_effect NOT NULL,
	conditions JSONB NOT NULL DEFAULT '{}'::JSONB CHECK(
		jsonb_typeof(conditions) = 'object'
	),
	obligations TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
	reason_code VARCHAR(120) NOT NULL,
	priority INT NOT NULL DEFAULT 100 CHECK(priority >= 0),
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE policy.document_governance_grants (
	id VARCHAR(80) PRIMARY KEY,
	document_id VARCHAR(50) NOT NULL REFERENCES document.documents(id) ON DELETE CASCADE,
	grantee_staff_id VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	grant_type policy.document_grant_type NOT NULL,
	granted_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	grantor_authority policy.document_grantor_authority NOT NULL,
	reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
	valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	valid_to TIMESTAMPTZ,
	remaining_uses INT CHECK (remaining_uses IS NULL OR remaining_uses >= 0),
	revoked_by VARCHAR(50) REFERENCES identity.staff(id),
	revoked_at TIMESTAMPTZ,
	revocation_reason TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CHECK (valid_to IS NULL OR valid_to > valid_from),
	CHECK (
		(revoked_at IS NULL AND revoked_by IS NULL AND revocation_reason IS NULL)
		OR (revoked_at IS NOT NULL AND revoked_by IS NOT NULL AND length(trim(revocation_reason)) > 0)
	)
);

CREATE TABLE policy.document_sensitivity_change_requests (
	id VARCHAR(80) PRIMARY KEY,
	document_id VARCHAR(50) NOT NULL REFERENCES document.documents(id) ON DELETE CASCADE,
	from_sensitivity policy.document_sensitivity_level NOT NULL,
	to_sensitivity policy.document_sensitivity_level NOT NULL,
	requested_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
	status policy.sensitivity_change_status NOT NULL,
	reviewed_by VARCHAR(50) REFERENCES identity.staff(id),
	review_reason TEXT,
	requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	reviewed_at TIMESTAMPTZ,
	applied_at TIMESTAMPTZ,
	CHECK (from_sensitivity <> to_sensitivity),
	CHECK (
		(status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL)
		OR (status <> 'pending' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
	)
);

CREATE TABLE policy.document_extractions (
	id VARCHAR(80) PRIMARY KEY,
	document_id VARCHAR(50) NOT NULL REFERENCES document.documents(id) ON DELETE CASCADE,
	document_revision BIGINT NOT NULL,
	actor_staff_id VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	extraction_action policy.extraction_action NOT NULL,
	grant_id VARCHAR(80) REFERENCES policy.document_governance_grants(id),
	policy_key VARCHAR(100) NOT NULL,
	policy_version INT NOT NULL CHECK (policy_version > 0),
	obligations TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
	watermark_text TEXT,
	artifact_sha256 CHAR(64) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE document.documents
	ADD CONSTRAINT documents_governance_policy_version_fk
	FOREIGN KEY (governance_policy_key, governance_policy_version)
	REFERENCES policy.document_governance_policies(policy_key, policy_version);

CREATE TABLE policy.approval_workflow_steps (
    id VARCHAR(50) PRIMARY KEY,
    policy_version INT NOT NULL,
    document_type_id VARCHAR(50)
        REFERENCES document.document_type(id)
        NOT NULL,

    step_order INT NOT NULL,

    role_id VARCHAR(50)
        REFERENCES identity.roles(id)
        NOT NULL,

    resolution_strategy policy.resolution_strategy NOT NULL,

    -- optional but useful
    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (document_type_id, policy_version, step_order)
);


-- WORKFLOW SCHEMA
CREATE TABLE workflow.workflow_instances (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) REFERENCES document.documents(id) ON DELETE CASCADE,

    current_step INT NOT NULL,
    status workflow.instance_status NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE workflow.workflow_tasks (
    id VARCHAR(50) PRIMARY KEY,

    workflow_instance_id VARCHAR(50)
        REFERENCES workflow.workflow_instances(id)
        ON DELETE CASCADE,

    step_order INT NOT NULL,

    assigned_to VARCHAR(50)
        REFERENCES identity.staff(id),

    minute_id VARCHAR(50)
        REFERENCES document.minutes(id),

    role VARCHAR(100) NOT NULL,

    status workflow.task_status NOT NULL, 

    acted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- DIRECTIVES SCHEMA
CREATE TABLE directive.directives (
    id VARCHAR(50) PRIMARY KEY,

    heading TEXT NOT NULL,
    instruction TEXT NOT NULL,

    issued_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),

    priority directive.priority NOT NULL,
    registry_volume directive.registry_volume NOT NULL,

    status directive.status NOT NULL DEFAULT 'draft',

    issued_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE directive.directive_staff_recipients (
    id VARCHAR(50) PRIMARY KEY,

    directive_id VARCHAR(50)
        REFERENCES directive.directives(id)
        ON DELETE CASCADE
        NOT NULL,

    staff_id VARCHAR(50)
        REFERENCES identity.staff(id)
        NOT NULL,

    seen_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (directive_id, staff_id)
);

CREATE TABLE directive.directive_unit_targets (
    id VARCHAR(50) PRIMARY KEY,

    directive_id VARCHAR(50)
        REFERENCES directive.directives(id)
        ON DELETE CASCADE
        NOT NULL,

    unit_id VARCHAR(50)
        REFERENCES identity.organizational_units(id)
        NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (directive_id, unit_id)
);

CREATE TABLE directive.directive_office_targets (
    id VARCHAR(50) PRIMARY KEY,

    directive_id VARCHAR(50)
        REFERENCES directive.directives(id)
        ON DELETE CASCADE
        NOT NULL,

    office_id VARCHAR(50)
        REFERENCES identity.offices(id)
        NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (directive_id, office_id)
);

CREATE TABLE directive.directive_role_targets (
    id VARCHAR(50) PRIMARY KEY,

    directive_id VARCHAR(50)
        REFERENCES directive.directives(id)
        ON DELETE CASCADE
        NOT NULL,

    role_id VARCHAR(50)
        REFERENCES identity.roles(id)
        NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (directive_id, role_id)
);


-- NOTIFICATIONS SCHEMA
CREATE TABLE notifications.notifications (
    id VARCHAR(50) PRIMARY KEY,

    recipient_id varchar(50) NOT NULL,
    recipient_type notifications.recipient_type NOT NULL,

    event_type varchar(100) NOT NULL,
    subject_type varchar(50) NOT NULL,
    subject_id varchar(50) NOT NULL,
    
    in_app_subject_name varchar(255) DEFAULT NULL,
    email_subject_header varchar(255) DEFAULT NULL,

    message_template TEXT NOT NULL,

    payload JSONB,

    channel notifications.preference NOT NULL,

    priority notifications.priority NOT NULL,

    state notifications.state NOT NULL,

    retry_count INT DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ
);


-- AUDIT SCHEMA
CREATE TABLE audit.events (
	id VARCHAR(80) PRIMARY KEY,
	actor_id VARCHAR(80) NOT NULL,
	actor_type audit.actor_type NOT NULL,
	capability VARCHAR(150),
	action VARCHAR(100) NOT NULL,
	event_type VARCHAR(150) NOT NULL,
	aggregate_type VARCHAR(100) NOT NULL,
	aggregate_id VARCHAR(100) NOT NULL,
	office_id VARCHAR(50) REFERENCES identity.offices(id),
	unit_id VARCHAR(50) REFERENCES identity.organizational_units(id),
	outcome audit.outcome NOT NULL,
	reason TEXT,
	request_id VARCHAR(100),
	correlation_id VARCHAR(100),
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (jsonb_typeof(metadata) = 'object'),
	previous_hash CHAR(64),
	event_hash CHAR(64),
	hash_algorithm VARCHAR(30),
	occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit.events IS
	'Immutable security and business evidence. Business mutations append within the same transaction.';

CREATE OR REPLACE FUNCTION audit.prevent_append_only_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
	RAISE EXCEPTION '% is append-only; % is not permitted', TG_TABLE_NAME, TG_OP
		USING ERRCODE = '55000';
END
$$;


-- REGISTRY SCHEMA (migration 0003 final state)
CREATE TABLE registry.intakes (
	id VARCHAR(80) PRIMARY KEY,
	office_id VARCHAR(50) NOT NULL REFERENCES identity.offices(id),
	unit_id VARCHAR(50) NOT NULL REFERENCES identity.organizational_units(id),
	channel registry.intake_channel NOT NULL,
	sender JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (jsonb_typeof(sender) = 'object'),
	subject TEXT NOT NULL,
	document_date DATE,
	received_at TIMESTAMPTZ NOT NULL,
	received_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	priority registry.priority NOT NULL DEFAULT 'normal',
	status registry.intake_status NOT NULL DEFAULT 'received',
	document_id VARCHAR(50) REFERENCES document.documents(id),
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (jsonb_typeof(metadata) = 'object'),
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ
);

CREATE TABLE registry.reference_series (
	id VARCHAR(80) PRIMARY KEY,
	code VARCHAR(50) NOT NULL,
	name VARCHAR(150) NOT NULL,
	office_id VARCHAR(50) REFERENCES identity.offices(id),
	unit_id VARCHAR(50) REFERENCES identity.organizational_units(id),
	format_pattern VARCHAR(250) NOT NULL,
	reset_period registry.reference_reset_period NOT NULL DEFAULT 'annual',
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ,
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
	CHECK (office_id IS NOT NULL OR unit_id IS NOT NULL)
);

CREATE TABLE registry.reference_sequences (
	series_id VARCHAR(80) NOT NULL REFERENCES registry.reference_series(id),
	period_key VARCHAR(20) NOT NULL,
	current_value BIGINT NOT NULL DEFAULT 0 CHECK (current_value >= 0),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	PRIMARY KEY (series_id, period_key)
);

CREATE TABLE registry.reference_allocations (
	id VARCHAR(80) PRIMARY KEY,
	series_id VARCHAR(80) NOT NULL REFERENCES registry.reference_series(id),
	period_key VARCHAR(20) NOT NULL,
	sequence_value BIGINT NOT NULL CHECK (sequence_value > 0),
	reference_number VARCHAR(150) NOT NULL UNIQUE,
	intake_id VARCHAR(80) NOT NULL UNIQUE REFERENCES registry.intakes(id),
	allocated_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (series_id, period_key, sequence_value),
	FOREIGN KEY (series_id, period_key) REFERENCES registry.reference_sequences(series_id, period_key)
);

CREATE TABLE registry.digitization_jobs (
	id VARCHAR(80) PRIMARY KEY,
	intake_id VARCHAR(80) NOT NULL REFERENCES registry.intakes(id),
	status registry.digitization_status NOT NULL DEFAULT 'pending',
	assigned_to VARCHAR(50) REFERENCES identity.staff(id),
	expected_page_count INTEGER CHECK (expected_page_count IS NULL OR expected_page_count > 0),
	started_at TIMESTAMPTZ,
	completed_at TIMESTAMPTZ,
	failure_reason TEXT,
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ,
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE TABLE registry.scan_pages (
	id VARCHAR(80) PRIMARY KEY,
	digitization_job_id VARCHAR(80) NOT NULL REFERENCES registry.digitization_jobs(id) ON DELETE RESTRICT,
	page_number INTEGER NOT NULL CHECK (page_number > 0),
	media_asset_id VARCHAR(50) NOT NULL REFERENCES media.media_assets(id),
	checksum VARCHAR(128) NOT NULL,
	captured_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (jsonb_typeof(metadata) = 'object'),
	UNIQUE (digitization_job_id, page_number)
);

CREATE TABLE registry.ocr_runs (
	id VARCHAR(80) PRIMARY KEY,
	digitization_job_id VARCHAR(80) NOT NULL REFERENCES registry.digitization_jobs(id) ON DELETE RESTRICT,
	scan_page_id VARCHAR(80) REFERENCES registry.scan_pages(id) ON DELETE RESTRICT,
	provider VARCHAR(80) NOT NULL,
	status registry.ocr_status NOT NULL DEFAULT 'queued',
	extracted_text TEXT,
	confidence NUMERIC(5, 4) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
	provider_output JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (jsonb_typeof(provider_output) = 'object'),
	started_at TIMESTAMPTZ,
	completed_at TIMESTAMPTZ,
	failure_reason TEXT,
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE registry.scan_verifications (
	id VARCHAR(80) PRIMARY KEY,
	digitization_job_id VARCHAR(80) NOT NULL REFERENCES registry.digitization_jobs(id) ON DELETE RESTRICT,
	outcome registry.verification_outcome NOT NULL,
	verified_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	reason TEXT,
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (jsonb_typeof(metadata) = 'object'),
	verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE registry.entries (
	id VARCHAR(80) PRIMARY KEY,
	intake_id VARCHAR(80) NOT NULL UNIQUE REFERENCES registry.intakes(id),
	reference_allocation_id VARCHAR(80) NOT NULL UNIQUE REFERENCES registry.reference_allocations(id),
	office_id VARCHAR(50) NOT NULL REFERENCES identity.offices(id),
	unit_id VARCHAR(50) NOT NULL REFERENCES identity.organizational_units(id),
	document_id VARCHAR(50) REFERENCES document.documents(id),
	document_version_id VARCHAR(50) REFERENCES document.document_versions(id),
	subject TEXT NOT NULL,
	status registry.entry_status NOT NULL DEFAULT 'registered',
	current_custodian_type registry.custodian_type,
	current_custodian_id VARCHAR(100),
	registered_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
	CHECK ((document_id IS NULL AND document_version_id IS NULL) OR (document_id IS NOT NULL AND document_version_id IS NOT NULL)),
	CHECK ((current_custodian_type IS NULL AND current_custodian_id IS NULL) OR (current_custodian_type IS NOT NULL AND current_custodian_id IS NOT NULL))
);

CREATE TABLE registry.custody_movements (
	id VARCHAR(80) PRIMARY KEY,
	registry_entry_id VARCHAR(80) NOT NULL REFERENCES registry.entries(id),
	event_type registry.custody_event_type NOT NULL,
	from_custodian_type registry.custodian_type,
	from_custodian_id VARCHAR(100),
	to_custodian_type registry.custodian_type NOT NULL,
	to_custodian_id VARCHAR(100) NOT NULL,
	related_movement_id VARCHAR(80) REFERENCES registry.custody_movements(id),
	performed_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	evidence_media_id VARCHAR(50) REFERENCES media.media_assets(id),
	notes TEXT,
	CHECK ((from_custodian_type IS NULL AND from_custodian_id IS NULL) OR (from_custodian_type IS NOT NULL AND from_custodian_id IS NOT NULL))
);

CREATE TABLE registry.correspondence_log_entries (
	id VARCHAR(80) PRIMARY KEY,
	registry_entry_id VARCHAR(80) REFERENCES registry.entries(id),
	direction registry.correspondence_direction NOT NULL,
	channel registry.correspondence_channel NOT NULL,
	reference_number VARCHAR(150),
	counterparty JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (jsonb_typeof(counterparty) = 'object'),
	subject TEXT NOT NULL,
	dispatch_id VARCHAR(80),
	logged_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (jsonb_typeof(metadata) = 'object'),
	CONSTRAINT fk_registry_correspondence_dispatch FOREIGN KEY (dispatch_id)
		REFERENCES dispatch.dispatch_records(id)
);


-- DISPATCH EXTENSIONS (migration 0004 final state)
CREATE TABLE dispatch.dispatch_acknowledgements (
	id VARCHAR(80) PRIMARY KEY,
	dispatch_id VARCHAR(80) NOT NULL REFERENCES dispatch.dispatch_records(id),
	acknowledged_by_staff_id VARCHAR(50) REFERENCES identity.staff(id),
	external_acknowledger_name VARCHAR(200),
	evidence_media_id VARCHAR(50) REFERENCES media.media_assets(id),
	notes TEXT,
	acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	created_by VARCHAR(50) REFERENCES identity.staff(id),
	CHECK (
		(acknowledged_by_staff_id IS NOT NULL AND external_acknowledger_name IS NULL)
		OR (acknowledged_by_staff_id IS NULL AND external_acknowledger_name IS NOT NULL)
	)
);


-- RECORDS SCHEMA (migration 0005 final state)
CREATE TABLE records.retention_schedules (
	id VARCHAR(80) PRIMARY KEY,
	code VARCHAR(50) NOT NULL UNIQUE,
	name VARCHAR(150) NOT NULL,
	description TEXT,
	office_id VARCHAR(50) REFERENCES identity.offices(id),
	unit_id VARCHAR(50) REFERENCES identity.organizational_units(id),
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ,
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE TABLE records.retention_schedule_versions (
	id VARCHAR(80) PRIMARY KEY,
	schedule_id VARCHAR(80) NOT NULL REFERENCES records.retention_schedules(id),
	version INTEGER NOT NULL CHECK (version > 0),
	document_type_id VARCHAR(50) REFERENCES document.document_type(id),
	duration_months INTEGER NOT NULL CHECK (duration_months >= 0),
	trigger_event records.retention_trigger_event NOT NULL,
	disposition_action records.disposition_action NOT NULL,
	effective_from DATE NOT NULL,
	effective_to DATE,
	approved_by VARCHAR(50) REFERENCES identity.staff(id),
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (schedule_id, version),
	CHECK (effective_to IS NULL OR effective_to > effective_from),
	CONSTRAINT retention_schedule_versions_no_overlap EXCLUDE USING gist (
		schedule_id WITH =,
		daterange(effective_from, COALESCE(effective_to, 'infinity'::DATE), '[)') WITH &&
	)
);

CREATE TABLE records.records (
	id VARCHAR(80) PRIMARY KEY,
	office_id VARCHAR(50) NOT NULL REFERENCES identity.offices(id),
	unit_id VARCHAR(50) NOT NULL REFERENCES identity.organizational_units(id),
	registry_entry_id VARCHAR(80) REFERENCES registry.entries(id),
	title VARCHAR(250) NOT NULL,
	status records.record_status NOT NULL DEFAULT 'active',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ,
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE TABLE records.record_declarations (
	id VARCHAR(80) PRIMARY KEY,
	record_id VARCHAR(80) NOT NULL UNIQUE REFERENCES records.records(id),
	document_id VARCHAR(50) NOT NULL REFERENCES document.documents(id),
	document_version_id VARCHAR(50) NOT NULL UNIQUE REFERENCES document.document_versions(id),
	content_checksum CHAR(64) NOT NULL CHECK (content_checksum ~ '^[0-9a-fA-F]{64}$'),
	declared_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	declared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE records.storage_locations (
	id VARCHAR(80) PRIMARY KEY,
	parent_id VARCHAR(80) REFERENCES records.storage_locations(id),
	office_id VARCHAR(50) NOT NULL REFERENCES identity.offices(id),
	unit_id VARCHAR(50) NOT NULL REFERENCES identity.organizational_units(id),
	location_type records.location_type NOT NULL,
	code VARCHAR(80) NOT NULL,
	name VARCHAR(150) NOT NULL,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ,
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
	UNIQUE (office_id, code),
	CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE TABLE records.record_placements (
	id VARCHAR(80) PRIMARY KEY,
	record_id VARCHAR(80) NOT NULL REFERENCES records.records(id),
	location_id VARCHAR(80) NOT NULL REFERENCES records.storage_locations(id),
	event_type records.placement_event_type NOT NULL,
	related_placement_id VARCHAR(80) REFERENCES records.record_placements(id),
	performed_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	notes TEXT
);

CREATE TABLE records.record_retention (
	id VARCHAR(80) PRIMARY KEY,
	record_id VARCHAR(80) NOT NULL REFERENCES records.records(id),
	schedule_version_id VARCHAR(80) NOT NULL REFERENCES records.retention_schedule_versions(id),
	trigger_date DATE NOT NULL,
	disposal_eligibility_date DATE NOT NULL,
	supersedes_id VARCHAR(80) REFERENCES records.record_retention(id),
	applied_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CHECK (disposal_eligibility_date >= trigger_date)
);

CREATE TABLE records.legal_holds (
	id VARCHAR(80) PRIMARY KEY,
	office_id VARCHAR(50) NOT NULL REFERENCES identity.offices(id),
	unit_id VARCHAR(50) NOT NULL REFERENCES identity.organizational_units(id),
	title VARCHAR(200) NOT NULL,
	reason TEXT NOT NULL,
	status records.legal_hold_status NOT NULL DEFAULT 'active',
	placed_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	released_by VARCHAR(50) REFERENCES identity.staff(id),
	released_at TIMESTAMPTZ,
	release_reason TEXT,
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
	CHECK (
		(status = 'active' AND released_by IS NULL AND released_at IS NULL)
		OR (status = 'released' AND released_by IS NOT NULL AND released_at IS NOT NULL)
	)
);

CREATE TABLE records.legal_hold_records (
	id VARCHAR(80) PRIMARY KEY,
	legal_hold_id VARCHAR(80) NOT NULL REFERENCES records.legal_holds(id),
	record_id VARCHAR(80) NOT NULL REFERENCES records.records(id),
	added_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (legal_hold_id, record_id)
);

CREATE TABLE records.legal_hold_events (
	id VARCHAR(80) PRIMARY KEY,
	legal_hold_id VARCHAR(80) NOT NULL REFERENCES records.legal_holds(id),
	event_type records.legal_hold_event_type NOT NULL,
	actor_id VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	reason TEXT,
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (jsonb_typeof(metadata) = 'object'),
	occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE records.transfers (
	id VARCHAR(80) PRIMARY KEY,
	office_id VARCHAR(50) NOT NULL REFERENCES identity.offices(id),
	unit_id VARCHAR(50) NOT NULL REFERENCES identity.organizational_units(id),
	from_location_id VARCHAR(80) REFERENCES records.storage_locations(id),
	to_location_id VARCHAR(80) REFERENCES records.storage_locations(id),
	destination JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (jsonb_typeof(destination) = 'object'),
	status records.transfer_status NOT NULL DEFAULT 'pending',
	requested_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	approved_by VARCHAR(50) REFERENCES identity.staff(id),
	approved_at TIMESTAMPTZ,
	completed_by VARCHAR(50) REFERENCES identity.staff(id),
	completed_at TIMESTAMPTZ,
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE TABLE records.transfer_items (
	id VARCHAR(80) PRIMARY KEY,
	transfer_id VARCHAR(80) NOT NULL REFERENCES records.transfers(id),
	record_id VARCHAR(80) NOT NULL REFERENCES records.records(id),
	added_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (transfer_id, record_id)
);

CREATE TABLE records.archive_accessions (
	id VARCHAR(80) PRIMARY KEY,
	transfer_id VARCHAR(80) UNIQUE REFERENCES records.transfers(id),
	accession_number VARCHAR(100) NOT NULL UNIQUE,
	location_id VARCHAR(80) REFERENCES records.storage_locations(id),
	accessioned_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	accessioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE records.disposal_requests (
	id VARCHAR(80) PRIMARY KEY,
	office_id VARCHAR(50) NOT NULL REFERENCES identity.offices(id),
	unit_id VARCHAR(50) NOT NULL REFERENCES identity.organizational_units(id),
	status records.disposal_request_status NOT NULL DEFAULT 'pending',
	reason TEXT NOT NULL,
	required_approvals INTEGER NOT NULL DEFAULT 1 CHECK (required_approvals > 0),
	requested_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	approved_at TIMESTAMPTZ,
	executed_at TIMESTAMPTZ,
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE TABLE records.disposal_request_items (
	id VARCHAR(80) PRIMARY KEY,
	disposal_request_id VARCHAR(80) NOT NULL REFERENCES records.disposal_requests(id),
	record_id VARCHAR(80) NOT NULL REFERENCES records.records(id),
	retention_assignment_id VARCHAR(80) NOT NULL REFERENCES records.record_retention(id),
	added_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (disposal_request_id, record_id)
);

CREATE TABLE records.disposal_approvals (
	id VARCHAR(80) PRIMARY KEY,
	disposal_request_id VARCHAR(80) NOT NULL REFERENCES records.disposal_requests(id),
	decision records.disposal_decision NOT NULL,
	approver_id VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	reason TEXT,
	decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (disposal_request_id, approver_id)
);

CREATE TABLE records.disposal_certificates (
	id VARCHAR(80) PRIMARY KEY,
	disposal_request_id VARCHAR(80) NOT NULL UNIQUE REFERENCES records.disposal_requests(id),
	certificate_number VARCHAR(100) NOT NULL UNIQUE,
	executed_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	evidence_media_id VARCHAR(50) REFERENCES media.media_assets(id),
	certificate_checksum CHAR(64) CHECK (certificate_checksum IS NULL OR certificate_checksum ~ '^[0-9a-fA-F]{64}$'),
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (jsonb_typeof(metadata) = 'object')
);


-- MIGRATION-DERIVED FUNCTIONS
CREATE FUNCTION policy.gen_next_policy_version(_document_type_id VARCHAR)
RETURNS INT
LANGUAGE sql
AS $$
	INSERT INTO policy.document_retention_version_counters AS counter (
		document_type_id,
		last_version
	)
	VALUES (
		_document_type_id,
		(
			SELECT COALESCE(MAX(policy_version), 0) + 1
			FROM policy.document_retention
			WHERE document_type_id = _document_type_id
		)
	)
	ON CONFLICT (document_type_id)
	DO UPDATE SET last_version = GREATEST(
		counter.last_version,
		(
			SELECT COALESCE(MAX(policy_version), 0)
			FROM policy.document_retention
			WHERE document_type_id = _document_type_id
		)
	) + 1
	RETURNING last_version;
$$;

CREATE OR REPLACE FUNCTION records.prevent_declared_version_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM records.record_declarations
		WHERE document_version_id = OLD.id
	) THEN
		RAISE EXCEPTION 'Declared document version % is immutable', OLD.id
			USING ERRCODE = '55000';
	END IF;

	IF TG_OP = 'DELETE' THEN
		RETURN OLD;
	END IF;
	RETURN NEW;
END
$$;


-- MIGRATION-DERIVED INDEXES
CREATE INDEX idx_role_assignments_effective_staff
	ON identity.role_assignments (staff_id, valid_from, valid_to)
	WHERE revoked_at IS NULL;
CREATE INDEX idx_role_assignments_unit_scope
	ON identity.role_assignments (scope_unit_id, role_id)
	WHERE scope_type = 'unit' AND revoked_at IS NULL;
CREATE INDEX idx_role_assignments_office_scope
	ON identity.role_assignments (scope_office_id, role_id)
	WHERE scope_type = 'office' AND revoked_at IS NULL;

CREATE INDEX idx_audit_events_aggregate
	ON audit.events (aggregate_type, aggregate_id, occurred_at DESC);
CREATE INDEX idx_audit_events_actor
	ON audit.events (actor_id, occurred_at DESC);
CREATE INDEX idx_audit_events_office
	ON audit.events (office_id, occurred_at DESC) WHERE office_id IS NOT NULL;
CREATE INDEX idx_audit_events_unit
	ON audit.events (unit_id, occurred_at DESC) WHERE unit_id IS NOT NULL;
CREATE INDEX idx_audit_events_correlation
	ON audit.events (correlation_id, occurred_at) WHERE correlation_id IS NOT NULL;
CREATE INDEX idx_audit_events_type
	ON audit.events (event_type, occurred_at DESC);
CREATE UNIQUE INDEX audit_event_hash_unique
	ON audit.events(event_hash) WHERE event_hash IS NOT NULL;

CREATE UNIQUE INDEX uq_registry_reference_series_scope_code
	ON registry.reference_series (COALESCE(office_id, ''), COALESCE(unit_id, ''), code);
CREATE INDEX idx_registry_digitization_jobs_queue
	ON registry.digitization_jobs (status, created_at);
CREATE UNIQUE INDEX uq_registry_scan_verification_accepted
	ON registry.scan_verifications (digitization_job_id) WHERE outcome = 'accepted';
CREATE INDEX idx_registry_entries_scope_status
	ON registry.entries (office_id, unit_id, status, registered_at DESC);
CREATE INDEX idx_registry_custody_movement_timeline
	ON registry.custody_movements (registry_entry_id, performed_at, id);
CREATE INDEX idx_registry_correspondence_timeline
	ON registry.correspondence_log_entries (logged_at DESC, id DESC);

CREATE UNIQUE INDEX uq_dispatch_tracking_number
	ON dispatch.dispatch_records (delivery_channel, tracking_number)
	WHERE tracking_number IS NOT NULL;
CREATE INDEX idx_dispatch_registry_entry
	ON dispatch.dispatch_records (registry_entry_id, dispatched_at DESC)
	WHERE registry_entry_id IS NOT NULL;
CREATE INDEX idx_dispatch_delivery_queue
	ON dispatch.dispatch_records (status, delivery_channel, dispatched_at);
CREATE INDEX idx_dispatch_acknowledgements_dispatch
	ON dispatch.dispatch_acknowledgements (dispatch_id, acknowledged_at);

CREATE INDEX idx_records_scope_status
	ON records.records (office_id, unit_id, status, created_at DESC);
CREATE INDEX idx_record_placements_timeline
	ON records.record_placements (record_id, performed_at, id);
CREATE INDEX idx_record_retention_eligibility
	ON records.record_retention (disposal_eligibility_date, record_id);
CREATE INDEX idx_legal_hold_records_record
	ON records.legal_hold_records (record_id, legal_hold_id);
CREATE INDEX idx_records_disposal_queue
	ON records.disposal_requests (office_id, unit_id, status, requested_at);
CREATE INDEX idx_records_transfer_queue
	ON records.transfers (office_id, unit_id, status, requested_at);

CREATE UNIQUE INDEX document_retention_type_effective
	ON policy.document_retention(document_type_id, effective_from);
CREATE UNIQUE INDEX document_governance_one_active_policy
	ON policy.document_governance_policies(policy_key) WHERE status = 'active';
CREATE UNIQUE INDEX document_governance_scoped_rule_identity
	ON policy.document_governance_rules(governance_policy_id, sensitivity, action, priority)
	WHERE sensitivity IS NOT NULL;
CREATE UNIQUE INDEX document_governance_global_rule_identity
	ON policy.document_governance_rules(governance_policy_id, action, priority)
	WHERE sensitivity IS NULL;
CREATE INDEX document_governance_rule_lookup
	ON policy.document_governance_rules(governance_policy_id, sensitivity, action, priority);
CREATE UNIQUE INDEX document_one_effective_unit_head_signature
	ON document.document_unit_head_signatures(document_id) WHERE revoked_at IS NULL;
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
CREATE INDEX document_governance_grant_lookup
	ON policy.document_governance_grants(document_id, grantee_staff_id, grant_type, valid_from, valid_to)
	WHERE revoked_at IS NULL;
CREATE UNIQUE INDEX one_pending_sensitivity_change_per_document
	ON policy.document_sensitivity_change_requests(document_id) WHERE status = 'pending';
CREATE INDEX document_search_cursor
	ON document.documents(created_at DESC, id DESC);
CREATE INDEX governance_grants_document_status
	ON policy.document_governance_grants(document_id, created_at DESC, id DESC);
CREATE INDEX sensitivity_change_approval_queue
	ON policy.document_sensitivity_change_requests(status, requested_at, id)
	WHERE status = 'pending';
CREATE INDEX document_extractions_document_history
	ON policy.document_extractions(document_id, created_at DESC);


-- APPEND-ONLY AND IMMUTABILITY TRIGGERS
CREATE TRIGGER prevent_audit_event_mutation
	BEFORE UPDATE OR DELETE ON audit.events
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();
CREATE TRIGGER prevent_reference_allocation_mutation
	BEFORE UPDATE OR DELETE ON registry.reference_allocations
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();
CREATE TRIGGER prevent_scan_page_mutation
	BEFORE UPDATE OR DELETE ON registry.scan_pages
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();
CREATE TRIGGER prevent_scan_verification_mutation
	BEFORE UPDATE OR DELETE ON registry.scan_verifications
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();
CREATE TRIGGER prevent_custody_movement_mutation
	BEFORE UPDATE OR DELETE ON registry.custody_movements
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();
CREATE TRIGGER prevent_correspondence_log_mutation
	BEFORE UPDATE OR DELETE ON registry.correspondence_log_entries
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();
CREATE TRIGGER prevent_dispatch_acknowledgement_mutation
	BEFORE UPDATE OR DELETE ON dispatch.dispatch_acknowledgements
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();
CREATE TRIGGER prevent_declared_version_mutation
	BEFORE UPDATE OR DELETE ON document.document_versions
	FOR EACH ROW EXECUTE FUNCTION records.prevent_declared_version_mutation();
CREATE TRIGGER prevent_mutation
	BEFORE UPDATE OR DELETE ON records.record_declarations
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();
CREATE TRIGGER prevent_mutation
	BEFORE UPDATE OR DELETE ON records.record_placements
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();
CREATE TRIGGER prevent_mutation
	BEFORE UPDATE OR DELETE ON records.record_retention
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();
CREATE TRIGGER prevent_mutation
	BEFORE UPDATE OR DELETE ON records.legal_hold_records
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();
CREATE TRIGGER prevent_mutation
	BEFORE UPDATE OR DELETE ON records.legal_hold_events
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();
CREATE TRIGGER prevent_mutation
	BEFORE UPDATE OR DELETE ON records.transfer_items
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();
CREATE TRIGGER prevent_mutation
	BEFORE UPDATE OR DELETE ON records.archive_accessions
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();
CREATE TRIGGER prevent_mutation
	BEFORE UPDATE OR DELETE ON records.disposal_request_items
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();
CREATE TRIGGER prevent_mutation
	BEFORE UPDATE OR DELETE ON records.disposal_approvals
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();
CREATE TRIGGER prevent_mutation
	BEFORE UPDATE OR DELETE ON records.disposal_certificates
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();
CREATE TRIGGER prevent_document_extraction_mutation
	BEFORE UPDATE OR DELETE ON policy.document_extractions
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();

REVOKE UPDATE, DELETE, TRUNCATE ON audit.events FROM PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON
	registry.reference_allocations,
	registry.scan_pages,
	registry.scan_verifications,
	registry.custody_movements,
	registry.correspondence_log_entries,
	dispatch.dispatch_acknowledgements,
	records.record_declarations,
	records.record_placements,
	records.record_retention,
	records.legal_hold_records,
	records.legal_hold_events,
	records.transfer_items,
	records.archive_accessions,
	records.disposal_request_items,
	records.disposal_approvals,
	records.disposal_certificates,
	policy.document_extractions
FROM PUBLIC;
