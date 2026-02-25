import type { FastifyInstance } from "fastify";
import InMemoryEventBusAdapter from "../shared/infrastructure/InMemoryEventBus.js";
import GetEffectivePermissionsUseCase from "./access/application/usecases/GetEffectivePermissions.usecase.js";
import PostgresqlRoleAssignmentRepositoryAdapter from "./access/infrastructure/persistence/PostgresRoleAssignmentRepository.adapter.js";
import PostgresqlRoleRepositoryAdapter from "./access/infrastructure/persistence/PostgresRoleRepository.adapter.js";
import AccessEventsAdapter from "./access/infrastructure/queue/AccessEvents.adapter.js";
import AuthenticationController from "./identity/api/controllers/Authentication.controller.js";
import AuthorityController from "./identity/api/controllers/Authority.controller.js";
import identityRoutes from "./identity/api/routes/identity.route.js";
import ActivatePendingUserUseCase from "./identity/application/usecases/ActivatePendingUser.usercase.js";
import AddNewUserUseCase from "./identity/application/usecases/AddNewUser.usecase.js";
import AuthenticateUserUseCase from "./identity/application/usecases/AuthenticateUser.usecase.js";
import IdentityEventsAdapter from "./identity/infrastructure/adapters/IdentityEvents.adapter.js";
import UuidV7Generator from "./identity/infrastructure/adapters/Uuidv7Generator.adapter.js";
import PostgresqlIdentityRepositoryAdapter from "./identity/infrastructure/persistence/PostgresIdentityRepository.adapter.js";

export default async function IdentityAccessSubsystem(fastify: FastifyInstance) {
	// infrastructure Layer
    const postgres = fastify.pg;

	const globalEventBus = new InMemoryEventBusAdapter();
    const idGenerator = new UuidV7Generator()
    
	const identityRepository = new PostgresqlIdentityRepositoryAdapter(postgres);
	const identityEventsAdapter = new IdentityEventsAdapter(globalEventBus);
	const roleRepository = new PostgresqlRoleRepositoryAdapter();
	const accessRepository = new PostgresqlRoleAssignmentRepositoryAdapter();
	const accessEventsAdapter = new AccessEventsAdapter(globalEventBus);

	// application Layer
	const authenticateUserUseCase = new AuthenticateUserUseCase(
		identityRepository,
		identityEventsAdapter,
	);

	const addNewUserUseCase = new AddNewUserUseCase(
		idGenerator,
		identityEventsAdapter,
		identityRepository,
	);

	const getEffectivePermissionsUseCase = new GetEffectivePermissionsUseCase(
		accessEventsAdapter,
		accessRepository,
	);

    const activatePendingUserUseCase = new ActivatePendingUserUseCase(
        identityEventsAdapter,
        identityRepository
    )

	// controller Layer 
	const authenticationController = new AuthenticationController(
		authenticateUserUseCase,
		addNewUserUseCase,
        activatePendingUserUseCase
	);
	const authorityController = new AuthorityController(getEffectivePermissionsUseCase);

	await fastify.register(identityRoutes, {
		controller: [authenticationController, authorityController],
	});
}
