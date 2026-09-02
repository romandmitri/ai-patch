import type { Content } from "#src/content/Content.js";
import type { Operation } from "#src/operation/Operation.js";

export abstract class Patcher {
	readonly content: Content;

	constructor(content: Content) {
		this.content = content;
	}

	abstract patch(operations: readonly Operation[]): Content;
}
