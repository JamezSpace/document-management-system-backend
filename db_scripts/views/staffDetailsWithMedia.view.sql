CREATE OR REPLACE VIEW identity.staff_details_with_media AS
SELECT 
	staff.id, staff.first_name, staff.last_name, staff.middle_name, staff.email, staff.identity_id, staff.auth_provider_id as ap_id,
	staff_number, employment_type,unit_sector, unit_name, office, designation, status,
	asset_role,	storage_provider, bucket_name, object_key, staff.created_at, staff.updated_at 
FROM identity.staff_details staff
LEFT JOIN identity.staff_media_assets sm
ON sm.staff_id = staff.id
LEFT JOIN media.media_assets md
ON sm.media_id = md.id
-- WHERE is_active = 'true';
