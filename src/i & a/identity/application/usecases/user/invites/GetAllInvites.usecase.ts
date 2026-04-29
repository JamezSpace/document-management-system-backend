import type { InviteRepositoryPort } from "../../../ports/repos/user/InviteRepository.port.js";

class GetAllInvitesUecase {
    constructor(
        private readonly inviteRepo: InviteRepositoryPort,
    ) {}

    async execute() {
        const invites = this.inviteRepo.fetchAll()

        return invites;
    }
}

export default GetAllInvitesUecase;