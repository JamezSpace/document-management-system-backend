import type OnboardingSession from "../../../../domain/entities/user/OnboardingSession.js";

interface OnboardingSessionRepositoryPort {
    save(payload: OnboardingSession): Promise<OnboardingSession>;

    findSessionById(sessionId: string): Promise<OnboardingSession | null>;
    
    findSessionByInviteId(inviteId: string): Promise<OnboardingSession | null>;
    
    update(sessionId: string, payload: Partial<OnboardingSession>): Promise<OnboardingSession>;
}

export type {OnboardingSessionRepositoryPort};
