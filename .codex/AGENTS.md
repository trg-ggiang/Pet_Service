# Codex Project Instructions

## Session Start
- Read `README.md`, root `AGENTS.md`, `.codex/AGENTS.md`, and the relevant files in `docs/` before making changes.
- Check `git status --short` and do not overwrite user changes.
- Inspect the target module with `rg`/file reads before editing.
- Use Understand Anything before changing unfamiliar modules or cross-cutting flows.

## Safety
- Do not commit secrets, tokens, API keys, auth files, `DATABASE_URL`, or `.env` files.
- Do not run destructive commands such as `git reset --hard`, recursive delete, or force checkout unless the user explicitly asks.
- Keep changes scoped to the requested task.
- Do not auto-commit.

## Windows Commands
- Prefer PowerShell-compatible commands.
- Use `npm --prefix frontend ...` and `npm --prefix backend ...` for package-specific commands.
- Use `npm run docs` for Mintlify local preview and `npm run docs:check` for validation.

## Documentation
- Update Mintlify docs in `docs/` when behavior, setup, architecture, API, database, deployment, or AI workflow changes.
- End each meaningful session by updating `docs/dev/session-log.mdx` or a work log under `docs/work-logs/`.
- Keep docs as `.mdx` inside `docs/` for Mintlify compatibility.

## Verification
- Run the smallest relevant verification first.
- For frontend changes, run `npm --prefix frontend run build` when practical.
- For backend changes, run relevant route/service checks and Prisma generation when schema/client changes.
- For docs changes, run `npm run docs:check`.
