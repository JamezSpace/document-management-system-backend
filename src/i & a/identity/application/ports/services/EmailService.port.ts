interface IdentityEmailServicePort {
	sendOnboardingLink(recipientEmail: string, message: string): Promise<void>;

	nudgeInvite(recipientEmail: string, message: string): Promise<boolean>;
}

export type { IdentityEmailServicePort };
