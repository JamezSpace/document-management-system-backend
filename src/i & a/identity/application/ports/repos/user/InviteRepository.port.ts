import type { InvitePayload } from "../../../../domain/entities/user/Invite.js";
import type Invite from "../../../../domain/entities/user/Invite.js";

interface InviteRepositoryPort {
	save(payload: InvitePayload): Promise<Invite>;

	findByToken(token: string): Promise<Invite | null>;

    findById(inviteId: string): Promise<Invite | null>;

	update(inviteId: string, payload: Partial<Invite>): Promise<Invite>;
}

export type { InviteRepositoryPort };
