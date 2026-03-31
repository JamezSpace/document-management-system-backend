interface GlobalEmailServicePort {
    sendTo(payload: {recipientEmail: string, message: string}, type: 'onboarding' | 'notif'): Promise<void>;
}

export type {GlobalEmailServicePort};

