import { strict as assert } from "node:assert";
import { test } from "node:test";
import fastify from "fastify";

import type DocumentController from "../../src/documents/api/controllers/document/DocumentController.js";
import documentRoutes from "../../src/documents/api/routes/documents.route.js";
import type NotificationController from "../../src/notifications/api/controllers/NotificationController.js";
import notificationRoutes from "../../src/notifications/api/routes/notifications.route.js";
import type { ActorContext } from "../../src/security/application/type/authorization.type.js";
import type { DocumentGovernancePolicyPort } from "../../src/shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";

const actor: ActorContext = {
	identityId: "identity-1",
	staffId: "staff.actor",
	officeId: "office-1",
	unitId: "unit-1",
	grants: [],
};

test("document collection derives its subject from the authenticated actor", async (t) => {
	const requestedStaffIds: string[] = [];
	const controller = {
		async fetchAllDocsByStaff(staffId: string) {
			requestedStaffIds.push(staffId);
			return [];
		},
	} as unknown as DocumentController;
	const policy = {
		getSensitivityLevels: () => ["public"],
	} as unknown as DocumentGovernancePolicyPort;
	const app = fastify({ logger: false });
	t.after(() => app.close());
	app.decorateRequest("actor", null);
	app.addHook("preHandler", async (request) => {
		request.actor = actor;
	});
	await app.register(documentRoutes, {
		controller,
		documentGovernancePolicy: policy,
	});

	const response = await app.inject({ method: "GET", url: "/documents/me" });
	const malformedLegacyResponse = await app.inject({
		method: "GET",
		url: "/documents/undefined",
	});

	assert.equal(response.statusCode, 200);
	assert.deepEqual(response.json(), { success: true, data: [] });
	assert.deepEqual(requestedStaffIds, ["staff.actor"]);
	assert.equal(malformedLegacyResponse.statusCode, 404);
});

test("notification collection derives its subject from the authenticated actor", async (t) => {
	const requestedStaffIds: string[] = [];
	const controller = {
		async getStaffNotifications(staffId: string) {
			requestedStaffIds.push(staffId);
			return [];
		},
	} as unknown as NotificationController;
	const app = fastify({ logger: false });
	t.after(() => app.close());
	app.decorateRequest("actor", null);
	app.addHook("preHandler", async (request) => {
		request.actor = actor;
	});
	await app.register(notificationRoutes, { controller });

	const response = await app.inject({ method: "GET", url: "/me" });
	const malformedLegacyResponse = await app.inject({
		method: "GET",
		url: "/undefined",
	});

	assert.equal(response.statusCode, 200);
	assert.deepEqual(response.json(), { success: true, data: [] });
	assert.deepEqual(requestedStaffIds, ["staff.actor"]);
	assert.equal(malformedLegacyResponse.statusCode, 404);
});
