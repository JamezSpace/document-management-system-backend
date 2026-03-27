import type { DomainErrorType } from "../../../../shared/errors/enum/domain.enum.js";

class AccessDomainError extends Error {
    readonly errorName: DomainErrorType

    constructor(name: DomainErrorType) {
        super(name.codeName)

        this.errorName = name

        Object.setPrototypeOf(this, AccessDomainError.prototype);
    }
}

export default AccessDomainError;