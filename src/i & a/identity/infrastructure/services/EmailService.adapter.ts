import type { EmailServicePort } from "../../../../shared/application/port/services/emailService.port.js";
import type { IdentityEmailServicePort } from "../../application/ports/services/EmailService.port.js";

class IdentityEmailServiceAdapter implements IdentityEmailServicePort {
    constructor(private readonly emailService: EmailServicePort) {}

    async sendOnboardingLink(recipientEmail: string, message: string): Promise<void> {
        await this.emailService.sendTo(recipientEmail, message);
    }
}

export default IdentityEmailServiceAdapter;