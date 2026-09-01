import type { Content } from "#src/content/Content.js";
import { ContentFormat } from "#src/content/ContentFormat.js";
import { fail, PatchErrorCode } from "#src/error/PatchError.js";
import type { Operation } from "#src/operation/Operation.js";
import { PatchOperation_Delete_Schema } from "#src/operation/Operation_Delete.js";
import { PatchOperation_InsertAfter_Schema } from "#src/operation/Operation_InsertAfter.js";
import { PatchOperation_InsertBefore_Schema } from "#src/operation/Operation_InsertBefore.js";
import { PatchOperation_Replace_Schema } from "#src/operation/Operation_Replace.js";
import { Patcher_Markdown } from "#src/patch/Patcher_Markdown.js";
import { tool, type Tool } from "ai";
import { z, type ZodIssue, type ZodType } from "zod";

export interface TargetOptions {
	readonly content: Content;
	readonly format: ContentFormat;
}

export type TargetTool = Tool<{ patches: Operation[] }, Content>;

export class Target {
	readonly content: Content;
	readonly format: ContentFormat;

	constructor(p: TargetOptions) {
		if (p.format !== ContentFormat.Markdown) {
			throw new RangeError(`Unsupported content format: ${p.format}`);
		}

		this.content = p.content;
		this.format = p.format;
		Object.freeze(this);
	}

	static fromContent = (content: Content, format?: ContentFormat) => {
		return new Target({
			content: content,
			format: format ?? ContentFormat.Markdown,
		});
	};

	toSchema(): ZodType<Operation[]> {
		const operationSchema = z.discriminatedUnion("operation", [
			PatchOperation_Replace_Schema,
			PatchOperation_InsertBefore_Schema,
			PatchOperation_InsertAfter_Schema,
			PatchOperation_Delete_Schema,
		]);

		return z
			.array(operationSchema)
			.describe(
				"Atomically update this target only. Every anchor and conflict is validated against the original content coordinates, and any invalid patch rejects the entire list.",
			);
	}

	apply(patches: readonly Operation[]): Content {
		const parsed = this.toSchema().safeParse(patches);
		if (!parsed.success) {
			this.failValidation(parsed.error.issues[0]);
		}

		switch (this.format) {
			case ContentFormat.Markdown:
				return new Patcher_Markdown(this.content).apply(parsed.data);
		}
	}

	toVercelTool(): TargetTool {
		return tool({
			description:
				"Atomically patch this target only. Every patch is validated against this target's original content, and execution returns the updated content string.",
			inputSchema: z
				.strictObject({
					patches: this.toSchema().describe("The complete atomic patch list for this target only."),
				})
				.describe("Patch input for this immutable target; patches cannot address any other target."),
			execute: ({ patches }) => this.apply(patches),
		});
	}

	private failValidation(issue: ZodIssue): never {
		const inputIndex = typeof issue.path[0] === "number" ? issue.path[0] : 0;
		const field = issue.path[1];

		switch (field) {
			case "operation":
				return fail(inputIndex, PatchErrorCode.InvalidOperation, "has an unsupported operation");
			case "expectedLine":
				return fail(inputIndex, PatchErrorCode.InvalidExpectedLine, "expectedLine must be a positive 1-based line number");
			case "oldText":
				return fail(inputIndex, PatchErrorCode.InvalidOldText, "oldText must be a string");
			case "newText":
				return fail(inputIndex, PatchErrorCode.InvalidNewText, "newText must be a string");
			default:
				return fail(inputIndex, PatchErrorCode.InvalidPatch, "must match a supported patch operation");
		}
	}
}
