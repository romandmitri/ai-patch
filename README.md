> Looking to hire me? Check out my [introduction](https://github.com/romandmitri/introduction) repository for a curated list!

---

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
import { Target } from "@romandmitri/ai-patch";
import { Output, generateText } from "ai";
import { z } from "zod";

const document = "# Guide\n\nOld instructions.\n";
const summary = "# Summary\n\nOld summary.\n";
const updateInstructions = "Update the guide and keep its summary in sync.";

const documentTarget = Target.fromContent(document);
const summaryTarget = Target.fromContent(summary);

const { output } = await generateText({
	model,
	instructions: "Return only the patches needed to perform the requested update.",
	messages: [
		{ role: "user", content: "The [update_instructions]:\n" + updateInstructions },
		{ role: "user", content: "The [document]:\n" + document },
		{ role: "user", content: "The [summary]:\n" + summary },
	],
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
