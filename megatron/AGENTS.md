# Repository Guidelines

## Project Structure & Module Organization
This is an Nx-managed NestJS monorepo following domain-driven design.
- `apps/transport-api/`: NestJS application (entry: `apps/transport-api/src/main.ts`).
- `apps/transport-api-e2e/`: End-to-end tests.
- `packages/transport/`: Domain libraries for the initial `transport` domain:
  - `domain/`, `application/`, `infrastructure/`.
- `dist/`: Build output (generated).
- `nx.json`, `tsconfig.base.json`: Workspace configuration and path aliases.

## Build, Test, and Development Commands
Use `pnpm nx` targets for consistent builds:
- `pnpm nx serve transport-api`: Run the API locally.
- `pnpm nx build transport-api`: Build the API into `dist/apps/transport-api`.
- `pnpm nx test transport-api`: Unit tests for the API.
- `pnpm nx test transport-api-e2e`: End-to-end tests.
- `pnpm nx lint transport-api`: Lint the API project.
- `pnpm format`: Prettier format across `apps/` and `packages/`.

## Coding Style & Naming Conventions
- Language: TypeScript, NestJS conventions.
- Indentation: 2 spaces.
- Formatting: Prettier (`pnpm format`).
- Linting: ESLint with Nx module boundary rules.
- Imports:
  - Prefer path aliases like `@transport/domain` over relative paths.
- Naming:
  - Files: `kebab-case.ts`
  - Classes: `PascalCase`
  - Functions/variables: `camelCase`

## Testing Guidelines
- Unit tests: Jest, co-located with source using `*.spec.ts`.
- E2E tests: Jest, files named `*.e2e-spec.ts` under `apps/transport-api-e2e/src/`.
- Run tests via Nx targets (see commands above).

## Commit & Pull Request Guidelines
Commit history is short and uses simple, sentence-case messages (e.g., “Setup with NX and DDD”). Keep commits concise and descriptive.
For pull requests:
- Include a brief summary of changes.
- Mention test commands run (e.g., `pnpm nx test transport-api`).
- Link related issues if applicable.

## Security & Configuration Notes
- Avoid committing secrets. Use environment variables for configuration.
- When adding new domains, mirror the `packages/<domain>/{domain,application,infrastructure}` layout and update `tsconfig.base.json` path aliases if needed.
