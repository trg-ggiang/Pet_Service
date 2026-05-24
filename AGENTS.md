# AGENTS.md

This file is the main working agreement for AI agents in the Pet Service project. Follow it before making product, code, documentation, Git, testing, or release changes.

The project is still in early planning. Be conservative: read the docs, identify the phase, keep scope tight, and report exactly what changed.

## 1. Project Overview

Pet Service is an application/service for pet owners to find, manage, and request pet-related services.

Current MVP direction:

- Customers can manage basic profile information.
- Customers can manage pet information.
- Customers can view pet service listings.
- Customers can create a service request/booking.
- Customers can track request status.
- Service Providers and/or Admins can manage services and update request status at a basic level.

Expected roles:

- Guest: unauthenticated visitor.
- Customer: pet owner.
- Service Provider: person or business providing pet services.
- Admin: system administrator.

Out of MVP unless explicitly approved:

- Online payment.
- Realtime chat.
- Advanced reviews/ratings.
- AI recommendations.
- Native mobile app.
- Map/location integration.
- Advanced analytics dashboard.
- Voucher, loyalty, or marketing automation.

## 2. Tech Stack

The final tech stack has not been fully confirmed.

Current proposal from `docs/BRD.md`:

- Frontend: React or the framework already present in the project.
- Backend: Node.js with Express/NestJS or the framework already present in the project.
- Database: PostgreSQL.
- Auth: JWT or session-based authentication.
- API style: REST API for MVP.
- Config: environment variables for secrets and sensitive configuration.

Before making technical decisions, inspect the actual codebase and config files, especially:

- `package.json`
- `frontend/`
- `backend/`
- `docs/setup-guide.md`

If the actual codebase differs from the docs, state the mismatch and the assumption before changing code.

## 3. Read Docs Before Work

Before any medium or large task, read the relevant docs:

- `AGENTS.md`
- `docs/brief.md`
- `docs/BRD.md`
- `docs/plans/master-plan.md`
- The relevant phase file in `docs/plans/`
- `docs/setup-guide.md` for setup, run, build, deploy, or env work
- `docs/CHANGELOG.md` for user-facing, API, schema, config, or release changes
- `README.md` if it exists

For small docs-only tasks, still read the target file before editing.

If docs are missing, outdated, or contradictory, do not silently guess. Record the assumption in the response or update the correct doc if the task requires it.

## 4. Work By Phase

Use `docs/plans/master-plan.md` as the roadmap source of truth.

Current phases:

- Phase 01: Project setup
- Phase 02: Product scope confirmation
- Phase 03: Database design
- Phase 04: Authentication and authorization
- Phase 05: Customer core features
- Phase 06: Service Provider features
- Phase 07: Admin basic management
- Phase 08: UI polish and responsive
- Phase 09: Testing and manual QA
- Phase 10: Deployment preparation
- Phase 11: MVP release

Rules:

- Identify which phase the task belongs to before implementation.
- Read the phase file before working on that phase.
- Use the phase checklist to guide implementation and testing.
- Do not mark a phase `Done` unless its phase file's Done conditions are met.
- If a task belongs to a future phase, call that out and only proceed if the user's request clearly asks for it.

## 5. Plan Before Coding

Create a short plan before coding when the task:

- Touches multiple files.
- Changes API, database, auth, permissions, or business rules.
- Adds or changes a user flow.
- Affects setup, deploy, or environment config.
- Could expand scope or affect future phases.

The plan should include:

- Goal.
- In scope.
- Out of scope.
- Files/folders likely affected.
- Test approach.
- Risks or assumptions.

For very small tasks, a full plan is not required, but the change must still be focused and easy to review.

## 6. Do Not Expand Scope

Only implement what the user asked for and what the relevant phase supports.

Do not do these without explicit approval:

- Add post-MVP features.
- Refactor unrelated code.
- Replace frameworks, libraries, database, or auth approach.
- Change architecture.
- Reformat the whole codebase.
- Add new dependencies without a clear need.
- Modify unrelated files.

If you find an out-of-scope issue, mention it in the final report or work-log instead of fixing it automatically.

## 7. Update Docs

Docs must stay aligned with product and implementation changes.

