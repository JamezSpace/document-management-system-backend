import type { FastifyInstance } from "fastify";
import InMemoryEventBusAdapter from "../shared/infrastructure/InMemoryEventBus.js";
import AuthenticationController from "./identity/api/controllers/Authentication.controller.js";
import AuthorityController from "./identity/api/controllers/Authority.controller.js";
import identityRoutes from "./identity/api/routes/identity.route.js";
import AddNewUserUseCase from "./identity/application/usecases/AddNewUser.usecase.js";
import AuthenticateUserUseCase from "./identity/application/usecases/AuthenticateUser.usecase.js";
import IdentityEventsAdapter from "./identity/infrastructure/adapters/IdentityEvents.adapter.js";
import InMemoryIdentityRepoAdapter from "./identity/infrastructure/adapters/IdentityRepository.adapter.js";
import PostgresqlRoleRepositoryAdapter from "./access/infrastructure/persistence/PostgresRoleRepository.adapter.js";
import GetEffectivePermissionsUseCase from "./access/application/usecases/GetEffectivePermissions.usecase.js";
import PostgresqlAccesRepositoryAdapter from "./access/infrastructure/persistence/PostgresAccessRepository.adapter.js";
import AccessEventsAdapter from "./access/infrastructure/queue/AccessEvents.adapter.js";

export default async function IdentityAccessSubsystem(fastify: FastifyInstance) {
	// infrastructure Layer
	const globalEventBus = new InMemoryEventBusAdapter();

	const identityRepository = new InMemoryIdentityRepoAdapter();
	const identityEventsAdapter = new IdentityEventsAdapter(globalEventBus);
	const roleRepository = new PostgresqlRoleRepositoryAdapter();
	const accessRepository = new PostgresqlAccesRepositoryAdapter();
	const accessEventsAdapter = new AccessEventsAdapter(globalEventBus);

	// application Layer
	const authenticateUserUseCase = new AuthenticateUserUseCase(
		identityRepository,
		identityEventsAdapter,
	);

	const addNewUserUseCase = new AddNewUserUseCase(
		roleRepository,
		identityEventsAdapter,
		identityRepository,
	);

	const getEffectivePermissionsUseCase = new GetEffectivePermissionsUseCase(
		accessEventsAdapter,
		accessRepository,
	);

	// controller Layer 
	const authenticationController = new AuthenticationController(
		authenticateUserUseCase,
		addNewUserUseCase,
	);
	const authorityController = new AuthorityController(getEffectivePermissionsUseCase);

	await fastify.register(identityRoutes, {
		controller: [authenticationController, authorityController],
	});
}
