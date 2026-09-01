import { ContentFormat, type Operation, OperationType, PatchError, PatchErrorCode, Target } from "#src/index.js";
import assert from "node:assert/strict";
import { test } from "node:test";

function target(content: string): Target {
	return new Target({ content, format: ContentFormat.Text });
}

function assertPatchError(callback: () => unknown, code: PatchErrorCode, patchIndex: number): void {
	assert.throws(callback, (error: unknown) => {
		assert.ok(error instanceof PatchError);
		assert.equal(error.code, code);
		assert.equal(error.patchIndex, patchIndex);
		return true;
	});
}

test("anchors must match at the exact expected line", () => {
	assertPatchError(
		() =>
			target("same\nwanted\nsame").apply([
				{
					operation: OperationType.Delete,
					expectedLine: 1,
					oldText: "wanted",
				},
			]),
		PatchErrorCode.AnchorMismatch,
		0,
	);
});

test("expectedLine must be a valid 1-based original line", () => {
	const invalidPatch = {
		operation: OperationType.Delete,
		expectedLine: 0,
		oldText: "one",
	} as Operation;

	assertPatchError(() => target("one\ntwo").apply([invalidPatch]), PatchErrorCode.InvalidExpectedLine, 0);
	assertPatchError(
		() =>
			target("one\ntwo").apply([
				{
					operation: OperationType.Delete,
					expectedLine: 3,
					oldText: "two",
				},
			]),
		PatchErrorCode.InvalidExpectedLine,
		0,
	);
});

test("overlapping consumed ranges reject the full list", () => {
	assertPatchError(
		() =>
			target("alpha\nbeta\ngamma").apply([
				{
					operation: OperationType.Replace,
					expectedLine: 1,
					oldText: "alpha\nbeta",
					newText: "first",
				},
				{
					operation: OperationType.Delete,
					expectedLine: 2,
					oldText: "beta\ngamma",
				},
			]),
		PatchErrorCode.OverlappingRange,
		1,
	);
});

test("insertions inside consumed ranges are rejected", () => {
	assertPatchError(
		() =>
			target("alpha\nbeta\ngamma").apply([
				{
					operation: OperationType.Delete,
					expectedLine: 1,
					oldText: "alpha\nbeta",
				},
				{
					operation: OperationType.InsertBefore,
					expectedLine: 2,
					oldText: "beta",
					newText: "inserted",
				},
			]),
		PatchErrorCode.InsertionInsideRange,
		1,
	);
});

test("multiple insertions at the same boundary are rejected", () => {
	assertPatchError(
		() =>
			target("alpha\nbeta").apply([
				{
					operation: OperationType.InsertBefore,
					expectedLine: 2,
					oldText: "beta",
					newText: "first",
				},
				{
					operation: OperationType.InsertBefore,
					expectedLine: 2,
					oldText: "beta",
					newText: "second",
				},
			]),
		PatchErrorCode.ConflictingInsertion,
		1,
	);
});

test("one invalid patch rolls back the entire atomic batch", () => {
	const patchTarget = target("one\ntwo\nthree");

	assertPatchError(
		() =>
			patchTarget.apply([
				{
					operation: OperationType.Replace,
					expectedLine: 1,
					oldText: "one",
					newText: "changed",
				},
				{
					operation: OperationType.Delete,
					expectedLine: 3,
					oldText: "missing",
				},
			]),
		PatchErrorCode.AnchorMismatch,
		1,
	);
	assert.equal(patchTarget.content, "one\ntwo\nthree");
});

test("unsupported formats are rejected explicitly", () => {
	assert.throws(
		() =>
			new Target({
				content: "value",
				format: "json" as ContentFormat,
			}),
		RangeError,
	);
});
