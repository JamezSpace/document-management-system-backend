import { deflateSync, inflateSync } from "node:zlib";
import type Document from "../../domain/entities/document/Document.js";

interface VisibleDocumentSignature {
	image: Buffer;
	format: string;
	signerName: string;
	signerDesignation: string | null;
	signedAt: Date;
	contentSha256: string | null;
}

interface PdfImage {
	width: number;
	height: number;
	data: Buffer;
	filter: "FlateDecode";
	colorSpace: "DeviceGray" | "DeviceRGB";
}

class DocumentPdfRenderer {
	static render(
		document: Document,
		watermarkText: string | null,
		signature: VisibleDocumentSignature | null = null,
	): Buffer {
		const source = this.extractText(
			document.getCurrentVersion()?.contentDelta,
		);
		const lines = this.wrap(
			[document.title, document.referenceNumber ?? "", "", source].join(
				"\n",
			),
			90,
		);
		const pageLines = 42;
		const pages = Array.from(
			{ length: Math.max(1, Math.ceil(lines.length / pageLines)) },
			(_, index) =>
				lines.slice(index * pageLines, (index + 1) * pageLines),
		);
		return this.buildPdf(pages, watermarkText, signature);
	}

	private static extractText(value: unknown): string {
		if (!value) return "";
		if (typeof value === "string") return value;
		if (Array.isArray(value))
			return value.map((item) => this.extractText(item)).join("");
		if (typeof value === "object") {
			const record = value as Record<string, unknown>;
			if (Array.isArray(record.ops))
				return record.ops.map((op) => this.extractText(op)).join("");
			if (typeof record.insert === "string") return record.insert;
			if (record.content !== undefined)
				return this.extractText(record.content);
		}
		return "";
	}

	private static wrap(value: string, width: number) {
		const output: string[] = [];
		for (const raw of value.replace(/\r/g, "").split("\n")) {
			let line = raw.trimEnd();
			if (!line) {
				output.push("");
				continue;
			}
			while (line.length > width) {
				let split = line.lastIndexOf(" ", width);
				if (split < width / 2) split = width;
				output.push(line.slice(0, split));
				line = line.slice(split).trimStart();
			}
			output.push(line);
		}
		return output;
	}

