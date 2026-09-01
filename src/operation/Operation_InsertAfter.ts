import type { ContentLineNumber } from "#src/content/ContentLineNumber.js";
import type { ContentPartial } from "#src/content/ContentPartial.js";
import { OperationType } from "#src/operation/OperationType.js";
import { z } from "zod";

export type Operation_InsertAfter = {
	readonly operation: OperationType.InsertAfter;
	readonly expectedLine: ContentLineNumber;
	readonly oldText: ContentPartial;
	readonly newText: ContentPartial;
};

export const PatchOperation_InsertAfter_Schema = z
	.strictObject({
		operation: z
			.literal(OperationType.InsertAfter)
			.describe('Must be exactly "insertAfter" (case-sensitive); insert newText immediately after the exact oldText anchor.'),
		expectedLine: z.number().int().min(1).describe("The exact 1-based line in the original target content where oldText must begin."),
		oldText: z
			.string()
			.describe("An exact text anchor that must start at expectedLine in the original target content; CRLF and LF are treated equivalently."),
		newText: z.string().describe("The text inserted after the matched oldText anchor."),
	})
	.describe("Insert text after one exact anchor in this target.") satisfies z.ZodType<Operation_InsertAfter>;
