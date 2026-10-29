import type { TransactionContext } from "../../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type { SelfServiceSettingsRecord } from "../../../../types/user/selfService.type.js";

interface SelfServiceRepositoryPort {
	findSettings(
		identityId: string,
		staffId: string,
		tx?: TransactionContext,
	): Promise<SelfServiceSettingsRecord | null>;

	updatePhoneNumber(
		identityId: string,
		phoneNumber: string,
		expectedRevision: number,
		tx: TransactionContext,
	): Promise<number | null>;

	incrementRevision(
		identityId: string,
		expectedRevision: number,
		tx: TransactionContext,
	): Promise<number | null>;

	staffOwnsMedia(staffId: string, mediaId: string): Promise<boolean>;
}

export type { SelfServiceRepositoryPort };
