# AGENTS.md

## Project purpose

Societal Innovation Collaboration Portal is a production-style MVP for SIH Problem Statement 26043: "A digital platform to crowdsource societal challenges and facilitate collaborative problem solving through universities and industry partnerships."

The platform connects citizens, Panchayati Raj Institutions, community and government organizations, ministries, universities, higher education institutions, industries, startups, MSMEs, and CSR organizations. The Ministry retains visibility and final decision authority across the problem-to-impact lifecycle.

This repository is at **Phase 14 - MVP UI/UX and SIH Demonstration Polish**. Authentication/RBAC, organization onboarding/profile foundations, problem submission/lifecycle, advisory structured AI problem analysis, semantic university matching, university collaboration, industry collaboration, project delivery tracking, in-app notifications, the Ministry analytics dashboard, and the shared role-aware frontend experience are implemented. Backend behavior remains covered by the deterministic end-to-end journey.

## Technology stack

- Frontend: Next.js, TypeScript, and Tailwind CSS.
- Backend: Express.js and TypeScript.
- Database: PostgreSQL running locally through Docker.
- Vector search: PostgreSQL `pgvector` extension.
- ORM: Prisma unless a concrete pgvector limitation requires a narrowly scoped raw SQL solution.
- AI: OpenAI API, isolated behind dedicated backend AI services.
- Authentication: JWT with role-based access control.

## Architecture rules

Frontend and backend are separate applications. Backend business logic must never be placed in Next.js API routes.

The backend follows this direction of dependency:

```text
routes -> controllers -> services -> repositories/database
                       -> dedicated AI services when AI is needed
```

- Routes define HTTP wiring and middleware composition.
- Controllers translate HTTP requests and responses; they do not contain substantial business logic.
- Services own use cases, business rules, transactions, and domain orchestration.
- Repositories own persistence queries and database access.
- AI services own OpenAI calls, prompts, structured outputs, embeddings, and explanation handling.
- University matching services own searchable-source normalization, embedding synchronization, pgvector retrieval, grounded ranking, recommendation persistence, and duplicate detection; vector SQL stays inside repositories.
- Authentication services own password verification, JWT access tokens, and database-backed refresh-session rotation. Refresh tokens are delivered only through secure HTTP-only cookies.
- Authentication middleware reloads active users from the database before authorizing requests; role checks are enforced on the backend.
- Collaboration services own university invitation dispatch, university-scoped assignment access, team formation, proposal drafts/submission, industry proposal discovery, interest, funding, collaboration, and industry project views. Acceptance transactions and project/project-context creation stay in repositories.
- Project services own university-authorized delivery transitions, append-only project status history, milestones, progress updates, provider-neutral documents, impact measurements, and role-scoped project visibility.
- Notification services own recipient-scoped notification persistence, event fan-out, unread/read state, and refresh-based retrieval. Notification writes for lifecycle events stay inside the originating transaction where one exists.
- Analytics services own Ministry-only read models and SQL aggregation for overview KPIs, problem/organization/project/impact reporting. Analytics must not load complete tables into Node.js when PostgreSQL can aggregate efficiently.
- Domain concepts such as lifecycle state transitions must be explicit and reusable rather than duplicated string comparisons.
- Prefer small, focused, feature-based modules over large files with unrelated responsibilities.

## Folder organization

- `frontend/`: Next.js application, UI, client-side state, and API client code only.
- `backend/`: Express application, domain modules, services, repositories, middleware, and server-side integrations.
- `docs/`: Architecture, decisions, and project state. Keep documentation current as implementation changes.
- `docker/`: Local infrastructure support such as PostgreSQL initialization scripts.
- `docker-compose.yml`: Local PostgreSQL service definition.

As implementation begins, organize application code by feature/domain. Keep shared utilities narrowly scoped and avoid generic dumping-ground folders.

## Naming conventions

- Use TypeScript throughout frontend and backend.
- Use `PascalCase` for types, classes, React components, and enums/types that represent domain concepts.
- Use `camelCase` for variables, functions, service methods, and object properties.
- Use lowercase kebab-case for route paths and feature folders where practical.
- Use meaningful feature-based filenames, such as `problemLifecycle.service.ts` and `universityMatching.service.ts`.
- Use explicit domain names such as `MINISTRY_ADMIN`, `SUBMITTER`, `UNIVERSITY`, and `INDUSTRY`; do not introduce ambiguous aliases.

## Business rules

