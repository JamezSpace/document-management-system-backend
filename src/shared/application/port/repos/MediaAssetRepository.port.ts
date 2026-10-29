import type {
	CreateMediaAssetPayload,
	MediaAssetRecord,
} from "../../types/mediaAsset.type.js";
import type { TransactionContext } from "../../../infrastructure/persistence/primary/postgres.js";

interface MediaAssetRepositoryPort {
	save(payload: CreateMediaAssetPayload, tx?: TransactionContext): Promise<MediaAssetRecord>;

	findById(mediaId: string): Promise<MediaAssetRecord | null>;
}

export type { MediaAssetRepositoryPort };
