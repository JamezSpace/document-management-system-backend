interface IdentityEmailServicePort{
    sendOnboardingLink(recipientEmail: string, message: string): Promise<void>
}

export type {IdentityEmailServicePort};