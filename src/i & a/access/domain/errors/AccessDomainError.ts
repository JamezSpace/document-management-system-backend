import type { DomainErrorType } from "../../../../shared/errors/enum/domain.enum.js";

class AccessDomainError extends Error {
    readonly name: DomainErrorType

    constructor(name: DomainErrorType) {
        super(name)

        this.name = name

        Object.setPrototypeOf(this, AccessDomainError.prototype);
    }
}

export default AccessDomainError;