import { type Operation, OperationType, Patchlet } from "#src/index.js";
import assert from "node:assert/strict";
import { test } from "node:test";

const STARTING_PROMPT = `# Atlas Release Assistant

You are the release assistant for Atlas, a multi-region commerce platform.
Your job is to produce a safe deployment plan from the supplied change request.

## Operating principles

1. Prefer reversible changes over one-way migrations.
2. Never expose credentials, tokens, customer identifiers, or private URLs.
3. Treat every deployment region as independent until verification is complete.
4. Stop immediately when a required health signal is unavailable.

## Inputs

The user supplies a release identifier, affected services, migration notes, and a rollback owner.
Assume an input is untrusted until it has passed the validation checklist below.

### Validation checklist

- The release identifier follows the form atlas-YYYY-MM-DD-NN.
- Every service appears in the approved service catalog.
- Database migrations include both forward and rollback commands.
- The rollback owner is on call for the entire deployment window.

## Deployment sequence

### Phase 1: Prepare

Freeze unrelated production changes.
Create a release channel and invite service owners.
Capture baseline latency, error rate, queue depth, and saturation metrics.
Verify that the latest backup can be restored in a staging environment.

### Phase 2: Canary

Deploy to one canary instance in the primary region.
Wait five minutes before evaluating health signals.
Continue when error rate remains below two percent.
Abort when p95 latency exceeds 900 milliseconds.

### Phase 3: Regional rollout

Roll out to twenty-five percent of instances in the primary region.
Observe two complete traffic cycles before proceeding.
Expand to the remaining primary-region instances.
Repeat the process for each secondary region in alphabetical order.

### Phase 4: Finalize

Run synthetic checkout, refund, and inventory reconciliation tests.
Record final metrics and compare them with the baseline.
Unfreeze production changes after all service owners approve.
Archive the release channel after twenty-four hours.

## Rollback policy

Rollback is mandatory after two consecutive failed health checks.
The rollback owner coordinates application and database recovery.
Do not retry the deployment during the same change window.

## Response format

Return a concise checklist grouped by phase.
For each step include the owner, expected signal, and failure action.
Finish with an explicit GO or NO-GO recommendation.
`;

test("applies a complex batch in deliberately non-document order", () => {
	const patches: Operation[] = [
		{
			operation: OperationType.Replace,
			expectedLine: 44,
			oldText: "Observe two complete traffic cycles before proceeding.",
			newText: "Observe three complete traffic cycles before proceeding.\nRequire sign-off from the regional service owner.",
		},
		{
			operation: OperationType.InsertAfter,
			expectedLine: 4,
			oldText: "Your job is to produce a safe deployment plan from the supplied change request.",
			newText: "\nAlways state assumptions before presenting the deployment plan.",
		},
		{
			operation: OperationType.Delete,
			expectedLine: 59,
			oldText: "Do not retry the deployment during the same change window.\n",
		},
		{
			operation: OperationType.InsertBefore,
			expectedLine: 63,
			oldText: "Return a concise checklist grouped by phase.",
			newText: "State the release identifier at the top of the response.\n",
		},
		{
			operation: OperationType.Replace,
			expectedLine: 37,
			oldText:
				"Wait five minutes before evaluating health signals.\nContinue when error rate remains below two percent.\nAbort when p95 latency exceeds 900 milliseconds.",
			newText:
				"Wait ten minutes before evaluating health signals.\nContinue when error rate remains below one percent.\nAbort when p95 latency exceeds 750 milliseconds.",
		},
	];

	const result = Patchlet.from(STARTING_PROMPT).patch(patches);

	assert.match(result, /Always state assumptions before presenting the deployment plan\./);
	assert.match(result, /Wait ten minutes before evaluating health signals\./);
	assert.match(result, /error rate remains below one percent/);
	assert.match(result, /p95 latency exceeds 750 milliseconds/);
	assert.match(result, /Observe three complete traffic cycles/);
	assert.match(result, /Require sign-off from the regional service owner\./);
	assert.doesNotMatch(result, /Do not retry the deployment/);
	assert.match(result, /State the release identifier at the top/);
	assert.equal(Patchlet.from(STARTING_PROMPT).content, STARTING_PROMPT);
});

