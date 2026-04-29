import type OnboardingSession from "../../../../domain/entities/user/OnboardingSession.js";
import type OnboardingSessionView from "../../../../domain/views/invites/OnboardingSessionView.js";

interface OnboardingSessionRepositoryPort {
    save(payload: OnboardingSession): Promise<OnboardingSession>;

    findSessionById(sessionId: string): Promise<OnboardingSession | null>;
    
    findSessionByInviteId(inviteId: string): Promise<OnboardingSession | null>;
    
    update(sessionId: string, payload: Partial<OnboardingSession>): Promise<OnboardingSession>;

    fetchAll(): Promise<OnboardingSessionView[]>;
}

export type {OnboardingSessionRepositoryPort};
