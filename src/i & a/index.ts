import type { FastifyInstance } from "fastify";
import NodemailerEmailServiceAdapter from "../shared/infrastructure/adapters/services/email/NodemailerEmailService.adapter.js";
import ResendEmailServiceAdapter from "../shared/infrastructure/adapters/services/email/ResendEmailService.adapter.js";
import CloudinaryMediaServiceAdapter from "../shared/infrastructure/adapters/services/media/CloudinaryMediaService.adapter.js";
import MediaServiceAdapter from "../shared/infrastructure/adapters/services/media/MediaService.adapter.js";
import UuidV7Generator from "../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import InMemoryEventBusAdapter from "../shared/infrastructure/InMemoryEventBus.js";
import PostgresMediaAssetRepositoryAdapter from "../shared/infrastructure/persistence/primary/PostgresMediaAssetRepository.adapter.js";
import PostgresTransactionManager from "../shared/infrastructure/persistence/primary/PostgresTransactionManager.js";
import AssignOfficialRoleUseCase from "./access/application/usecases/AssignOfficialRole.js";
import GetEffectivePermissionsUseCase from "./access/application/usecases/GetEffectivePermissions.usecase.js";
import ResolveStaffAuthorityUseCase from "./access/application/usecases/ResolveStaffAuthority.usecase.js";
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
import InvitesController from "./identity/api/controllers/user/Invites.controller.js";
import officeDesignationRoutes from "./identity/api/routes/office/designation.route.js";
import officeRoutes from "./identity/api/routes/office/office.route.js";
import staffRoutes from "./identity/api/routes/staff/staff.route.js";
import staffClassificationRoutes from "./identity/api/routes/staff/staffClass.route.js";
import orgUnitRoutes from "./identity/api/routes/unit/orgUnits.route.js";
import identityRoutes from "./identity/api/routes/user/identity.route.js";
import inviteRoutes from "./identity/api/routes/user/invites.route.js";
import AddNewOfficeDesignationUseCase from "./identity/application/usecases/office/AddNewDesignation.usecase.js";
import AddNewOfficeUseCase from "./identity/application/usecases/office/AddNewOffice.usecase.js";
import GetAllOfficeDesignationUseCase from "./identity/application/usecases/office/GetAllOfficeDesignations.usecase.js";
import GetAllOfficesUseCase from "./identity/application/usecases/office/GetAllOffices.usecase.js";
import AddNewOrgUnitUseCase from "./identity/application/usecases/organizationalUnit/AddNewOrgUnit.usecase.js";
import GetAllUnitsUseCase from "./identity/application/usecases/organizationalUnit/GetAllUnits.usecase.js";
import ActivateStaffUseCase from "./identity/application/usecases/staff/activateStaff/ActivateStaff.usecase.js";
import ActivationOrchestratorUseCase from "./identity/application/usecases/staff/activateStaff/ActivationOrchestrator.usecase.js";
import AddNewStaffUseCase from "./identity/application/usecases/staff/AddNewStaff.usecase.js";
import CloseStaffClassificationUseCase from "./identity/application/usecases/staff/classification/CloseStaffClassification.usecase.js";
import CreateStaffClassificationUseCase from "./identity/application/usecases/staff/classification/CreateStaffClassification.usecase.js";
import EditStaffClassificationMetadataUseCase from "./identity/application/usecases/staff/classification/EditClassificationMetadata.usecase.js";
import CreateStaffViaInviteUseCase from "./identity/application/usecases/staff/CreateStaffViaInvite.usecase.js";
import DeleteStaffUseCase from "./identity/application/usecases/staff/DeleteStaff.usecase.js";
import EditExistingStaffUseCase from "./identity/application/usecases/staff/EditExistingStaff.usecase.js";
import FetchStaffRecordUsecase from "./identity/application/usecases/staff/FetchStaffRecord.usecase.js";
import GetAllStaffUseCase from "./identity/application/usecases/staff/GetAllStaff.usecase.js";
import ActivatePendingUserUseCase from "./identity/application/usecases/user/ActivatePendingUser.usercase.js";
import AddNewUserUseCase from "./identity/application/usecases/user/AddNewUser.usecase.js";
import AuthenticateUserUseCase from "./identity/application/usecases/user/AuthenticateUser.usecase.js";
import GetAllUsersUseCase from "./identity/application/usecases/user/GetAllUsers.usecase.js";
import CreateInviteUseCase from "./identity/application/usecases/user/invites/CreateInvite.usecase.js";
import GetAllInvitesUecase from "./identity/application/usecases/user/invites/GetAllInvites.usecase.js";
import NudgeInviteUsecase from "./identity/application/usecases/user/invites/NudgeInvite.usecase.js";
import OnboardingInviteUseCase from "./identity/application/usecases/user/invites/OnboardInvite.usecase.js";
import OfficeDesignationEventsAdapter from "./identity/infrastructure/events/office/OfficeDesignationsEvents.adapter.js";
import OfficeEventsAdapter from "./identity/infrastructure/events/office/OfficeEvents.adapter.js";
import StaffClassEventsAdapter from "./identity/infrastructure/events/staff/StaffClassEventsAdapter.adapter.js";
import StaffEventsAdapter from "./identity/infrastructure/events/staff/StaffEventsAdapter.adapter.js";
import OrgUnitsEventsAdapter from "./identity/infrastructure/events/unit/OrgUnitsEvents.adapter.js";
import IdentityEventsAdapter from "./identity/infrastructure/events/user/IdentityEvents.adapter.js";
import PostgresOfficeDesignationRepositoryAdapter from "./identity/infrastructure/persistence/entities/office/PostgresOfficeDesignationRepository.adapter.js";
import PostgresOfficeRepositoryAdapter from "./identity/infrastructure/persistence/entities/office/PostgresOfficeRepository.adapter.js";
import PostgresStaffActivationFailureRepositoryAdapter from "./identity/infrastructure/persistence/entities/staff/PostgresStaffActivationFailureRepository.adapter.js";
import PostgresStaffCapabilityClassRepositoryAdapter from "./identity/infrastructure/persistence/entities/staff/PostgresStaffCapabilityClassRepository.adapter.js";
import PostgresStaffClassificationRepositoryAdapter from "./identity/infrastructure/persistence/entities/staff/PostgresStaffClassificationRepositoryAdapter.adapter.js";
import PostgresStaffMediaRepositoryAdapter from "./identity/infrastructure/persistence/entities/staff/PostgresStaffMediaRepository.adapter.js";
import PostgresStaffRepositoryAdapter from "./identity/infrastructure/persistence/entities/staff/PostgresStaffRepositoryAdapter.adapter.js";
import PostgresOrgUnitRepositoryAdapter from "./identity/infrastructure/persistence/entities/unit/PostgresOrgUnitRepository.adapter.js";
import PostgresqlIdentityRepositoryAdapter from "./identity/infrastructure/persistence/entities/user/PostgresIdentityRepository.adapter.js";
import PostgresqlOnboardingSessionRepositoryAdapter from "./identity/infrastructure/persistence/entities/user/PostgresOnboardingSessionRepository.adapter.js";
import PostgresqlInviteRepositoryAdapter from "./identity/infrastructure/persistence/entities/user/PostgresqlInviteRepository.adapter.js";
import PostgresqlCapRoleRepositoryAdapter from "./identity/infrastructure/persistence/mappings/PostgresCapRoleRepository.adapter.js";
import PostgresqlDesigCapClassRepositoryAdapter from "./identity/infrastructure/persistence/mappings/PostgresDesignCapClassRepository.adapter.js";
import FirebaseAuthAdapter from "./identity/infrastructure/services/auth/FirebaseAuth.adapter.js";
import PostgresClassificationServiceAdapter from "./identity/infrastructure/services/ClassificationService.adapter.js";
import IdentityEmailServiceAdapter from "./identity/infrastructure/services/EmailService.adapter.js";
import OpaqueTokenServiceAdapter from "./identity/infrastructure/services/OpaqueTokenService.adapter.js";
import RoleServiceAdapter from "./identity/infrastructure/services/RoleService.adapter.js";


