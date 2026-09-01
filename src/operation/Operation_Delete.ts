import type { ContentLineNumber } from "#src/content/ContentLineNumber.js";
import type { ContentPartial } from "#src/content/ContentPartial.js";
import { OperationType } from "#src/operation/OperationType.js";
import { z } from "zod";

export type Operation_Delete = {
	readonly operation: OperationType.Delete;
	readonly expectedLine: ContentLineNumber;
	readonly oldText: ContentPartial;
};

export const PatchOperation_Delete_Schema = z
	.strictObject({
		operation: z.literal(OperationType.Delete).describe("Delete the exact oldText anchor."),
		expectedLine: z.number().int().min(1).describe("The exact 1-based line in the original target content where oldText must begin."),
		oldText: z
			.string()
			.describe("An exact text anchor that must start at expectedLine in the original target content; CRLF and LF are treated equivalently."),
	})
	.describe("Delete one exact anchored range from this target.") satisfies z.ZodType<Operation_Delete>;
