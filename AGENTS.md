# Repository Documentation

- Keep `README.md` synchronized whenever public exports, constructor or method contracts, operation fields or names, validation and atomicity semantics, error
  behavior, AI SDK integration, supported formats, runtime requirements, or package scripts change.
- Keep `CONTEXT.md` synchronized whenever source or test topology, module responsibilities, build configuration, validation architecture, supported formats, or
  contributor workflows change.
- Derive documentation from `src/index.ts`, implementation and schemas under `src/`, tests under `src/target/test/`, TypeScript configuration, and
  `package.json`. Do not treat generated `dist/` output as an authority.
- Use exact exported identifiers and commands that exist in `package.json`; ensure README examples compile against the pinned dependency versions.
- After documentation changes, run `npm run format:check`. When examples or documented behavior change, also run `npm run typecheck` and `npm test`.
