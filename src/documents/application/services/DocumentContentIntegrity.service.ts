import { createHash } from "node:crypto";

function canonicalJson(value: unknown): string {
	if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
	if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
	const record = value as Record<string, unknown>;
	return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
}

function documentContentSha256(contentDelta: unknown): string {
	return createHash("sha256").update(canonicalJson(contentDelta)).digest("hex");
}

export { canonicalJson, documentContentSha256 };
