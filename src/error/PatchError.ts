export enum PatchErrorCode {
	AnchorMismatch = "anchor_mismatch",
	ConflictingInsertion = "conflicting_insertion",
	InsertionInsideRange = "insertion_inside_range",
	InvalidExpectedLine = "invalid_expected_line",
	InvalidOperation = "invalid_operation",
	InvalidNewText = "invalid_new_text",
	InvalidOldText = "invalid_old_text",
	InvalidPatch = "invalid_patch",
	OverlappingRange = "overlapping_range",
}

export class PatchError extends Error {
	readonly name = "PatchError";

	constructor(
		readonly code: PatchErrorCode,
		readonly patchIndex: number,
		message: string,
	) {
		super(`Patch at index ${patchIndex}: ${message}`);
	}
}

export const fail = (patchIndex: number, code: PatchErrorCode, message: string): never => {
	throw new PatchError(code, patchIndex, message);
};
