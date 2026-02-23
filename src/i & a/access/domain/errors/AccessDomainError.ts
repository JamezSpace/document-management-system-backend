import type { DomainErrorCode } from "../../../../shared/errors/enum/domain.enum.js";

class AccessDomainError extends Error {
    readonly name: DomainErrorCode

    constructor(name: DomainErrorCode) {
        super(name)

        this.name = name

        Object.setPrototypeOf(this, AccessDomainError.prototype);
    }
}

export default AccessDomainError;