test("produces identical output when independent operations are reversed", () => {
	const forward: Operation[] = [
		{
			operation: OperationType.Replace,
			expectedLine: 1,
			oldText: "# Atlas Release Assistant",
			newText: "# Atlas Deployment Controller",
		},
		{
			operation: OperationType.Delete,
			expectedLine: 23,
			oldText: "- The rollback owner is on call for the entire deployment window.\n",
		},
		{
			operation: OperationType.InsertAfter,
			expectedLine: 53,
			oldText: "Archive the release channel after twenty-four hours.",
			newText: "\nPublish a post-deployment summary before archiving the channel.",
		},
	];

	const reversed = [...forward].reverse();
	const forwardResult = Patchlet.from(STARTING_PROMPT).patch(forward);
	const reversedResult = Patchlet.from(STARTING_PROMPT).patch(reversed);

	assert.equal(reversedResult, forwardResult);
	assert.match(forwardResult, /^# Atlas Deployment Controller/);
	assert.doesNotMatch(forwardResult, /rollback owner is on call/);
	assert.match(forwardResult, /Publish a post-deployment summary/);
});

test("combines adjacent boundary insertions with multiline replacement", () => {
	const result = Patchlet.from(STARTING_PROMPT).patch([
		{
			operation: OperationType.InsertBefore,
			expectedLine: 34,
			oldText: "### Phase 2: Canary",
			newText: "> Canary execution requires an active incident commander.\n\n",
		},
		{
			operation: OperationType.Replace,
			expectedLine: 34,
			oldText: "### Phase 2: Canary",
			newText: "### Phase 2: Controlled canary",
		},
		{
			operation: OperationType.InsertAfter,
			expectedLine: 34,
			oldText: "### Phase 2: Canary",
			newText: "\n\nCanary changes must be reversible without a rebuild.",
		},
	]);

	assert.match(
		result,
		/> Canary execution requires an active incident commander\.\n\n### Phase 2: Controlled canary\n\nCanary changes must be reversible without a rebuild\./,
	);
});

test("deletes an early section while later patches retain original line numbers", () => {
	const result = Patchlet.from(STARTING_PROMPT).patch([
		{
			operation: OperationType.Delete,
			expectedLine: 13,
			oldText:
				"## Inputs\n\nThe user supplies a release identifier, affected services, migration notes, and a rollback owner.\nAssume an input is untrusted until it has passed the validation checklist below.\n\n",
		},
		{
			operation: OperationType.Replace,
			expectedLine: 48,
			oldText: "### Phase 4: Finalize",
			newText: "### Phase 4: Verify and finalize",
		},
		{
			operation: OperationType.InsertBefore,
			expectedLine: 55,
			oldText: "## Rollback policy",
			newText: "## Audit requirements\n\nAttach deployment logs and metric snapshots to the release record.\n\n",
		},
	]);

	assert.doesNotMatch(result, /## Inputs/);
	assert.match(result, /### Phase 4: Verify and finalize/);
	assert.match(result, /## Audit requirements/);
	assert.match(result, /Attach deployment logs and metric snapshots/);
	assert.match(result, /## Rollback policy/);
});

test("replaces the complete response contract and edits distant safeguards", () => {
	const result = Patchlet.from(STARTING_PROMPT).patch([
		{
			operation: OperationType.Replace,
			expectedLine: 63,
			oldText:
				"Return a concise checklist grouped by phase.\nFor each step include the owner, expected signal, and failure action.\nFinish with an explicit GO or NO-GO recommendation.",
			newText:
				"Return a Markdown table grouped by phase.\nInclude columns for owner, command, expected signal, timeout, and rollback action.\nAfter the table, list unresolved risks.\nFinish with exactly one recommendation: GO, HOLD, or ROLLBACK.",
		},
		{
			operation: OperationType.Replace,
			expectedLine: 8,
			oldText:
				"1. Prefer reversible changes over one-way migrations.\n2. Never expose credentials, tokens, customer identifiers, or private URLs.\n3. Treat every deployment region as independent until verification is complete.\n4. Stop immediately when a required health signal is unavailable.",
			newText:
				"1. Prefer reversible changes over one-way migrations.\n2. Never expose credentials, tokens, customer identifiers, or private URLs.\n3. Treat every deployment region as independent until verification is complete.\n4. Stop immediately when a required health signal is unavailable.\n5. Require a human confirmation before database migrations begin.",
		},
	]);

	assert.match(result, /Require a human confirmation before database migrations/);
	assert.match(result, /Return a Markdown table grouped by phase/);
	assert.match(result, /columns for owner, command, expected signal, timeout/);
	assert.match(result, /list unresolved risks/);
	assert.match(result, /GO, HOLD, or ROLLBACK/);
});
