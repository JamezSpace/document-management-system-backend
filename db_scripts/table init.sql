CREATE SCHEMA IF NOT EXISTS identity;
drop table if exists identity.users cascade;
drop table if exists identity.staff;
drop type if exists identity.user_status;

CREATE TYPE identity.user_status AS ENUM (
    'pending','active','suspended', 'retired', 'resigned', 'terminated'
);
CREATE TYPE identity.employment_type AS ENUM (
    'permanent', 'probationary', 'contract', 'intern', 'ad_hoc', 'sabbatical'
);
CREATE TYPE identity.org_unit_sector AS ENUM(
	'academic', 'non-academic'
)

-- identity table
create table identity.users (
	id varchar(50) primary key not null,
	auth_provider VARCHAR(50) NOT NULL,
	auth_provider_id VARCHAR(255) unique NOT NULL,
	email varchar(255) unique not null,
	firstName varchar(25) not null,
	lastName varchar(25) not null,
	middleName varchar(25),
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

-- designations table
CREATE TABLE identity.designations(
	id VARCHAR(50) PRIMARY KEY,
	title VARCHAR(150) UNIQUE NOT NULL,
	description TEXT,
	hierarchy_level INTEGER NOT NULL,
	office_id VARCHAR(50) REFERENCES identity.offices(id),
	created_at TIMESTAMPTZ NOT NULL,
	updated_at TIMESTAMPTZ NOT NULL
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
	created_at TIMESTAMP NOT NULL
);

-- staff classification
CREATE TABLE identity.staff_classifications(
id varchar(50) PRIMARY KEY,
staff_id varchar(50) REFERENCES staff(identity_id),
capability_class VARCHAR(100) NOT NULL,
authority_level INTEGER NOT NULL,
effective_from DATE NOT NULL,
effective_to DATE,
created_at TIMESTAMPTZ NOT NULL
)

-- role assignemnts
CREATE TABLE identity.role_assignments(
id varchar(50) PRIMARY KEY,
staff_id UUID REFERENCES staff(id),
role_id UUID REFERENCES roles(id),
scope JSONB, -- e.g { unitId: "...", officeId: "..." }
delegated_by UUID REFERENCES staff(id),
valid_from TIMESTAMPTZ NOT NULL,
valid_to TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL
)

-- roles table
CREATE TABLE identity.roleS(
	id varchar(50) PRIMARY KEY,
	name VARCHAR(100) UNIQUE NOT NULL,
	created_at TIMESTAMPTZ NOT NULL
)

-- permissions table
CREATE TABLE identity.permissions(
	id varchar(50) PRIMARY KEY,
	code VARCHAR(100) UNIQUE NOT NULL,
	description TEXT
)

-- roles-permissions table
CREATE TABLE identity.role_permissions(
    role_id varchar(50) REFERENCES roles(id),
    permission_id varchar(50) REFERENCES permissions(id),
    PRIMARY KEY (role_id, permission_id)
)
