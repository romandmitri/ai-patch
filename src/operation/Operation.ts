import type { Operation_Delete } from "#src/operation/Operation_Delete.js";
import type { Operation_InsertAfter } from "#src/operation/Operation_InsertAfter.js";
import type { Operation_InsertBefore } from "#src/operation/Operation_InsertBefore.js";
import type { Operation_Replace } from "#src/operation/Operation_Replace.js";

export type Operation = Operation_Replace | Operation_InsertBefore | Operation_InsertAfter | Operation_Delete;
