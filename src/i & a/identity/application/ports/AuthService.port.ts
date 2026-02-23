interface AuthService {
    verifyIdToken(token: string) : Promise<string | undefined>;
}

export type { AuthService }