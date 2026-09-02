import { ContentFormat, type Operation, OperationType, Patchlet } from "#src/index.js";
import assert from "node:assert/strict";
import { test } from "node:test";

test("apply supports all four operations", async (t) => {
	const cases: Array<{
		name: string;
		patch: Operation;
		expected: string;
	}> = [
		{
			name: "replace",
			patch: {
				operation: OperationType.Replace,
				expectedLine: 2,
				oldText: "beta",
				newText: "second",
			},
			expected: "alpha\nsecond\ngamma",
		},
		{
			name: "insertBefore",
			patch: {
				operation: OperationType.InsertBefore,
				expectedLine: 2,
				oldText: "beta",
				newText: "before\n",
			},
			expected: "alpha\nbefore\nbeta\ngamma",
		},
		{
			name: "insertAfter",
			patch: {
				operation: OperationType.InsertAfter,
				expectedLine: 2,
				oldText: "beta",
				newText: "\nafter",
			},
			expected: "alpha\nbeta\nafter\ngamma",
		},
		{
			name: "delete",
			patch: {
				operation: OperationType.Delete,
				expectedLine: 2,
				oldText: "beta\n",
			},
			expected: "alpha\ngamma",
		},
	];

	for (const example of cases) {
		await t.test(example.name, () => {
			assert.equal(Patchlet.from("alpha\nbeta\ngamma").patch([example.patch]), example.expected);
		});
	}
});

test("apply replaces multiline anchors exactly", () => {
	const content = "# Heading\nold first\nold second\nfooter\n";
	const result = Patchlet.from(content).patch([
		{
			operation: OperationType.Replace,
			expectedLine: 2,
			oldText: "old first\nold second",
			newText: "new first\nnew second\nnew third",
		},
	]);

	assert.equal(result, "# Heading\nnew first\nnew second\nnew third\nfooter\n");
});

test("a batch uses original line coordinates after line-changing edits", () => {
	const result = Patchlet.from("one\ntwo\nthree\nfour").patch([
		{
			operation: OperationType.InsertBefore,
			expectedLine: 2,
			oldText: "two",
			newText: "added-a\nadded-b\n",
		},
		{
			operation: OperationType.Delete,
			expectedLine: 4,
			oldText: "four",
		},
	]);

	assert.equal(result, "one\nadded-a\nadded-b\ntwo\nthree\n");
});

test("CRLF anchors match LF patches and CRLF output is preserved", () => {
	const result = Patchlet.from("one\r\ntwo\r\nthree").patch([
		{
			operation: OperationType.Replace,
			expectedLine: 2,
			oldText: "two\nthree",
			newText: "second\nthird\nfourth",
		},
	]);

	assert.equal(result, "one\r\nsecond\r\nthird\r\nfourth");
});

test("empty content and a final line without a newline can be patched", () => {
	assert.equal(
		Patchlet.from("").patch([
			{
				operation: OperationType.InsertBefore,
				expectedLine: 1,
				oldText: "",
				newText: "# Created\n",
			},
		]),
		"# Created\n",
	);

	assert.equal(
		Patchlet.from("first\nlast").patch([
			{
				operation: OperationType.Replace,
				expectedLine: 2,
				oldText: "last",
				newText: "final",
			},
		]),
		"first\nfinal",
	);
});

test("Target remains immutable after applying patches", () => {
	const patchTarget = Patchlet.from("before");
	const result = patchTarget.patch([
		{
			operation: OperationType.Replace,
			expectedLine: 1,
			oldText: "before",
			newText: "after",
		},
	]);

	assert.equal(result, "after");
	assert.equal(patchTarget.content, "before");
	assert.equal(patchTarget.format, ContentFormat.Text);
});