export default async function IdentityAccessSubsystem(
	fastify: FastifyInstance,
) {
	// infrastructure Layer
	const postgres = fastify.pg;

	const globalEventBus = new InMemoryEventBusAdapter();
	const globalNodemailerEmailService = new NodemailerEmailServiceAdapter();
	const globalResendEmailService = new ResendEmailServiceAdapter();
	const idGenerator = new UuidV7Generator();
	const transactionManager = new PostgresTransactionManager(postgres);
	const mediaService = new CloudinaryMediaServiceAdapter();

	// all module repos in identity subsystem
	const identityRepository = new PostgresqlIdentityRepositoryAdapter(postgres);
	const inviteRepository = new PostgresqlInviteRepositoryAdapter(postgres);
    const onboardingSessionRepo = new PostgresqlOnboardingSessionRepositoryAdapter(postgres);
	const orgUnitRepository = new PostgresOrgUnitRepositoryAdapter(postgres);
	const roleRepository = new PostgresqlRoleRepositoryAdapter(postgres);
	const roleAssignmentsRepository = new PostgresqlRoleAssignmentRepositoryAdapter(postgres);
	const officeRepository = new PostgresOfficeRepositoryAdapter(postgres);
	const officeDesignationRepository =
		new PostgresOfficeDesignationRepositoryAdapter(postgres);
	const staffRepositoryAdapter = new PostgresStaffRepositoryAdapter(
		postgres,
		mediaService,
	);
	const staffMediaRepository = new PostgresStaffMediaRepositoryAdapter(postgres);
	const staffClassificationRepository =
		new PostgresStaffClassificationRepositoryAdapter(postgres);
	const staffCapabilityClassRepository =
		new PostgresStaffCapabilityClassRepositoryAdapter(postgres);
    const desigCapClassRepository = new PostgresqlDesigCapClassRepositoryAdapter(postgres);
    const capRoleRepository = new PostgresqlCapRoleRepositoryAdapter(postgres);
	const mediaAssetRepository = new PostgresMediaAssetRepositoryAdapter(postgres);
	const staffMediaAssetRepository = new PostgresStaffMediaRepositoryAdapter(postgres);
    const activationFailureRepository = new PostgresStaffActivationFailureRepositoryAdapter(postgres);

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
		globalResendEmailService,
	);

    const tokenService = new OpaqueTokenServiceAdapter();
	const cloudinaryMediaService = new CloudinaryMediaServiceAdapter();
	const classificationService = new PostgresClassificationServiceAdapter(
		desigCapClassRepository
	);
	const roleService = new RoleServiceAdapter(capRoleRepository, roleRepository);

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

	const getAllUsersUseCase = new GetAllUsersUseCase(identityRepository);

    const createInviteUsecase = new CreateInviteUseCase(idGenerator, tokenService, identityEmailService, inviteRepository);
    const getAllInvitesUsecase = new GetAllInvitesUecase(inviteRepository);
    const nudgeInviteUsecase = new NudgeInviteUsecase(identityEmailService, inviteRepository, onboardingSessionRepo);

	const onboardInviteUseCase = new OnboardingInviteUseCase(
        idGenerator,
		tokenService,
		cloudinaryMediaService,
		mediaAssetRepository,
        inviteRepository,
        onboardingSessionRepo
	);

	const getEffectivePermissionsUseCase = new GetEffectivePermissionsUseCase(
		accessEventsAdapter,
		roleAssignmentsRepository,
	);

	const activatePendingUserUseCase = new ActivatePendingUserUseCase(
		identityEventsAdapter,
		identityRepository,
	);

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

	const getAllOfficeDesignationUseCase = new GetAllOfficeDesignationUseCase(
		officeDesignationRepository,
	);

	// application layer - staff
	const getAllStaffUseCase = new GetAllStaffUseCase(staffRepositoryAdapter);

	const editStaffUseCase = new EditExistingStaffUseCase(
		staffEventsAdapter,
		staffRepositoryAdapter,
	);
	const deleteStaffUseCase = new DeleteStaffUseCase(staffRepositoryAdapter);

	const addNewStaffUseCase = new AddNewStaffUseCase(
		idGenerator,
		staffEventsAdapter,
		staffRepositoryAdapter,
	);

    const assignOfficialRoleUseCase = new AssignOfficialRoleUseCase(accessEventsAdapter, roleAssignmentsRepository);

	const activateStaffUseCase = new ActivateStaffUseCase(
		idGenerator,
		staffRepositoryAdapter,
		officeDesignationRepository,
		onboardingSessionRepo,
		staffClassificationRepository,
		staffMediaAssetRepository,
		staffEventsAdapter,
		classificationService,
		roleService,
		transactionManager,
        assignOfficialRoleUseCase
	);

    const activationOrchestratorUseCase =
	new ActivationOrchestratorUseCase(
		activateStaffUseCase,
		activationFailureRepository,
		staffEventsAdapter,
		idGenerator
	);

	const createStaffViaInviteUseCase = new CreateStaffViaInviteUseCase(
		idGenerator,
		identityEventsAdapter,
		staffEventsAdapter,
		identityRepository,
		inviteRepository,
		onboardingSessionRepo,
		addNewStaffUseCase,
		new FirebaseAuthAdapter(),
		identityEmailService,
		transactionManager,
	);

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

    const resolveStaffAuthority = new ResolveStaffAuthorityUseCase(roleAssignmentsRepository);

	// controller Layer
	const authenticationController = new AuthenticationController(
        onboardInviteUseCase,
		authenticateUserUseCase,
		addNewUserUseCase,
		activatePendingUserUseCase,
		getAllUsersUseCase,
	);

    const invitesController = new InvitesController(createInviteUsecase, getAllInvitesUsecase, nudgeInviteUsecase);

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
		getAllOfficeDesignationUseCase,
	);

	const staffController = new StaffController(
		getAllStaffUseCase,
		addNewStaffUseCase,
        createStaffViaInviteUseCase,
		activationOrchestratorUseCase,
		editStaffUseCase,
		deleteStaffUseCase,
		fetchStaffUseCase,
        resolveStaffAuthority
	);

	const staffClassificationController = new StaffClassificationController(
		createStaffClassificationUseCase,
		editStaffClassificationMetadataUseCase,
		closeStaffClassificationUseCase,
	);

	await fastify.register(identityRoutes, {
		controller: authenticationController,
	});

	await fastify.register(inviteRoutes, {
		controller: invitesController,
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
