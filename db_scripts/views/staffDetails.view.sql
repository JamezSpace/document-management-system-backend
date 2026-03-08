CREATE VIEW identity.staff_details as
SELECT staff.id, identity_id, staff_number, employment_type, unit.sector as unit_sector, unit.full_name as unit_name, office.name as office, designation.title as designation, staff.status, staff.created_at, staff.updated_at 
FROM identity.staff staff
JOIN identity.organizational_units unit
ON staff.unit_id = unit.id
JOIN identity.offices office
ON staff.office_id = office.name
JOIN identity.designations designation 
ON staff.designation_id = designation.title;