import type { UserRepositoryPort } from "../../ports/repos/entities/user/UserRepository.port.js";

class GetAllUsersUseCase {
	constructor(private readonly identityRepo: UserRepositoryPort) {}

	async getAllUsers() {
		const users = await this.identityRepo.findAllUsers();

		return users;
	}
}

export default GetAllUsersUseCase;
