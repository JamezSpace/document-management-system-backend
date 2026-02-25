// application level correspondence to api level User

import type { IdentityStatus } from "../../domain/IdentityStatus.js";

interface User {
    uid: string;
    email: string;
    status: IdentityStatus;
    authProvider: string;
    authProviderId: string;
    firstName: string;
    lastName: string;
    middleName: string;
}

export type { User };
