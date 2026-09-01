import type { ContentLineNumber } from "#src/content/ContentLineNumber.js";
import type { ContentPartial } from "#src/content/ContentPartial.js";
import { OperationType } from "#src/operation/OperationType.js";
import { z } from "zod";

export type Operation_Replace = {
	readonly operation: OperationType.Replace;
	readonly expectedLine: ContentLineNumber;
	readonly oldText: ContentPartial;
	readonly newText: ContentPartial;
};

export const PatchOperation_Replace_Schema = z
	.strictObject({
		operation: z.literal(OperationType.Replace).describe("Replace the exact oldText anchor with newText."),
		expectedLine: z.number().int().min(1).describe("The exact 1-based line in the original target content where oldText must begin."),
		oldText: z
			.string()
			.describe("An exact text anchor that must start at expectedLine in the original target content; CRLF and LF are treated equivalently."),
		newText: z.string().describe("The text that replaces the matched oldText anchor."),
	})
	.describe("Replace one exact anchored range in this target.") satisfies z.ZodType<Operation_Replace>;
