interface EmailServicePort {
    sendTo(recipientEmail: string, message: string): Promise<void>;
}

export type {EmailServicePort};