Update the relevant docs when the task changes requirements, behavior, setup, schema, API, phase status, or release notes:

- `docs/brief.md`: product idea, user groups, value, MVP scope.
- `docs/BRD.md`: roles, flows, business rules, data requirements, security, tech stack.
- `docs/setup-guide.md`: install, run, build, env, deploy instructions.
- `docs/plans/master-plan.md`: phase status, Current Focus, Next Steps, roadmap changes.
- `docs/plans/phase-*.md`: phase scope, checklist, test, risks, Done conditions.
- `docs/work-logs/`: end-of-session work logs when appropriate.

If docs do not need updates, mention that briefly when relevant.

## 8. Update CHANGELOG.md

Update `docs/CHANGELOG.md` for important changes:

- Added feature.
- Changed user-visible behavior.
- Fixed important bug.
- Removed feature or behavior.
- Security change.
- API change.
- Database schema change.
- Auth or permission change.
- Setup, build, config, or deploy change.
- MVP or milestone release.

Use clear groups such as:

- `Added`
- `Changed`
- `Fixed`
- `Removed`
- `Security`
- `Docs`

Minor typo fixes and internal docs cleanup do not require changelog updates unless the user asks for them.

## 9. Update master-plan.md

Update `docs/plans/master-plan.md` when:

- A phase starts: set it to `In Progress`.
- A phase is completed: set it to `Done` only after Done conditions are met.
- A phase is blocked: set it to `Blocked` and record why.
- Current Focus changes.
- Next Steps change.
- Roadmap order or scope changes.

Do not update the master plan for tiny changes that do not affect roadmap or phase status.

## 10. Create Work-log At End Of Session

For meaningful work sessions, create a work-log in `docs/work-logs/`.

Suggested filename:

```text
docs/work-logs/YYYY-MM-DD-short-task-name.md
```

Work-log content:

- Date.
- Task summary.
- Related phase.
- Files created/changed/deleted.
- What was completed.
- Tests run or manual test instructions.
- Open issues, assumptions, or next steps.

Do not create a work-log if the user explicitly says to edit only one file or not to create additional files.

## 11. Security: Secrets And .env

Never hard-code or commit:

- Secret keys.
- API tokens.
- Passwords.
- Real database URLs.
- Private keys.
- Personal credentials.

Rules:

- Use environment variables or a secret manager.
- Do not commit real `.env` files.
- Only create `.env.example` with placeholder values.
- Do not print secrets in logs, UI, test output, docs, or final responses.
- If a secret is found in the repo, report it without repeating the secret value.
- Backend authorization must enforce role permissions; do not rely only on frontend checks.

## 12. Testing Rules

For code changes, run the relevant tests when available:

- Unit tests.
- Integration/API tests.
- Lint.
- Typecheck.
- Build.
- Manual flow testing.

Manual test instructions must include:

- How to run the app.
- Role/account needed, if applicable.
- Steps to perform.
- Expected result.

For docs-only tasks, manual testing can be simple:

- Open the edited file.
- Check headings.
- Check that the requested sections exist.
- Check that content matches the project docs and scope.

If tests cannot be run, say exactly what was not run and why.

## 13. Git Branch Rules

Respect the existing Git state.

Rules:

- Check `git status` before broad edits or code changes.
- Do not revert, reset, or overwrite someone else's changes without explicit instruction.
- Do not create commits unless the user asks.
- Do not create branches unless the user asks.
- Keep commits small and focused when commits are requested.
- Use clear branch names when branches are requested, for example:
  - `docs/update-agents`
  - `feature/auth`
  - `feature/customer-booking`
  - `fix/booking-permission`
- Never commit secrets, temporary build output, personal logs, or unapproved generated files.
- If conflicts or unclear external changes appear, stop and report the situation.

## 14. Completion Report Format

After completing a task, report in this structure:

```text
Done:
- Short summary of what was completed.

Files changed:
- path/to/file: short description

Test/check:
- Tests run or manual test instructions
- If tests were not run, explain why

Notes:
- Open issues, assumptions, or next steps if any
```

For docs-only work, explicitly say that no feature code was changed.

For one-file tasks, list only that file.

For blocked tasks, report:

- What was attempted.
- Why it is blocked.
- What information or decision is needed next.

