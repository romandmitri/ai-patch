# Local Development

Node.js 22 or newer is required.

Install dependencies and run the complete local verification workflow:

```sh
npm install
npm test
npm run typecheck
npm run build
npm run format:check
```

This repository is a library and has no development server or application run command.

## Package Scripts

- `npm test`: runs `src/target/test/*.test.ts` with Node's test runner and `tsx`.
- `npm run typecheck`: checks source and test TypeScript configurations without emitting output.
- `npm run build`: removes `dist/` and compiles JavaScript, declarations, and maps.
- `npm run clean`: removes generated `dist/` output.
- `npm run format`: applies Prettier formatting.
- `npm run format:check`: verifies formatting without modifying files.
- `npm run prepublishOnly`: runs typechecking and a clean build; it does not run tests or formatting checks.

Generated `dist/` files are not source authority. Public contracts come from `src/index.ts`, implementation and schemas under `src/`, tests, TypeScript
configuration, and `package.json`.
