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

```ts
import { Target } from "@romandmitri/ai-patch";
import { Output, generateText } from "ai";
import { z } from "zod";

const document = "# Guide\n\nOld instructions.\n";
const summary = "# Summary\n\nOld summary.\n";
const updateInstructions = "Update the guide and keep its summary in sync.";

const documentPatchlet = Patchlet.from(document);
const summaryPatchlet = Patchlet.from(summary);

const { output } = await generateText({
	model,
	instructions: "Return only the patches needed to perform the requested update.",
	messages: [
		{ role: "user", content: "The [update_instructions]:\n" + updateInstructions },
		{ role: "user", content: "The [document]:\n" + documentPatchlet.content },
		{ role: "user", content: "The [summary]:\n" + summaryPatchlet.content },
	],
	output: Output.object({
		schema: z.object({
			documentPatches: documentPatchlet.toSchema(),
			summaryPatches: summaryPatchlet.toSchema(),
		}),
	}),
});

const updatedDocument = documentPatchlet.patch(output.documentPatches);
const updatedSummary = summaryPatchlet.patch(output.summaryPatches);
```
