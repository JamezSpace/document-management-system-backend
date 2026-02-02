import Authentication from "./application/usecases/AuthenticateUser.js";
import AuthorizeUserImplicitly from "./application/usecases/AuthorizeUserImplicitly.js";
import AuthorizeUserContextually from "./application/usecases/AuthorizeUserContextually.js";

import AuthController from "./api/controllers/AuthController.controller.js";

import InMemoryIdentityRepoImpl from "./infrastructure/adapters/IdentityRepository.adapter.js";
import IdentityEventsAdapter from "./infrastructure/adapters/IdentityEvents.adapter.js";

// Adapters
const identityRepo = new InMemoryIdentityRepoImpl();
const identityEvents = new IdentityEventsAdapter();

// Use cases
const authentication = new Authentication(identityRepo, identityEvents);
const authorizeImplicitly = new AuthorizeUserImplicitly(identityEvents);
const authorizeContextually = new AuthorizeUserContextually(identityRepo, identityEvents);

// Controller
export const authController = new AuthController(
  authentication,
  authorizeImplicitly,
  authorizeContextually
);
