# `@romandmitri/ai-patch`

Apply small, validated updates to large AI-generated Markdown values without regenerating the entire value.

Every `Target` is immutable and represents one content value during one AI generation step. Patch lists use exact anchors in the original content coordinates
and apply atomically.

Currently, only `ContentFormat.Markdown` is supported. Node.js 22 or newer is required.

## Installation

```sh
npm install @romandmitri/ai-patch
```

## Operations

Every operation contains:

- `operation`: one of the four `OperationType` values.
- `expectedLine`: the 1-based line in the original content where `oldText` must begin.
- `oldText`: the exact anchor, which may span multiple lines.
- `newText`: the replacement or inserted fragment; required for every operation except `Delete`.

```ts
import {OperationType, type Operation} from "@romandmitri/ai-patch";

const patches: Operation[] = [
	{
		operation: OperationType.Replace,
		expectedLine: 3,
		oldText: "Old instructions.",
		newText: "New instructions.",
	},
];
```

- `OperationType.Replace`: replace the exact `oldText` anchor with `newText`.
- `OperationType.InsertBefore`: insert `newText` immediately before the anchor.
- `OperationType.InsertAfter`: insert `newText` immediately after the anchor.
- `OperationType.Delete`: remove the exact anchor.

Operation objects are strict, so unknown fields are rejected. Matching starts at the first character of `expectedLine`; the patcher does not search elsewhere
for the anchor. LF and CRLF anchors are treated equivalently, and CRLF output is preserved for CRLF targets.

All operations are resolved against the original content, even when earlier operations add or remove lines. The entire list is rejected if anchors fail or edits
conflict. Conflicts include overlapping replaced or deleted ranges, insertions strictly inside those ranges, and multiple insertions at the same boundary.

## Structured Output

`toSchema()` returns the operation-array schema for one caller-owned property, so multiple targets can be composed into one AI SDK output object.

```ts
import {ContentFormat, Target} from "@romandmitri/ai-patch";
import {Output, generateText} from "ai";
import {z} from "zod";

const documentTarget = new Target({
	content: "# Guide\n\nOld instructions.\n",
	format: ContentFormat.Markdown,
});
const summaryTarget = new Target({
	content: "# Summary\n\nOld summary.\n",
	format: ContentFormat.Markdown,
});

const {output} = await generateText({
	model, // Your AI SDK language model.
	prompt: "Update the guide and its summary.",
	output: Output.object({
		schema: z.object({
			documentPatches: documentTarget.toSchema(),
			summaryPatches: summaryTarget.toSchema(),
		}),
	}),
});

const updatedDocument = documentTarget.apply(output.documentPatches);
const updatedSummary = summaryTarget.apply(output.summaryPatches);
```

## Tools

Each target creates a separate AI SDK tool. The generated `TargetTool` accepts `{ patches: Operation[] }` and returns the updated content string. Execution
propagates `PatchError`; the caller or agent loop may use that error to retry a failed exact match.

```ts
import {ContentFormat, Target} from "@romandmitri/ai-patch";
import {generateText, isStepCount} from "ai";

const documentTarget = new Target({
	content: "# Guide\n\nOld instructions.\n",
	format: ContentFormat.Markdown,
});
const summaryTarget = new Target({
	content: "# Summary\n\nOld summary.\n",
	format: ContentFormat.Markdown,
});

await generateText({
	model,
	prompt: "Update the guide and summary using the appropriate tools.",
	tools: {
		patchDocument: documentTarget.toVercelTool(),
		patchSummary: summaryTarget.toVercelTool(),
	},
	stopWhen: isStepCount(5),
});
```

Create a new target from returned content before a later generation step so new operations use the updated content as their original coordinates:

```ts
const nextDocumentTarget = new Target({
	content: updatedDocument,
	format: ContentFormat.Markdown,
});
```

## Errors

`Target.apply()` validates runtime input and throws `PatchError` for malformed operations, invalid lines, anchor mismatches, or edit conflicts. Each error
contains a stable `PatchErrorCode` and the zero-based `patchIndex` of the relevant input operation. Constructing a target with an unsupported format throws
`RangeError`.

## Public API

The package exports `Target`, `TargetOptions`, `TargetTool`, `ContentFormat`, `OperationType`, `Operation`, the four operation-specific types, `PatchError`, and
`PatchErrorCode`.

## Local Development

Install dependencies, run the tests, type-check the source and tests, build the package, and verify formatting:

```sh
npm install
npm test
npm run typecheck
npm run build
npm run format:check
```

This repository is a library and has no development server or application run command. `npm run build` cleans `dist/` before compiling. Use `npm run format` to
apply formatting and `npm run prepublishOnly` to run the publish-time typecheck and build sequence.
