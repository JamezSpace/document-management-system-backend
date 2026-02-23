import type { RegistryErrorEnum } from "./enum/registry.enum.js";

class RegistryError extends Error {
    readonly name: string;

    constructor(errorName: RegistryErrorEnum) {
        super(errorName)
        
        this.name = errorName

        Object.setPrototypeOf(this, RegistryError.prototype);
    }
}

export default RegistryError;