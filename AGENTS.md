# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains all TypeScript sources. Key domains: `core` (Turnkey client + secrets), `services` (custody, disbursement, tenant DB), `api` (Express server, routes, middleware), and `provisioner` (Turnkey provisioning flows).  
- `database/control-plane/` and `database/tenant-migrations/` hold SQL migrations for the multi-tenant architecture.  
- `docs/` provides architecture deep dives and operational playbooks.  
- `scripts/` hosts CLI utilities such as `init-control-plane.ts` and tenant provisioning tests.  
- Tests live alongside code in `src/**/__tests__` and `src/__tests__`.

## Build, Test, and Development Commands
- `npm install`: install dependencies. Run after pulling new package updates.  
- `npm run build`: type-check and emit compiled JS to `dist/`. Required before `npm start`.  
- `npm run dev` / `npm run start:dev`: start the Express API with ts-node for local iteration.  
- `npm run test`: execute Jest unit/integration tests.  
- `npm run lint` / `npm run format:check`: enforce ESLint and Prettier rules.  
- `npm run init-control-plane`: initialize the control-plane database (run once per environment).  
- `npm run test-tenant-provisioning`: exercise end-to-end tenant provisioning.

## Coding Style & Naming Conventions
- TypeScript, ESLint, and Prettier govern style. Use 2-space indentation and trailing commas per defaults.  
- File naming: kebab-case for scripts (`tenant-database-provisioner.ts`), PascalCase for classes, camelCase for variables/functions.  
- Keep modules cohesive; avoid cyclic imports between `core`, `services`, and `api`.

## Testing Guidelines
- Jest with ts-jest is configured; prefer co-locating tests in `__tests__` directories.  
- Name specs `<feature>.test.ts` or `<feature>.spec.ts`.  
- Mock external Turnkey calls with provided fixtures (see `src/__tests__/fixtures`).  
- Run `npm run test:coverage` when validating significant changes; aim to maintain existing coverage thresholds.

## Commit & Pull Request Guidelines
- Follow conventional, descriptive commit messages (e.g., `feat: add tenant connection registry`).  
- PRs should outline purpose, key changes, testing performed, and any rollout considerations (DB migrations, env vars).  
- Attach screenshots or logs when touching API contracts; link to Jira/GitHub issues when applicable.  
- Coordinate schema changes with the control-plane initialization script and note migration order in the PR description.

## Agent Workflow Expectations
- Think before coding: review surrounding modules, reuse existing types, and plan for edge cases before edits.  
- Prefer the simplest working solution (YAGNI); avoid introducing abstractions until required.  
- After any change run `npm run lint` and `npm run typecheck`; resolve errors immediately.  
- Never commit secrets or sample credentials. Validate inputs and follow security best practices for new endpoints.  
- Keep responses and code reviews concise, actionable, and focused on solving the task at hand.
