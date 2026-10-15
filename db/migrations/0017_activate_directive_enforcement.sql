INSERT INTO identity.permissions (id, code, description)
VALUES (
	'perm.directive.enforce',
	'directive.enforce',
	'Monitor directive compliance, accept completion evidence, and complete directives'
)
ON CONFLICT (id) DO UPDATE SET
	code = EXCLUDED.code,
	description = EXCLUDED.description;

INSERT INTO identity.role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM identity.roles role
JOIN identity.permissions permission ON permission.code = 'directive.enforce'
WHERE role.name = 'directive_authority'
ON CONFLICT (role_id, permission_id) DO NOTHING;
