CREATE SCHEMA IF NOT EXISTS identity;
drop table if exists identity.users cascade;
drop table if exists identity.staff;
drop type if exists identity.user_status;

CREATE TYPE identity.user_status AS ENUM (
    'pending','active','suspended', 'retired', 'resigned', 'terminated'
);

-- identity table
create table identity.users (
id varchar(50) primary key not null,
auth_provider VARCHAR(50) NOT NULL,
auth_provider_id VARCHAR(255) unique NOT NULL,
email varchar(50) unique not null,
firstName varchar(25) not null,
lastName varchar(25) not null,
middleName varchar(25) not null,
status identity.user_status NOT NULL,
created_at TIMESTAMPTZ NOT NULL,
updated_at TIMESTAMPTZ
);

-- staff table
CREATE TABLE identity.staff(
id serial PRIMARY KEY,
identity_id varchar(50) UNIQUE REFERENCES identity.users(id),
staff_number VARCHAR(100) UNIQUE NOT NULL,
first_name VARCHAR(100) NOT NULL,
last_name VARCHAR(100) NOT NULL,
middle_name VARCHAR(100),
email VARCHAR(255) NOT NULL,
employment_type VARCHAR(50) NOT NULL check(employment_type in ('permanent', 'probationary', 'contract', 'intern', 'ad_hoc', 'sabbatical')),
unit_id UUID NOT NULL,
office_id UUID,
status identity.user_status not null,
created_at TIMESTAMP NOT NULL
);
