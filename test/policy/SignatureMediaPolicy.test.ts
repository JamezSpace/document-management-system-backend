import { strict as assert } from "node:assert";
import { test } from "node:test";

import OnboardingInviteUseCase from "../../src/i & a/identity/application/usecases/user/invites/OnboardInvite.usecase.js";
import MediaServiceAdapter from "../../src/shared/infrastructure/adapters/services/media/MediaService.adapter.js";

test("onboarding rejects a non-SVG staff signature before upload", async () => {
	const useCase = new OnboardingInviteUseCase(
		{} as any,
		{} as any,
		{} as any,
		{} as any,
		{} as any,
		{} as any,
	);

	await assert.rejects(
		useCase.uploadOnboardingMedia("SESSION-1", {
			signatureFile: {
				buffer: Buffer.from("not-an-svg"),
				mimeType: "image/jpeg",
			},
			currentStep: 3,
		}),
		(error: any) => error?.message === "Signature files must be valid SVG images.",
	);
});

test("local media metadata recognizes uploaded SVG signatures", async () => {
	const media = new MediaServiceAdapter();
	const svg = Buffer.from(
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 5h10"/></svg>',
	);
	const uploaded = await media.uploadOnboardingMedia("SESSION-1", {
		signatureFile: svg,
	});

	assert.equal(uploaded.signatureFile?.format, "svg");
});
