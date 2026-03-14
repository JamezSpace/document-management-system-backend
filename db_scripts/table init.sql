CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS media;
CREATE SCHEMA IF NOT EXISTS document;
CREATE SCHEMA IF NOT EXISTS policy;
CREATE SCHEMA IF NOT EXISTS notifications;

drop table if exists identity.users cascade;
drop table if exists identity.staff;
drop table if exists document.correspondence_subjects;
drop table if exists document.business_functions;

-- IDENTITY SCHEMA TYPES
CREATE TYPE identity.user_status AS ENUM (
    'pending','active','suspended', 'retired', 'resigned', 'terminated'
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

-- DOCUMENT SCHEMA TYPES
CREATE TYPE document.document_type AS ENUM(
	'memo', 'letter'
);
CREATE TYPE document.sensitivity_level AS ENUM(
	'public', 'internal', 'confidential', 'restricted'
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

-- identity table
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
)

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
	title VARCHAR(150) UNIQUE NOT NULL,
	description TEXT,
	hierarchy_level INTEGER NOT NULL,
	office_id VARCHAR(50) REFERENCES identity.offices(id),
	created_at TIMESTAMPTZ NOT NULL,
	updated_at TIMESTAMPTZ 
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
	updated_at TIMESTAMPTZ
);

-- staff media
CREATE TABLE identity.staff_media_assets (
    staff_id VARCHAR(50) NOT NULL,
    media_id VARCHAR(50) NOT NULL,

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (staff_id, media_id),

    CONSTRAINT fk_staff
        FOREIGN KEY (staff_id)
        REFERENCES identity.staff(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_staff_media
        FOREIGN KEY (media_id)
        REFERENCES media.media_assets(id)
        ON DELETE CASCADE
);

-- capability class
CREATE TABLE identity.capability_classes(
    id varchar(50) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category identity.capability_class_category NOT NULL,     
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL
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
)

-- role assignments
CREATE TABLE identity.role_assignments(
	id varchar(50) PRIMARY KEY,
	staff_id varchar(50) REFERENCES identity.staff(id),
	role_id varchar(50) REFERENCES identity.roles(id),
	scope JSONB, -- e.g { unitId: "...", officeId: "..." }
	delegated_by varchar(50) REFERENCES identity.staff(id),
	valid_from TIMESTAMPTZ NOT NULL,
	valid_to TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL
)


-- MEDIA SCHEMA
-- media-assets
CREATE TABLE media.media_assets (
    id VARCHAR(50) PRIMARY KEY,

    asset_role VARCHAR(50) NOT NULL, 
    -- e.g. PROFILE_PICTURE, SIGNATURE, PRIMARY_CONTENT, ATTACHMENT

    storage_provider VARCHAR(50) NOT NULL, 
    -- e.g. LOCAL, S3, AZURE

    bucket_name VARCHAR(100),
    object_key VARCHAR(255) NOT NULL,

    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    checksum VARCHAR(255) NOT NULL, -- SHA-256 recommended

    uploaded_at TIMESTAMPTZ NOT NULL,
    uploaded_by VARCHAR(50) NOT NULL,

    is_active BOOLEAN DEFAULT TRUE
);


-- DOCUMENTS SCHEMA

-- documents volumes
CREATE TABLE document.correspondence_subjects (
    id VARCHAR(50) PRIMARY KEY,
    code varchar(10) UNIQUE NOT NULL,
    name varchar(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    uploaded_at TIMESTAMPTZ
);

CREATE TABLE document.business_functions (
    id VARCHAR(50) PRIMARY KEY,
    subject_id VARCHAR(50) REFERENCES document.correspondence_subjects(id) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    uploaded_at TIMESTAMPTZ
);

-- ref number
CREATE TABLE document.reference_sequences (
    year INT NOT NULL,
    origin_unit_id varchar(50) REFERENCES identity.organizational_units NOT NULL,
    recipient_code VARCHAR(30) NOT NULL,
    subject_code varchar(50) REFERENCES document.correspondence_subjects NOT NULL,
    current_value INT NOT NULL,
    UNIQUE(year, origin_unit_id, recipient_code, subject_code)
);

CREATE TABLE document.documents (
    id VARCHAR(50) PRIMARY KEY,

    -- core
    title VARCHAR(200) NOT NULL,
    owner_id varchar(50) REFERENCES identity.staff(id) NOT NULL,
    reference_number VARCHAR(50),

    -- correspondence metadata
    originating_unit_id varchar(50) REFERENCES identity.organizational_units(id) NOT NULL,
    recipient_code VARCHAR(30) NOT NULL,
    subject_code_id varchar(50) REFERENCES document.correspondence_subjects(id) NOT NULL,

    -- classification metadata
    sensitivity document.sensitivity_level NOT NULL,
    business_function_id varchar(50) REFERENCES document.business_functions(id) NOT NULL,
    document_type document.document_type NOT NULL,

    classified_by varchar(50) REFERENCES identity.staff(id) NOT NULL,
    classified_at TIMESTAMPTZ NOT NULL,

    last_reclassified_at TIMESTAMPTZ,
    last_reclassified_by varchar(50) REFERENCES identity.staff(id),

    -- retention metadata
    policy_version INT NOT NULL,
    retention_schedule_id VARCHAR(50) NOT NULL,
    retention_start_date TIMESTAMPTZ NOT NULL,
    disposal_eligibility_date TIMESTAMPTZ NOT NULL,
    archival_required BOOLEAN NOT NULL,

    -- audit sake
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- documents classification
CREATE TABLE document.document_classification (
    id VARCHAR(50) PRIMARY KEY,
    sensitivity document.sensitivity_level NOT NULL,
    business_function_id varchar(50) REFERENCES document.business_functions(id),
    document_type 
);

-- documents versions
CREATE TABLE document.document_versions (
    id VARCHAR(50) PRIMARY KEY,
    document_id varchar(50) REFERENCES document.documents(id) NOT NULL,
    version_number INT NOT NULL,
    media_id varchar(50) REFERENCES media.media_assets(id) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    created_by varchar(50) REFERENCES identity.staff(id) NOT NULL,
    lifecycle_state VARCHAR(50) NOT NULL,

    CONSTRAINT fk_document
        FOREIGN KEY (document_id)
        REFERENCES document.documents(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_media
        FOREIGN KEY (media_id)
        REFERENCES media.media_assets(id)
);

-- documents media
CREATE TABLE document.document_media_assets (
    document_id VARCHAR(50) NOT NULL,
    media_id VARCHAR(50) NOT NULL,

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (document_id, media_id),

    CONSTRAINT fk_document
        FOREIGN KEY (document_id)
        REFERENCES document.documents(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_document_media
        FOREIGN KEY (media_id)
        REFERENCES media.media_assets(id)
        ON DELETE CASCADE
);


-- POLICY SCHEMA
CREATE TABLE policy.documents_retention (
    id VARCHAR(50) PRIMARY KEY,
    policy_version INT NOT NULL,
    document_type document.document_type NOT NULL,
    archival_required BOOLEAN NOT NULL,
    retention_duration INT NOT NULL,
    effective_from DATE NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

	UNIQUE(document_type, policy_version)
);

-- NOTIFICATIONS SCHEMA
CREATE TABLE notifications.notifications (
    id VARCHAR(50) PRIMARY KEY,

    recipient_id varchar(50) NOT NULL,
    recipient_type notifications.recipient_type NOT NULL,

    event_type varchar(50) NOT NULL,
    subject_type varchar(50) NOT NULL,
    subject_id varchar(50) NOT NULL,

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