interface AuthService {
	verifyIdToken(token: string): Promise<string | undefined>;

	createUser(email: string): Promise<{ authProviderId: string }>;
    
	generatePasswordSetupLink(email: string): Promise<string>;
}

export type { AuthService };
