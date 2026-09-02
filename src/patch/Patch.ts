import type { ContentPartial } from "#src/content/ContentPartial.js";
import type { ContentPosition } from "#src/content/ContentPosition.js";
import type { PatchIndex } from "#src/patch/PatchIndex.js";

export type Patch = {
	readonly inputIndex: PatchIndex;
	readonly start: ContentPosition;
	readonly end: ContentPosition;
	readonly replacement: ContentPartial;
	readonly isInsertion: boolean;
};
