import type { Content } from "#src/content/Content.js";
import { ContentFormat, isValidContentFormat } from "#src/content/ContentFormat.js";
import type { Operation } from "#src/operation/Operation.js";
import { Operation_Delete_Schema } from "#src/operation/Operation_Delete.js";
import { Operation_InsertAfter_Schema } from "#src/operation/Operation_InsertAfter.js";
import { Operation_InsertBefore_Schema } from "#src/operation/Operation_InsertBefore.js";
import { Operation_Replace_Schema } from "#src/operation/Operation_Replace.js";
import { Patcher } from "#src/patcher/Patcher.js";
import { Patcher_Text } from "#src/patcher/Patcher_Text.js";
import { z, type ZodType } from "zod";

export interface PatchletOptions {
	readonly content: Content;
	readonly format: ContentFormat;
}

export class Patchlet {
	readonly content: Content;
	readonly format: ContentFormat;
	readonly patcher: Patcher;

	constructor(p: PatchletOptions) {
		if (!isValidContentFormat(p.format)) {
			throw new Error(`Patchlet.constructor.format [${p.format}]`);
		}

		this.content = p.content;
		this.format = p.format;

		// TODO: reidenzon - Choose patcher as function of ContentFormat.
		this.patcher = new Patcher_Text(this.content);
	}

	static from = (content: Content, format?: ContentFormat) => {
		return new Patchlet({
			content: content,
			format: format ?? ContentFormat.Text,
		});
	};

	toSchema(): ZodType<Operation[]> {
		return z
			.array(
				z.union([
					//
					Operation_Replace_Schema,
					Operation_InsertBefore_Schema,
					Operation_InsertAfter_Schema,
					Operation_Delete_Schema,
				]),
			)
			.describe(
				"Atomically update this target only. Every anchor and conflict is validated against the original content coordinates, and any invalid patch rejects the entire list.",
			);
	}

	patch = (operations: readonly Operation[]): Content => {
		const parsed = this.toSchema().safeParse(operations);
		if (!parsed.success) throw parsed.error;
		return this.patcher.patch(parsed.data);
	};
}
