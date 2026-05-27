# AGENTS.md

## Project Overview
Pet Service is a fullstack pet service management app. The current codebase contains a React/Vite frontend and an Express backend backed by Prisma/PostgreSQL with optional Supabase integration.

## Repository Structure
- `frontend/`: React 18 + Vite app, UI components, app-level screens, Supabase browser client, frontend services.
- `backend/`: Express API, auth/customer routes, Prisma client, Supabase server client, database scripts.
- `backend/prisma/`: Prisma schema, migrations, and seed script.
- `docs/`: Mintlify documentation in `.mdx`.
- `.codex/`: Codex project configuration and AI coding rules.
- `.understand-anything/`: generated Understand Anything project graph artifacts.

## Code Rules
- Preserve existing logic and UI unless the task explicitly asks for behavior changes.
- Keep UI components in frontend component folders and API calls in service modules.
- Keep backend route handlers thin; business logic belongs in services.
- Use shared helpers instead of duplicating logic.
- Do not hardcode secrets, credentials, database URLs, API keys, or auth tokens.

## Command Rules
- Prefer PowerShell-compatible commands on Windows.
- Use `rg`/`rg --files` for search.
- Use package-specific commands:
  - `npm --prefix frontend run dev`
  - `npm --prefix frontend run build`
  - `npm --prefix backend run dev`
  - `npm --prefix backend run prisma:generate`
- Do not run destructive filesystem or Git commands unless explicitly requested by the user.

## Database Rules
- Prisma schema lives in `backend/prisma/schema.prisma`.
- Database provider is PostgreSQL.
- Do not change schema or migrations without updating `docs/database.mdx` and the session log.
- Do not commit real `DATABASE_URL` values.
- Run Prisma generation after schema changes.

## Git Rules
- Start by checking `git status --short`.
- Do not revert unrelated user changes.
- Keep commits small and focused when the user asks for commits.
- Never commit `.env`, `.codex/auth.json`, logs, local sessions, or generated secrets.

## Session Start
Before coding, AI agents must:
- Read `README.md`, `AGENTS.md`, `.codex/AGENTS.md`, and relevant docs in `docs/`.
- Inspect the requested module and nearby files.
- Run install/test/build only when needed and practical.
- Use Understand Anything before modifying unfamiliar architecture or module flows.

## Session End
Before ending a meaningful session, AI agents must:
- Run relevant format/lint/test/build/docs checks when practical.
- Update `docs/dev/session-log.mdx` or create a work log under `docs/work-logs/`.
- Update README or Mintlify docs if setup, architecture, API, database, deployment, or workflow changed.
- Report changed files, verification commands, remaining risks, and a suggested commit message.

## Mintlify Rules
- Mintlify docs live in `docs/`.
- Use `.mdx` for docs pages.
- Update `docs/docs.json` when adding, moving, or renaming docs pages.
- Run `npm run docs:check` after documentation navigation changes.

## Understand Anything Rules
- Use Understand Anything to map unfamiliar modules, frontend/backend/data flows, and cross-module dependencies.
- Treat generated analysis as guidance, then verify against source code.
- Update `docs/architecture.mdx` when analysis reveals important architecture not yet documented.
