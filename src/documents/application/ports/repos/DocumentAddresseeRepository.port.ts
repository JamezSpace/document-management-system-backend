import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import type { DocumentAddresseePayload } from "../../../domain/valueobjects/DocumentAddressee.js";
import type DocumentAddressee from "../../../domain/valueobjects/DocumentAddressee.js";

interface DocumentAddresseeRepositoryPort {
	save(
		payload: DocumentAddresseePayload,
		tx?: TransactionContext,
	): Promise<DocumentAddressee>;

	fetchAll(): Promise<DocumentAddressee[]>;

	editDocAddressee(
		payload: {
			documentId: string;
			editsToMake: Omit<DocumentAddresseePayload, "documentId" | "recipientUnitId">;
		},
		tx?: TransactionContext,
	): Promise<DocumentAddressee | null>;
}

export type { DocumentAddresseeRepositoryPort };
