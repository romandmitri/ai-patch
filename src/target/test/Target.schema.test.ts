import { ContentFormat, OperationType, Target } from "#src/index.js";
import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";

function target(content: string): Target {
	return new Target({ content, format: ContentFormat.Text });
}

test("toSchema parses every operation variant", () => {
	const schema = target("content").toSchema();
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
	const schema = target("content").toSchema();

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
	const schema = target("content").toSchema();
	const jsonSchema = JSON.stringify(z.toJSONSchema(schema));

	assert.match(schema.description ?? "", /Atomically update this target only/);
	assert.match(jsonSchema, /1-based line/);
	assert.match(jsonSchema, /exact text anchor/);
	assert.match(jsonSchema, /Must be exactly \\?"replace\\?" \(lowercase\)/);
	assert.match(jsonSchema, /Must be exactly \\?"insertBefore\\?" \(case-sensitive\)/);
	assert.match(jsonSchema, /original content coordinates/);
});

test("two target schemas compose as independent object properties", () => {
	const documentTarget = target("document");
	const summaryTarget = target("summary");
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
	assert.equal(documentTarget.apply(value.documentPatches), "updated document");
	assert.equal(summaryTarget.apply(value.summaryPatches), "updated summary");
});
