import type { ContentPartial } from "#src/content/ContentPartial.js";
import type { ContentPosition } from "#src/content/ContentPosition.js";
import type { InputIndex } from "#src/patch/InputIndex.js";

export interface Edit {
	readonly inputIndex: InputIndex;
	readonly start: ContentPosition;
	readonly end: ContentPosition;
	readonly replacement: ContentPartial;
	readonly isInsertion: boolean;
}