	private static buildPdf(
		pages: string[][],
		watermark: string | null,
		signature: VisibleDocumentSignature | null,
	) {
		const objects: string[] = [];
		const add = (body: string) => {
			objects.push(body);
			return objects.length;
		};
		const catalogId = add("");
		const pagesId = add("");
		const fontId = add(
			"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
		);
		let signatureImageId: number | null = null;
		let signatureImage: PdfImage | null = null;
		if (signature) {
			signatureImage = this.decodeImage(
				signature.image,
				signature.format,
			);
			const imageBody = `<< /Type /XObject /Subtype /Image /Width ${signatureImage.width} /Height ${signatureImage.height} /ColorSpace /${signatureImage.colorSpace} /BitsPerComponent 8 /Filter /${signatureImage.filter} /Length ${signatureImage.data.length} >>\nstream\n${signatureImage.data.toString("latin1")}\nendstream`;
			signatureImageId = add(imageBody);
		}

		const pageIds: number[] = [];
		for (const [pageIndex, lines] of pages.entries()) {
			const commands = ["BT", "/F1 11 Tf", "50 760 Td"];
			for (const line of lines)
				commands.push(`(${this.escape(line)}) Tj`, "0 -16 Td");
			commands.push("ET");
			if (watermark)
				commands.push(
					"0.65 g",
					"BT",
					"/F1 9 Tf",
					"40 24 Td",
					`(${this.escape(watermark)}) Tj`,
					"ET",
					"0 g",
				);
			if (
				signature &&
				signatureImage &&
				signatureImageId &&
				pageIndex === pages.length - 1
			) {
				const targetHeight = Math.min(52, signatureImage.height);
				const targetWidth = Math.min(
					130,
					signatureImage.width *
						(targetHeight / signatureImage.height),
				);
				commands.push(
					"0.75 G",
					"50 38 500 68 re S",
					"0 G",
					`q ${targetWidth.toFixed(2)} 0 0 ${targetHeight.toFixed(2)} 62 46 cm /SignatureImage Do Q`,
					"BT",
					"/F1 9 Tf",
					"210 82 Td",
					`(Authorized by: ${this.escape(signature.signerName)}) Tj`,
					"0 -13 Td",
					`(${this.escape(signature.signerDesignation ?? "Unit Head")}) Tj`,
					"0 -13 Td",
					`(${this.escape(signature.signedAt.toISOString())}) Tj`,
					"0 -13 Td",
					`(Content SHA-256: ${this.escape(signature.contentSha256 ?? "legacy")}) Tj`,
					"ET",
				);
			}
			const stream = commands.join("\n");
			const contentId = add(
				`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`,
			);
			const xObjects =
				signatureImageId && pageIndex === pages.length - 1
					? ` /XObject << /SignatureImage ${signatureImageId} 0 R >>`
					: "";
			pageIds.push(
				add(
					`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >>${xObjects} >> /Contents ${contentId} 0 R >>`,
				),
			);
		}
		objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
		objects[pagesId - 1] =
			`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
		let pdf = "%PDF-1.4\n";
		const offsets = [0];
		objects.forEach((body, index) => {
			offsets.push(Buffer.byteLength(pdf, "latin1"));
			pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
		});
		const xref = Buffer.byteLength(pdf, "latin1");
		pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
		for (const offset of offsets.slice(1))
			pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
		pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
		return Buffer.from(pdf, "latin1");
	}

	private static decodeImage(image: Buffer, format: string): PdfImage {
		const normalized = format.toLowerCase();
		if (normalized === "png") return this.decodePng(image);
		throw new Error(`Unsupported signature image format: ${format}`);
	}

	private static decodePng(image: Buffer): PdfImage {
		if (
			!image
				.subarray(0, 8)
				.equals(
					Buffer.from([
						0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
					]),
				)
		)
			throw new Error("Invalid PNG signature image");
		let offset = 8;
		let width = 0;
		let height = 0;
		let bitDepth = 0;
		let colorType = 0;
		let interlace = 0;
		const idat: Buffer[] = [];
		while (offset + 12 <= image.length) {
			const length = image.readUInt32BE(offset);
			const type = image
				.subarray(offset + 4, offset + 8)
				.toString("ascii");
			const data = image.subarray(offset + 8, offset + 8 + length);
			if (type === "IHDR") {
				width = data.readUInt32BE(0);
				height = data.readUInt32BE(4);
				bitDepth = data[8]!;
				colorType = data[9]!;
				interlace = data[12]!;
			} else if (type === "IDAT") idat.push(data);
			else if (type === "IEND") break;
			offset += length + 12;
		}
		if (
			!width ||
			!height ||
			bitDepth !== 8 ||
			interlace !== 0 ||
			![0, 2, 4, 6].includes(colorType)
		) {
			throw new Error(
				"PNG signature image must be non-interlaced 8-bit grayscale, RGB, grayscale-alpha, or RGBA",
			);
		}
		const channels =
			colorType === 0 ? 1 : colorType === 2 ? 3 : colorType === 4 ? 2 : 4;
		const stride = width * channels;
		const inflated = inflateSync(Buffer.concat(idat));
		const decoded = Buffer.alloc(stride * height);
		let sourceOffset = 0;
		for (let row = 0; row < height; row++) {
			const filter = inflated[sourceOffset++]!;
			for (let column = 0; column < stride; column++) {
				const raw = inflated[sourceOffset++]!;
				const left =
					column >= channels
						? decoded[row * stride + column - channels]!
						: 0;
				const up = row > 0 ? decoded[(row - 1) * stride + column]! : 0;
				const upperLeft =
					row > 0 && column >= channels
						? decoded[(row - 1) * stride + column - channels]!
						: 0;
				const value =
					filter === 0
						? raw
						: filter === 1
							? raw + left
							: filter === 2
								? raw + up
								: filter === 3
									? raw + Math.floor((left + up) / 2)
									: filter === 4
										? raw + this.paeth(left, up, upperLeft)
										: (() => {
												throw new Error(
													"Unsupported PNG filter",
												);
											})();
				decoded[row * stride + column] = value & 0xff;
			}
		}
		const rgb = Buffer.alloc(width * height * 3);
		for (let pixel = 0; pixel < width * height; pixel++) {
			const source = pixel * channels;
			const target = pixel * 3;
			const alpha =
				colorType === 4
					? decoded[source + 1]!
					: colorType === 6
						? decoded[source + 3]!
						: 255;
			const red =
				colorType === 0 || colorType === 4
					? decoded[source]!
					: decoded[source]!;
			const green =
				colorType === 0 || colorType === 4 ? red : decoded[source + 1]!;
			const blue =
				colorType === 0 || colorType === 4 ? red : decoded[source + 2]!;
			rgb[target] = 255 - Math.round(((255 - red) * alpha) / 255);
			rgb[target + 1] = 255 - Math.round(((255 - green) * alpha) / 255);
			rgb[target + 2] = 255 - Math.round(((255 - blue) * alpha) / 255);
		}
		return {
			width,
			height,
			data: deflateSync(rgb),
			filter: "FlateDecode",
			colorSpace: "DeviceRGB",
		};
	}

	private static paeth(left: number, up: number, upperLeft: number) {
		const estimate = left + up - upperLeft;
		const leftDistance = Math.abs(estimate - left);
		const upDistance = Math.abs(estimate - up);
		const upperLeftDistance = Math.abs(estimate - upperLeft);
		return leftDistance <= upDistance && leftDistance <= upperLeftDistance
			? left
			: upDistance <= upperLeftDistance
				? up
				: upperLeft;
	}

	private static escape(value: string) {
		return value.replace(/[^\x20-\x7E]/g, "?").replace(/([\\()])/g, "\\$1");
	}
}

export type { VisibleDocumentSignature };
export default DocumentPdfRenderer;
