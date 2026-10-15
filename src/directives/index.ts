import type { FastifyInstance } from "fastify";
import UuidV7Generator from "../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import TransactionManager from "../shared/infrastructure/persistence/primary/TransactionManager.js";
import DirectiveController from "./api/controllers/DirectiveController.js";
import directiveRoutes from "./api/routes/directive.route.js";
import type { DirectiveAudienceResolverPort } from "./application/ports/DirectiveAudienceResolver.port.js";
import type { DirectiveAuthorityResolverPort } from "./application/ports/DirectiveAuthorityResolver.port.js";
import type { DirectiveRepositoryPort } from "./application/ports/DirectiveRepository.port.js";
import DirectiveCommandService from "./application/services/DirectiveCommand.service.js";
import DirectiveQueryService from "./application/services/DirectiveQuery.service.js";
import AcceptCompletionEvidenceUseCase from "./application/usecases/AcceptCompletionEvidence.usecase.js";
import AcknowledgeDirectiveUseCase from "./application/usecases/AcknowledgeDirective.usecase.js";
import AddCompletionEvidenceUseCase from "./application/usecases/AddCompletionEvidence.usecase.js";
import AmendDirectiveUseCase from "./application/usecases/AmendDirective.usecase.js";
import CompleteDirectiveUseCase from "./application/usecases/CompleteDirective.usecase.js";
import CreateDirectiveUseCase from "./application/usecases/CreateDirective.usecase.js";
import GetDirectiveEvidenceUseCase from "./application/usecases/GetDirectiveEvidence.usecase.js";
import GetDirectiveHistoryUseCase from "./application/usecases/GetDirectiveHistory.usecase.js";
import GetDirectiveUseCase from "./application/usecases/GetDirective.usecase.js";
import IssueDirectiveUseCase from "./application/usecases/IssueDirective.usecase.js";
import ListDirectivesUseCase from "./application/usecases/ListDirectives.usecase.js";
import MarkDirectiveSeenUseCase from "./application/usecases/MarkDirectiveSeen.usecase.js";
import WithdrawDirectiveUseCase from "./application/usecases/WithdrawDirective.usecase.js";
import PostgresDirectiveAudienceResolver from "./infrastructure/identity/PostgresDirectiveAudienceResolver.adapter.js";
import PostgresDirectiveAuthorityResolver from "./infrastructure/identity/PostgresDirectiveAuthorityResolver.adapter.js";
import PostgresDirectiveRepository from "./infrastructure/persistence/PostgresDirectiveRepository.adapter.js";

interface DirectiveSubsystemDependencies {
	repository?: DirectiveRepositoryPort;
	audienceResolver?: DirectiveAudienceResolverPort;
	authorityResolver?: DirectiveAuthorityResolverPort;
}

async function DirectiveSubsystem(
	fastify: FastifyInstance,
	dependencies: DirectiveSubsystemDependencies = {},
) {
	const repository = dependencies.repository ?? new PostgresDirectiveRepository(fastify.pg);
	const audienceResolver = dependencies.audienceResolver ?? new PostgresDirectiveAudienceResolver(fastify.pg);
	const authorityResolver = dependencies.authorityResolver ?? new PostgresDirectiveAuthorityResolver(fastify.pg);
	const commands = new DirectiveCommandService(
		repository,
		audienceResolver,
		authorityResolver,
		new TransactionManager(fastify.pg),
		new UuidV7Generator(),
	);
	const queries = new DirectiveQueryService(repository);
	const controller = new DirectiveController(
		new CreateDirectiveUseCase(commands),
		new AmendDirectiveUseCase(commands),
		new IssueDirectiveUseCase(commands),
		new WithdrawDirectiveUseCase(commands),
		new CompleteDirectiveUseCase(commands),
		new GetDirectiveUseCase(queries),
		new ListDirectivesUseCase(queries),
		new GetDirectiveHistoryUseCase(queries),
		new GetDirectiveEvidenceUseCase(queries),
		new MarkDirectiveSeenUseCase(commands),
		new AcknowledgeDirectiveUseCase(commands),
		new AddCompletionEvidenceUseCase(commands),
		new AcceptCompletionEvidenceUseCase(commands),
	);

	await fastify.register(directiveRoutes, { controller });
}

export default DirectiveSubsystem;
export type { DirectiveSubsystemDependencies };
