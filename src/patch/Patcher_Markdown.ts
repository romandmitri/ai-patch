import type { Content } from "#src/content/Content.js";
import type { ContentPartial } from "#src/content/ContentPartial.js";
import type { ContentPosition } from "#src/content/ContentPosition.js";
import { fail, PatchErrorCode } from "#src/error/PatchError.js";
import type { Operation } from "#src/operation/Operation.js";
import { OperationType } from "#src/operation/OperationType.js";
import type { Edit } from "#src/patch/Edit.js";
import type { InputIndex } from "#src/patch/InputIndex.js";
import { Patcher } from "#src/patch/Patcher.js";

export class Patcher_Markdown extends Patcher {
	apply(operations: readonly Operation[]): Content {
		const newline = this.detectNewline();
		const normalizedContent = this.normalizeNewlines(this.content);
		const lineStarts = this.buildLineStarts(normalizedContent);
		const edits = operations.map((operation, inputIndex) => this.createEdit(operation, inputIndex, normalizedContent, lineStarts));

		this.validateConflicts(edits);

		if (edits.every((edit) => normalizedContent.slice(edit.start, edit.end) === edit.replacement)) {
			return this.content;
		}

		const orderedEdits = [...edits].sort((left, right) => right.start - left.start || right.end - left.end || right.inputIndex - left.inputIndex);
		let result = normalizedContent;

		for (const edit of orderedEdits) {
			result = result.slice(0, edit.start) + edit.replacement + result.slice(edit.end);
		}

		return newline === "\r\n" ? result.replace(/\n/g, "\r\n") : result;
	}

	private normalizeNewlines(text: Content | ContentPartial): string {
		return text.replace(/\r\n/g, "\n");
	}

	private detectNewline(): "\n" | "\r\n" {
		const firstNewline = this.content.indexOf("\n");
		return firstNewline > 0 && this.content[firstNewline - 1] === "\r" ? "\r\n" : "\n";
	}

	private buildLineStarts(content: Content): ContentPosition[] {
		const starts = [0];

		for (let offset = content.indexOf("\n"); offset !== -1;) {
			starts.push(offset + 1);
			offset = content.indexOf("\n", offset + 1);
		}

		return starts;
	}

	private createEdit(operation: Operation, inputIndex: InputIndex, content: Content, lineStarts: readonly ContentPosition[]): Edit {
		if (operation.expectedLine > lineStarts.length) {
			return fail(inputIndex, PatchErrorCode.InvalidExpectedLine, "expectedLine must identify a 1-based line in the original content");
		}

		const start = lineStarts[operation.expectedLine - 1];
		const oldText = this.normalizeNewlines(operation.oldText);
		const anchorEnd = start + oldText.length;

		if (anchorEnd > content.length || content.slice(start, anchorEnd) !== oldText) {
			return fail(inputIndex, PatchErrorCode.AnchorMismatch, "oldText does not match exactly at expectedLine");
		}

		switch (operation.operation) {
			case OperationType.Replace:
				return {
					inputIndex,
					start,
					end: anchorEnd,
					replacement: this.normalizeNewlines(operation.newText),
					isInsertion: oldText.length === 0 && operation.newText.length > 0,
				};
			case OperationType.InsertBefore:
				return {
					inputIndex,
					start,
					end: start,
					replacement: this.normalizeNewlines(operation.newText),
					isInsertion: true,
				};
			case OperationType.InsertAfter:
				return {
					inputIndex,
					start: anchorEnd,
					end: anchorEnd,
					replacement: this.normalizeNewlines(operation.newText),
					isInsertion: true,
				};
			case OperationType.Delete:
				return {
					inputIndex,
					start,
					end: anchorEnd,
					replacement: "",
					isInsertion: false,
				};
		}
	}

	private rangesOverlap(left: Edit, right: Edit): boolean {
		return Math.max(left.start, right.start) < Math.min(left.end, right.end);
	}

	private validateConflicts(edits: readonly Edit[]): void {
		for (let index = 0; index < edits.length; index += 1) {
			const current = edits[index];

			for (let priorIndex = 0; priorIndex < index; priorIndex += 1) {
				const prior = edits[priorIndex];
				const currentConsumes = current.start < current.end;
				const priorConsumes = prior.start < prior.end;

				if (currentConsumes && priorConsumes && this.rangesOverlap(current, prior)) {
					fail(current.inputIndex, PatchErrorCode.OverlappingRange, `consumed range overlaps patch at index ${prior.inputIndex}`);
				}

				const insertion = current.isInsertion ? current : prior.isInsertion ? prior : undefined;
				const consumed = currentConsumes ? current : priorConsumes ? prior : undefined;

				if (insertion !== undefined && consumed !== undefined && insertion.start > consumed.start && insertion.start < consumed.end) {
					fail(
						insertion.inputIndex,
						PatchErrorCode.InsertionInsideRange,
						`insertion falls inside the range consumed by patch at index ${consumed.inputIndex}`,
					);
				}

				if (current.isInsertion && prior.isInsertion && current.start === prior.start) {
					fail(current.inputIndex, PatchErrorCode.ConflictingInsertion, `insertion conflicts with patch at index ${prior.inputIndex}`);
				}
			}
		}
	}
}
