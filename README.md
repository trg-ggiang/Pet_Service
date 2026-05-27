# Pet Service

Pet Service is a fullstack pet service management app for customer, staff, doctor, and admin workflows.

## Tech Stack
- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Radix UI, MUI, Supabase browser client.
- Backend: Node.js, Express 5, Prisma, Supabase server client, JWT, bcrypt.
- Database: PostgreSQL via Prisma. Supabase can provide hosted PostgreSQL and auth/storage services.
- Docs: Mintlify in `docs/`.
- AI workflow: Codex plus Understand Anything.

## Requirements
- Node.js and npm.
- PostgreSQL or a Supabase project for database access.
- Mintlify CLI available through `npx` or local installation.
- Windows PowerShell is the expected shell for this repo.

## Clone
```powershell
git clone <repo-url>
cd Pet_Sevice
```

## Environment
Create local env files from examples and fill in real values locally only:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.local.example frontend/.env.local
```

Do not commit `.env`, database URLs, JWT secrets, Supabase service role keys, or auth files.

## Install
```powershell
npm install
npm --prefix frontend install
npm --prefix backend install
```

## Run Development
Frontend:

```powershell
npm run dev:frontend
```

Backend:

```powershell
npm run dev:backend
```

Default ports:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5050`
- Backend health check: `http://localhost:5050/api/health`

## Database
Prisma schema is in `backend/prisma/schema.prisma`.

```powershell
npm --prefix backend run prisma:generate
```

Migration and seed commands need the team to confirm the production-safe workflow before standardizing them. Current seed file: `backend/prisma/seed.js`.

## Mintlify Docs
Run docs locally:

```powershell
npm run docs
```

Validate docs:

```powershell
npm run docs:check
```

Docs source lives in `docs/` and should use `.mdx`.

## Codex Workflow
- Read `README.md`, `AGENTS.md`, `.codex/AGENTS.md`, and relevant docs before editing.
- Keep changes small and scoped.
- Never hardcode secrets.
- Update docs when setup, architecture, API, database, deployment, or workflow changes.
- End sessions by updating `docs/dev/session-log.mdx` or a work log.

## Understand Anything
Use Understand Anything before changing unfamiliar modules. Generate or inspect the code graph to understand frontend/backend/database flow, then verify findings against source code before editing. If the analysis reveals new architecture, update `docs/architecture.mdx`.

## Team Git Workflow
1. Pull the latest code before starting.
2. Create a focused branch for each task.
3. Run the smallest relevant check before opening a PR.
4. Update docs and session log for meaningful changes.
5. Do not commit secrets, local auth files, or generated logs.
