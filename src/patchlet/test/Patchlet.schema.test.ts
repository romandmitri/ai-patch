import { OperationType, Patchlet } from "#src/index.js";
import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";

test("toSchema parses every operation variant", () => {
	const schema = Patchlet.from("content").toSchema();
	const patches = [
		{
			operation: OperationType.Replace,
			expectedLine: 1,
			oldText: "a",
			newText: "b",
		},
		{
			operation: OperationType.InsertBefore,
			expectedLine: 1,
			oldText: "a",
			newText: "b",
		},
		{
			operation: OperationType.InsertAfter,
			expectedLine: 1,
			oldText: "a",
			newText: "b",
		},
		{
			operation: OperationType.Delete,
			expectedLine: 1,
			oldText: "a",
		},
	];

	assert.deepEqual(schema.parse(patches), patches);
});

test("toSchema rejects malformed operation-specific fields", () => {
	const schema = Patchlet.from("content").toSchema();

	assert.equal(
		schema.safeParse([
			{
				operation: OperationType.Replace,
				expectedLine: 1,
				oldText: "a",
			},
		]).success,
		false,
	);
	assert.equal(
		schema.safeParse([
			{
				operation: OperationType.Delete,
				expectedLine: 1,
				oldText: "a",
				newText: "unexpected",
			},
		]).success,
		false,
	);
	assert.equal(
		schema.safeParse([
			{
				operation: OperationType.Delete,
				expectedLine: 0,
				oldText: "a",
			},
		]).success,
		false,
	);
	assert.equal(schema.safeParse({ patches: [] }).success, false);
});

test("schema descriptions document target scope and exact atomic semantics", () => {
	const schema = Patchlet.from("content").toSchema();
	const jsonSchema = JSON.stringify(z.toJSONSchema(schema));

	assert.match(schema.description ?? "", /Atomically update this target only/);
	assert.match(jsonSchema, /1-based line/);
	assert.match(jsonSchema, /exact text anchor/);
	assert.match(jsonSchema, /Must be exactly \\?"replace\\?" \(lowercase\)/);
	assert.match(jsonSchema, /Must be exactly \\?"insertBefore\\?" \(case-sensitive\)/);
	assert.match(jsonSchema, /original content coordinates/);
});

test("two target schemas compose as independent object properties", () => {
	const documentTarget = Patchlet.from("document");
	const summaryTarget = Patchlet.from("summary");
	const schema = z.object({
		documentPatches: documentTarget.toSchema(),
		summaryPatches: summaryTarget.toSchema(),
	});
	const value = {
		documentPatches: [
			{
				operation: OperationType.Replace,
				expectedLine: 1,
				oldText: "document",
				newText: "updated document",
			},
		],
		summaryPatches: [
			{
				operation: OperationType.Replace,
				expectedLine: 1,
				oldText: "summary",
				newText: "updated summary",
			},
		],
	};

	assert.deepEqual(schema.parse(value), value);
	assert.equal(documentTarget.patch(value.documentPatches), "updated document");
	assert.equal(summaryTarget.patch(value.summaryPatches), "updated summary");
});
