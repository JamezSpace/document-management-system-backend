import type { FastifyInstance } from "fastify";
import EmailServiceAdapter from "../shared/infrastructure/adapters/EmailService.adapter.js";
import UuidV7Generator from "../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import InMemoryEventBusAdapter from "../shared/infrastructure/InMemoryEventBus.js";
import GetEffectivePermissionsUseCase from "./access/application/usecases/GetEffectivePermissions.usecase.js";
import PostgresqlRoleAssignmentRepositoryAdapter from "./access/infrastructure/persistence/PostgresRoleAssignmentRepository.adapter.js";
import PostgresqlRoleRepositoryAdapter from "./access/infrastructure/persistence/PostgresRoleRepository.adapter.js";
import AccessEventsAdapter from "./access/infrastructure/queue/AccessEvents.adapter.js";
import OfficeController from "./identity/api/controllers/office/Office.controller.js";
import OfficeDesignationController from "./identity/api/controllers/office/OfficeDesignation.controller.js";
import OrgUnitController from "./identity/api/controllers/organizationalUnit/OrganizationUnit.controller.js";
import StaffController from "./identity/api/controllers/staff/Staff.controller.js";
import StaffClassificationController from "./identity/api/controllers/staff/StaffClassification.controller.js";
import AuthenticationController from "./identity/api/controllers/user/Authentication.controller.js";
import AuthorityController from "./identity/api/controllers/user/Authority.controller.js";
import officeDesignationRoutes from "./identity/api/routes/office/designation.route.js";
import officeRoutes from "./identity/api/routes/office/office.route.js";
import staffRoutes from "./identity/api/routes/staff/staff.route.js";
import staffClassificationRoutes from "./identity/api/routes/staff/staffClass.route.js";
import orgUnitRoutes from "./identity/api/routes/unit/orgUnits.route.js";
import identityRoutes from "./identity/api/routes/user/identity.route.js";
import AddNewOfficeDesignationUseCase from "./identity/application/usecases/office/AddNewDesignation.usecase.js";
import AddNewOfficeUseCase from "./identity/application/usecases/office/AddNewOffice.usecase.js";
import GetAllOfficeDesignationsUseCase from "./identity/application/usecases/office/GetAllOfficeDesignations.usecase.js";
import GetAllOfficesUseCase from "./identity/application/usecases/office/GetAllOffices.usecase.js";
import AddNewOrgUnitUseCase from "./identity/application/usecases/organizationalUnit/AddNewOrgUnit.usecase.js";
import GetAllUnitsUseCase from "./identity/application/usecases/organizationalUnit/GetAllUnits.usecase.js";
import AddNewStaffUseCase from "./identity/application/usecases/staff/AddNewStaff.usecase.js";
import CloseStaffClassificationUseCase from "./identity/application/usecases/staff/classification/CloseStaffClassification.usecase.js";
import CreateStaffClassificationUseCase from "./identity/application/usecases/staff/classification/CreateStaffClassification.usecase.js";
import EditStaffClassificationMetadataUseCase from "./identity/application/usecases/staff/classification/EditClassificationMetadata.usecase.js";
import EditExistingStaffUseCase from "./identity/application/usecases/staff/EditExistingStaff.usecase.js";
import FetchStaffRecordUsecase from "./identity/application/usecases/staff/FetchStaffRecord.usecase.js";
import GetAllStaffUseCase from "./identity/application/usecases/staff/GetAllStaff.usecase.js";
import RegisterNewStaffUseCase from "./identity/application/usecases/staff/RegisterStaff.usecase.js";
import ActivatePendingUserUseCase from "./identity/application/usecases/user/ActivatePendingUser.usercase.js";
import AddNewUserUseCase from "./identity/application/usecases/user/AddNewUser.usecase.js";
import AuthenticateUserUseCase from "./identity/application/usecases/user/AuthenticateUser.usecase.js";
import OfficeDesignationEventsAdapter from "./identity/infrastructure/events/office/OfficeDesignationsEvents.adapter.js";
import OfficeEventsAdapter from "./identity/infrastructure/events/office/OfficeEvents.adapter.js";
import StaffClassEventsAdapter from "./identity/infrastructure/events/staff/StaffClassEventsAdapter.adapter.js";
import StaffEventsAdapter from "./identity/infrastructure/events/staff/StaffEventsAdapter.adapter.js";
import OrgUnitsEventsAdapter from "./identity/infrastructure/events/unit/OrgUnitsEvents.adapter.js";
import IdentityEventsAdapter from "./identity/infrastructure/events/user/IdentityEvents.adapter.js";
import PostgresOfficeDesignationRepositoryAdapter from "./identity/infrastructure/persistence/office/PostgresOfficeDesignationRepository.adapter.js";
import PostgresOfficeRepositoryAdapter from "./identity/infrastructure/persistence/office/PostgresOfficeRepository.adapter.js";
import PostgresStaffClassificationRepositoryAdapter from "./identity/infrastructure/persistence/staff/PostgresStaffClassificationRepositoryAdapter.adapter.js";
import PostgresStaffRepositoryAdapter from "./identity/infrastructure/persistence/staff/PostgresStaffRepositoryAdapter.adapter.js";
import PostgresOrgUnitRepositoryAdapter from "./identity/infrastructure/persistence/unit/PostgresOrgUnitRepository.adapter.js";
import PostgresqlIdentityRepositoryAdapter from "./identity/infrastructure/persistence/user/PostgresIdentityRepository.adapter.js";
import FirebaseAuthAdapter from "./identity/infrastructure/services/auth/FirebaseAuth.adapter.js";
import IdentityEmailServiceAdapter from "./identity/infrastructure/services/EmailService.adapter.js";
import LoginStaffUseCase from "./identity/application/usecases/user/LoginStaff.usecase.js";
import ActivateStaffUseCase from "./identity/application/usecases/staff/ActivateStaff.usecase.js";
import MediaServiceAdapter from "../shared/infrastructure/adapters/MediaService.adapter.js";


