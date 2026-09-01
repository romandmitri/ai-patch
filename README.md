# `@romandmitri/ai-patch`

https://www.npmjs.com/package/@romandmitri/ai-patch

---

## Problem

AI generation loops often rewrite an entire prompt or document for a small change. That consumes more tokens, costs more, takes longer, and increases the risk
of hallucinations, context drift, and unintended rewrites.

## Solution

`@romandmitri/ai-patch` bridges the gap between AI generation and diff-based updates. It lets an LLM return small, structured patches, then validates and
applies them atomically while leaving unrelated content unchanged.

## Install

```sh
npm install @romandmitri/ai-patch
```

Text is the currently supported content format. JSON coming... if needed.

---

# Vercel AI SDK

## Structured Output

`Target.toSchema()` returns a Zod schema for one operation array. Use it directly for a single target or compose several target schemas into a caller-owned
object.

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
	model,
	prompt: "Update the guide and its summary.",
	output: Output.object({
		schema: z.object({
			documentOperations: documentTarget.toSchema(),
			summaryOperations: summaryTarget.toSchema(),
		}),
	}),
});

const updatedDocument = documentTarget.apply(output.documentOperations);
const updatedSummary = summaryTarget.apply(output.summaryOperations);
```

Each schema describes one immutable target. Operations cannot address another target or change which content snapshot supplies their coordinates.

## Tools

`Target.toVercelTool()` creates a target-bound AI SDK tool. Its strict input is `{ patches: Operation[] }`, and execution returns the updated content string.

```ts
import {ContentFormat, Target} from "@romandmitri/ai-patch";
import {generateText, isStepCount} from "ai";

const target = new Target({
	content: "# Guide\n\nOld instructions.\n",
	format: ContentFormat.Markdown,
});

await generateText({
	model,
	prompt: "Update the guide with the patch tool.",
	tools: {
		patchGuide: target.toVercelTool(),
	},
	stopWhen: isStepCount(5),
});
```
