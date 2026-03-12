CREATE OR REPLACE VIEW identity.staff_details AS
SELECT 
    staff.id, 
	users.auth_provider_id,
    staff.identity_id, 
	users.firstName,
	users.middleName,
	users.lastName,
	users.email,
    staff.staff_number, 
    staff.employment_type, 
    unit.sector AS unit_sector, 
    unit.full_name AS unit_name, 
    office.name AS office, 
    designation.title AS designation,
    staff.status, 
    staff.created_at, 
    staff.updated_at 
FROM identity.staff staff
LEFT JOIN identity.users users ON staff.identity_id = users.id
LEFT JOIN identity.organizational_units unit ON staff.unit_id = unit.id
LEFT JOIN identity.offices office ON staff.office_id = office.id
LEFT JOIN identity.designations designation ON staff.designation_id = designation.id;