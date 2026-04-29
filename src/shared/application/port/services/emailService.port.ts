interface GlobalEmailServicePort {
    sendTo(payload: {recipientEmail: string, message: string}, type: 'onboarding' | 'notif'): Promise<boolean>;
}

export type {GlobalEmailServicePort};

