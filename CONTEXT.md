# Project Context

`@romandmitri/ai-patch` is an ESM TypeScript library for applying small, validated updates to large AI-generated text values. It currently supports text and
performs immutable, in-memory, atomic transformations against exact anchors in original content coordinates.

## Public API

- `src/index.ts` is the sole supported package entry point.
- `Target` is the canonical immutable facade for schema generation and patch application.
- `ContentFormat` currently contains only `Text`.
- `OperationType` contains `Replace`, `InsertBefore`, `InsertAfter`, and `Delete`.
- `Operation` and the four operation-specific types are exported for typed patch construction.
- `PatchError` and `PatchErrorCode` expose typed application failures.

## Architecture

- `src/target/Target.ts`: validates construction, composes operation schemas, validates direct application input, and dispatches by format.
- `src/operation/`: owns the operation union, discriminants, operation-specific types, and strict Zod schemas.
- `src/patch/Patcher.ts`: abstract internal patch-engine contract over immutable content.
- `src/patch/Patcher_Text.ts`: normalizes text, resolves original line anchors to concrete edits, validates conflicts, and applies edits.
- `src/patch/Edit.ts`: normalized internal edit representation using source input indexes and original-content offsets.
- `src/content/`: owns semantic aliases for complete content, partial content, line numbers, offsets, and supported formats.
- `src/error/PatchError.ts`: owns domain error codes and indexed patch failures.
- `src/target/test/`: covers application behavior, complex batches, errors, and schemas.
- `README.md`: concise npm-facing product overview and minimal structured-output example.
- `docs/`: publication and local development documentation.
- `dist/`: generated build and publication output; source files are authoritative.

## Patch Lifecycle

- `Target.apply()` validates the complete operation list through the same Zod schema exposed by `toSchema()`.
- Structural schema failures are translated to `PatchError` values with a zero-based `patchIndex`.
- Text content and operation fragments normalize CRLF to LF while resolving and applying edits; CRLF output is restored when the target uses CRLF.
- `expectedLine` is a 1-based line in the original content where exact `oldText` matching begins.
- Every operation resolves against one immutable original snapshot, including operations after line-changing edits.
- Resolved edits are conflict-checked before any output is produced, then applied from higher offsets to lower offsets.
- Any malformed operation, missing line, anchor mismatch, or edit conflict rejects the complete batch.

## Conflict Semantics

- Replaced or deleted ranges cannot overlap.
- Insertions cannot occur strictly inside a replaced or deleted range.
- Multiple insertions cannot use the same boundary.
- Insertions at the boundaries of a consumed range are valid.
- Unsupported content formats fail during `Target` construction with `RangeError`.

## Runtime And Packaging

- Node.js 22 or newer is required.
- The package is ESM, targets ES2022, and uses strict TypeScript with `NodeNext` module resolution.
- Source imports use `#src/*.js`; TypeScript maps them to `src/*`, while `package.json#imports` maps built runtime imports to `dist/*`.
- Only the package root is publicly exported. Consumers import from `@romandmitri/ai-patch`, not `#src` paths.
- Builds emit JavaScript, declarations, source maps, and declaration maps into `dist/`.
- Published files are limited to `dist/`, `docs/`, and `README.md`.

## Tests And Commands

- `npm test`: runs all `src/target/test/*.test.ts` files with Node's test runner and `tsx`.
- `npm run typecheck`: checks source and test TypeScript configurations without emitting output.
- `npm run build`: removes `dist/` and compiles the package.
- `npm run dev`: watches source files and incrementally rebuilds `dist/` after changes.
- `npm run format`: applies Prettier formatting.
- `npm run format:check`: verifies formatting.
- `npm run prepublishOnly`: runs typechecking and a clean build; it does not run tests or formatting checks.
