import GetEffectivePermissions from "../../../../access/application/usecases/GetEffectivePermissions.usecase.js";

class AuthorityController {
    constructor(
    private readonly getEffectivePermissionsUseCase: GetEffectivePermissions
  ) {}

	// implicit authority is authority got from the official role of the staff
	async authorizeImplicitly(userId: string) {
        const result = await this.getEffectivePermissionsUseCase.getEffectivePermissions(userId)

        return result;
    }
}

export default AuthorityController;
