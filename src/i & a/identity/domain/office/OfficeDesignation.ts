interface OfficeDesignationPayload {
    id : string;
	title :string;
	description?:string;
	hierarchyLevel :number;
	officeId:string;
	createdAt?:Date;
	updatedAt?:Date;
}

class OfficeDesignation {
    private readonly id : string;
	readonly title :string;
	readonly description? :string | undefined;
	readonly hierarchyLevel :number;
	readonly officeId:string;
	readonly createdAt?:Date;
	readonly updatedAt?:Date | undefined;

    constructor(payload: OfficeDesignationPayload) {
        this.id = payload.id;
        this.title = payload.title;
        this.description = payload.description;
        this.hierarchyLevel = payload.hierarchyLevel;
        this.officeId = payload.officeId;

        this.createdAt = payload.createdAt ?? new Date();
        this.updatedAt = payload.updatedAt;
    }

    getOfficeDesignationId() {
        return this.id;
    }
}

export default OfficeDesignation;