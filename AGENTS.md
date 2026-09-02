# Repository Documentation

- Keep `README.md` as the concise npm-facing overview: lead with the user problem, maintain an accurate minimal Vercel AI SDK example, and link detailed material under
  `docs/` instead of expanding the landing page with contributor details.
- Keep `README.md` and the relevant `docs/*.md` pages synchronized whenever public exports, constructor or method contracts, operation fields or names, validation
  and atomicity semantics, error behavior, AI SDK integration, supported formats, runtime requirements, package metadata, or scripts change.
- Keep `CONTEXT.md` synchronized whenever source or test topology, module responsibilities, build configuration, validation architecture, supported formats, or
  contributor workflows change.
- Derive documentation from `src/index.ts`, implementation and schemas under `src/`, tests under `src/patchlet/test/`, TypeScript configuration, and
  `package.json`. Do not treat generated `dist/` output as an authority. Keep `docs/usage.md`, `docs/ai-sdk.md`, `docs/api.md`, and `docs/development.md` focused on
  their named concerns.
- Use exact exported identifiers and commands that exist in `package.json`; ensure README examples compile against the pinned dependency versions.
- After documentation changes, run `npm run format:check`. When examples or documented behavior change, also run `npm run typecheck` and `npm test`.
