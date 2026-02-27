select office.id, office.name as office_name, unit.full_name as office_unit, office.created_at 
from identity.offices office 
join identity.organizational_units unit 
on office.unit_id = unit.id;
