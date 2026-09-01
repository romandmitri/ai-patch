import { ContentFormat, OperationType, PatchError, PatchErrorCode, Target, type TargetTool } from "#src/index.js";
import assert from "node:assert/strict";
import { test } from "node:test";

function target(content: string): Target {
	return new Target({ content, format: ContentFormat.Text });
}

async function executeTool(generatedTool: TargetTool, input: Parameters<NonNullable<TargetTool["execute"]>>[0]): Promise<unknown> {
	assert.ok(generatedTool.execute);
	return await generatedTool.execute(input, {
		toolCallId: "test-call",
		messages: [],
		context: undefined,
	});
}

test("generated tools delegate to their own immutable targets", async () => {
	const documentTarget = target("document");
	const summaryTarget = target("summary");
	const documentTool = documentTarget.toVercelTool();
	const summaryTool = summaryTarget.toVercelTool();

	const documentResult = await executeTool(documentTool, {
		patches: [
			{
				operation: OperationType.Replace,
				expectedLine: 1,
				oldText: "document",
				newText: "updated document",
			},
		],
	});
	const summaryResult = await executeTool(summaryTool, {
		patches: [
			{
				operation: OperationType.Replace,
				expectedLine: 1,
				oldText: "summary",
				newText: "updated summary",
			},
		],
	});

	assert.equal(documentResult, "updated document");
	assert.equal(summaryResult, "updated summary");
	assert.equal(documentTarget.content, "document");
	assert.equal(summaryTarget.content, "summary");
});

test("generated tool input and tool descriptions are package-owned", () => {
	const generatedTool = target("content").toVercelTool();
	const inputSchema = generatedTool.inputSchema as {
		description?: string;
		parse(value: unknown): unknown;
	};

	const description = generatedTool.description;
	if (typeof description !== "string") {
		assert.fail("expected a static tool description");
	}
	assert.match(description, /this target only/);
	assert.match(inputSchema.description ?? "", /immutable target/);
	assert.deepEqual(inputSchema.parse({ patches: [] }), { patches: [] });
	assert.throws(() => inputSchema.parse([]));
});

test("generated tool execution propagates typed patch errors", async () => {
	const patchTarget = target("expected");
	const generatedTool = patchTarget.toVercelTool();

	await assert.rejects(
		() =>
			executeTool(generatedTool, {
				patches: [
					{
						operation: OperationType.Delete,
						expectedLine: 1,
						oldText: "wrong",
					},
				],
			}),
		(error: unknown) => {
			assert.ok(error instanceof PatchError);
			assert.equal(error.code, PatchErrorCode.AnchorMismatch);
			assert.equal(error.patchIndex, 0);
			return true;
		},
	);
	assert.equal(patchTarget.content, "expected");
});
