import type { ContentPartial } from "#src/content/ContentPartial.js";
import type { ContentPosition } from "#src/content/ContentPosition.js";
import type { EditIndex } from "#src/patch/EditIndex.js";

// TODO: reidenzon - Rename to Patch?!
export interface Edit {
	readonly inputIndex: EditIndex;
	readonly start: ContentPosition;
	readonly end: ContentPosition;
	readonly replacement: ContentPartial;
	readonly isInsertion: boolean;
}
