import RegistryError from "../../../../shared/errors/RegistryError.js";
import { RegistryErrorEnum } from "../../../../shared/errors/enum/registry.enum.js";
import Permission from "./Permission.js";

class PermissionRegistry {
	private static readonly validPermissions: Record<string, Permission> = {
		"create document": Permission.CREATE_DOCUMENT,
		"approve document": Permission.APPROVE_DOCUMENT,
		"archive document": Permission.ARCHIVE_DOCUMENT,
		"reject document": Permission.REJECT_DOCUMENT,
		"submit document": Permission.SUBMIT_DOCUMENT,
	};

	public static getPermissionFromName(name: string): Permission {
		const permission = this.validPermissions[name];

		if (!permission) {
			throw new RegistryError(RegistryErrorEnum.INVALID_PERMISSION);
		}

		return permission;
	}

    public static exists(permission: Permission) {
        return this.validPermissions[permission.toString()] ? true : false
    }
}

export default PermissionRegistry;
