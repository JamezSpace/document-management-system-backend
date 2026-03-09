interface BusinessFunctionEventsPort {
	businessFunctionCreated(payload: {
		businessFunctionId: string;
	}): Promise<void>;
}

export type { BusinessFunctionEventsPort };
