interface AuthServicePort {
	verifyIdToken(token: string): Promise<string | undefined>;

	createUser(email: string): Promise<{ authProviderId: string }>;
    
	generatePasswordSetupLink(email: string, staffId: string): Promise<string>;
}

export type { AuthServicePort };