- Initial roles are `MINISTRY_ADMIN`, `SUBMITTER`, `UNIVERSITY`, and `INDUSTRY`.
- A submitter may have type `CITIZEN`, `PANCHAYATI_RAJ`, `ORGANIZATION`, `GOVERNMENT_ORGANIZATION`, or `OTHER`. Submitter type is separate from the authorization role.
- A submitter may create multiple problems.
- Personal/private matters, including family disputes or purely personal requests, are not valid societal innovation problems.
- Valid problems represent societal challenges that may be addressed through academic, technological, process, or collaborative work.
- AI validates and analyzes problems and may recommend universities, but AI never has final authority.
- Ministry administrators review AI analysis, approve or reject problems, manage recommended universities, approve selected universities, and send invitations.
- Universities and industries are normally created or approved by Ministry; they may also submit registration applications for Ministry review.
- University matching uses semantic search over university profiles, faculty, research areas, laboratories, facilities, innovation/incubation facilities, and previous projects.
- When one invited university accepts a problem, it becomes the accepted university and other pending invitations are cancelled. This must be implemented as a transaction safe against concurrent acceptance.
- Universities can form multidisciplinary teams with faculty mentors and research students, create proposals, and update project progress.
- Industries can discover submitted proposals and accept, support, or fund proposals.
- Ministry can monitor all projects; submitters can see a simplified lifecycle for their own problems.
- Every important lifecycle transition records current status, status history, actor, timestamp, and optional reason/comment. Do not rely only on a current status field.

The initial lifecycle states are:

`SUBMITTED`, `AI_VALIDATED`, `AI_REJECTED`, `MINISTRY_REVIEW`, `MINISTRY_APPROVED`, `MINISTRY_REJECTED`, `AI_UNIVERSITY_MATCHED`, `UNIVERSITIES_RECOMMENDED`, `MINISTRY_APPROVED_UNIVERSITIES`, `INVITATIONS_SENT`, `UNIVERSITY_ACCEPTED`, `UNIVERSITY_REJECTED`, `TEAM_FORMED`, `PROPOSAL_DRAFT`, `PROPOSAL_SUBMITTED`, `INDUSTRY_REVIEW`, `INDUSTRY_ACCEPTED`, `INDUSTRY_REJECTED`, `COLLABORATION_CONFIRMED`, `PROTOTYPE_DEVELOPMENT`, `FIELD_PILOT`, `IMPLEMENTATION`, `IMPACT_MEASURED`, and `COMPLETED`.

Lifecycle transitions must be defined in one domain state-machine module with authorization and transition validation. State history is append-only from the application's perspective.

## Security rules

- Never commit secrets, tokens, private keys, production credentials, or real personal data.
- Read secrets from environment variables or a secret manager; commit only safe example configuration when needed.
- Hash passwords with a suitable password-hashing algorithm; never store plaintext passwords.
- Verify JWT signatures, expiry, issuer/audience claims as appropriate, and role permissions on the backend.
- Use short-lived access tokens and revoke/rotate database-backed refresh sessions on logout and refresh-token use.
- Treat frontend role checks as UX only; enforce authorization on every protected backend operation.
- Validate and sanitize untrusted input at the API boundary.
- Apply least privilege to database and service credentials.
- Protect sensitive lifecycle and approval actions with explicit authorization and audit-friendly history.

## AI rules

- Keep OpenAI calls out of controllers and repositories.
- Use dedicated AI modules with typed request/response contracts, timeout/error handling, and observable failure behavior.
- AI validation must distinguish societal innovation challenges from personal/private issues.
- AI recommendations must be explainable: persist or return the relevant summary, criteria, and justification rather than an opaque ranking only.
- University recommendation evidence must reference persisted source type/source identity records returned by retrieval; LLM output cannot introduce unsupported evidence.
- AI output is advisory. Ministry decisions must be explicit and attributable to a Ministry actor.
- Do not send unnecessary sensitive personal data to external AI services.
- Embeddings and semantic retrieval must use PostgreSQL plus pgvector; use Prisma for normal persistence and carefully isolated raw SQL/unsupported-type handling only where required.

## Database rules

- PostgreSQL is the source of truth for application data.
- Use migrations for schema changes; never rely on an untracked manual database state.
- Keep transaction boundaries in services/use cases, especially for invitation acceptance and lifecycle transitions.
- Model status history as a first-class append-only record with actor and timestamp.
- Add foreign keys, uniqueness constraints, indexes, and check constraints where they express business invariants.
- Keep vector columns and similarity queries isolated behind repository methods.
- Do not commit local database volumes or `.env` files.

## Testing expectations

- Add unit tests for domain state transitions, authorization rules, validation, and AI response parsing.
- Add repository/integration tests against PostgreSQL for constraints, transactions, and pgvector search behavior.
- Add API tests for protected routes and role boundaries.
- Add frontend tests for important user flows and accessible interaction behavior.
- Run relevant format, lint, typecheck, unit, integration, and build checks before declaring a change verified.
- Tests must cover concurrent university acceptance and cancellation of pending invitations.

## Documentation maintenance

- Keep `README.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, and `docs/PROJECT_STATE.md` synchronized with the repository.
- Mark work as implemented only after it exists and has been verified.
- Record meaningful architectural changes in `docs/DECISIONS.md`.
- Update `docs/PROJECT_STATE.md` with the current phase, completed/in-progress/next work, known issues, and exact verification commands/results.
- Avoid creating additional documentation files unless a clear project need emerges.