export default async function IdentityAccessSubsystem(
	fastify: FastifyInstance,
) {
	// infrastructure Layer
	const postgres = fastify.pg;

	const globalEventBus = new InMemoryEventBusAdapter();
	const globalEmailService = new EmailServiceAdapter();
	const idGenerator = new UuidV7Generator();

	// all module repos in identity subsystem
	const identityRepository = new PostgresqlIdentityRepositoryAdapter(
		postgres,
	);
	const orgUnitRepository = new PostgresOrgUnitRepositoryAdapter(postgres);
	const roleRepository = new PostgresqlRoleRepositoryAdapter();
	const accessRepository = new PostgresqlRoleAssignmentRepositoryAdapter();
	const officeRepository = new PostgresOfficeRepositoryAdapter(postgres);
	const officeDesignationRepository =
		new PostgresOfficeDesignationRepositoryAdapter(postgres);
	const staffRepositoryAdapter = new PostgresStaffRepositoryAdapter(postgres);
	const staffClassificationRepository =
		new PostgresStaffClassificationRepositoryAdapter(postgres);

	//  all module event adapters in identity subsystem
	const accessEventsAdapter = new AccessEventsAdapter(globalEventBus);
	const identityEventsAdapter = new IdentityEventsAdapter(globalEventBus);
	const unitEventsAdapter = new OrgUnitsEventsAdapter(globalEventBus);
	const officeEventsAdapter = new OfficeEventsAdapter(globalEventBus);
	const designationEventsAdapter = new OfficeDesignationEventsAdapter(
		globalEventBus,
	);
	const staffEventsAdapter = new StaffEventsAdapter(globalEventBus);
	const staffClassificationEventsAdapter = new StaffClassEventsAdapter(
		globalEventBus,
	);

	// service layer
	const identityEmailService = new IdentityEmailServiceAdapter(
		globalEmailService,
	);

    const mediaService = new MediaServiceAdapter();

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
		identityRepository,
	);

    const loginStaffUseCase = new LoginStaffUseCase(staffRepositoryAdapter, staffEventsAdapter)

	// application layer - organizational unit
	const addNewOrgUnitUseCase = new AddNewOrgUnitUseCase(
		idGenerator,
		unitEventsAdapter,
		orgUnitRepository,
	);

	const getAllOrgUnitsUseCase = new GetAllUnitsUseCase(orgUnitRepository);

	// application layer - office
	const addNewOfficeUseCase = new AddNewOfficeUseCase(
		idGenerator,
		officeEventsAdapter,
		officeRepository,
	);

	const getAllOfficesUseCase = new GetAllOfficesUseCase(officeRepository);

	// application layer - office designation
	const addNewDesignationUseCase = new AddNewOfficeDesignationUseCase(
		idGenerator,
		designationEventsAdapter,
		officeDesignationRepository,
	);

	const getAllOfficeDesignationsUseCase = new GetAllOfficeDesignationsUseCase(
		officeDesignationRepository,
	);

	// application layer - staff
	const getAllStaffUseCase = new GetAllStaffUseCase(staffRepositoryAdapter);

	const editStaffUseCase = new EditExistingStaffUseCase(
		staffEventsAdapter,
		staffRepositoryAdapter,
	);

	const addNewStaffUseCase = new AddNewStaffUseCase(
		idGenerator,
		staffEventsAdapter,
		staffRepositoryAdapter,
	);

	const registerNewStaffUseCase = new RegisterNewStaffUseCase(
		idGenerator,
		identityEventsAdapter,
		identityRepository,
		addNewStaffUseCase,
		new FirebaseAuthAdapter(),
		identityEmailService,
	);

    const activateStaffUseCase = new ActivateStaffUseCase(staffEventsAdapter, staffRepositoryAdapter, mediaService);

	const fetchStaffUseCase = new FetchStaffRecordUsecase(staffRepositoryAdapter);

	// application layer - staff classification
	const createStaffClassificationUseCase =
		new CreateStaffClassificationUseCase(
			idGenerator,
			staffClassificationEventsAdapter,
			staffClassificationRepository,
		);

	const editStaffClassificationMetadataUseCase =
		new EditStaffClassificationMetadataUseCase(
			staffClassificationEventsAdapter,
			staffClassificationRepository,
		);

	const closeStaffClassificationUseCase = new CloseStaffClassificationUseCase(
		staffClassificationEventsAdapter,
		staffClassificationRepository,
	);

	// controller Layer
	const authenticationController = new AuthenticationController(
		authenticateUserUseCase,
		addNewUserUseCase,
		activatePendingUserUseCase,
        loginStaffUseCase
	);

	const authorityController = new AuthorityController(
		getEffectivePermissionsUseCase,
	);

	const orgUnitController = new OrgUnitController(
		addNewOrgUnitUseCase,
		getAllOrgUnitsUseCase,
	);

	const officeController = new OfficeController(
		addNewOfficeUseCase,
		getAllOfficesUseCase,
	);

	const officeDesignationController = new OfficeDesignationController(
		addNewDesignationUseCase,
		getAllOfficeDesignationsUseCase,
	);

	const staffController = new StaffController(
		getAllStaffUseCase,
		addNewStaffUseCase,
        registerNewStaffUseCase,
        activateStaffUseCase,
		editStaffUseCase,
		fetchStaffUseCase
	);

	const staffClassificationController = new StaffClassificationController(
		createStaffClassificationUseCase,
		editStaffClassificationMetadataUseCase,
		closeStaffClassificationUseCase,
	);

	await fastify.register(identityRoutes, {
		controller: [authenticationController, authorityController],
	});

	await fastify.register(orgUnitRoutes, {
		controller: orgUnitController,
	});

	await fastify.register(officeRoutes, {
		controller: officeController,
	});

	await fastify.register(officeDesignationRoutes, {
		controller: officeDesignationController,
	});

	await fastify.register(staffRoutes, {
		controller: staffController,
	});

	await fastify.register(staffClassificationRoutes, {
		controller: staffClassificationController,
	});
}
