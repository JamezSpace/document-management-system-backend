interface OrgUnitEvents {
    unitCreated(payload: {
        unitId: string;
    }): Promise<void>
}

export type {OrgUnitEvents};