# Societal Innovation Collaboration Portal

Societal Innovation Collaboration Portal is a production-style MVP demonstration system for SIH Problem Statement 26043:

> A digital platform to crowdsource societal challenges and facilitate collaborative problem solving through universities and industry partnerships.

The portal will connect problem submitters, Ministry administrators, universities, higher education institutions, industries, startups, MSMEs, and CSR organizations through a Ministry-governed problem-to-impact lifecycle.

## Status

The repository is currently in **Phase 14 - MVP UI/UX and SIH Demonstration Polish**. The Prisma schema, migrations, pgvector setup, Express bootstrap, authentication/RBAC, organization onboarding, problem submission/lifecycle APIs, advisory structured AI analysis, semantic university matching, university/industry collaboration, project delivery tracking, in-app notifications, Ministry analytics, and the shared role-aware frontend experience are implemented. Backend behavior is covered by a deterministic end-to-end scenario.

## Architecture overview

The system has separate Next.js and Express.js applications. The frontend consumes backend APIs and keeps access tokens in memory while refresh tokens remain HTTP-only cookies. The backend uses routes, controllers, services, repositories, and dedicated middleware/modules for authentication/RBAC and problem lifecycle management. PostgreSQL with pgvector provides transactional storage and future semantic retrieval.

## Technology stack

- Next.js, TypeScript, and Tailwind CSS for the frontend
- Express.js and TypeScript for the backend
- PostgreSQL in Docker for local development
- pgvector for semantic university/proposal matching
- Prisma as the ORM, with isolated raw SQL only if required for vector operations
- OpenAI API for explainable validation, extraction, and recommendations; deterministic development providers support local demos without a key
- JWT authentication and backend-enforced role-based access control

## Authentication foundation

The backend exposes `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, and `GET /api/auth/me`. Access tokens are short-lived JWTs; refresh sessions are stored as hashes and rotated through an HTTP-only cookie. Role authorization is enforced by backend middleware.

## Current and planned modules

- Problem submission, provider-neutral evidence references, submitter privacy, and lifecycle history (implemented)
- AI-gated validated community posts, one-support-per-submitter rules, configurable threshold handoff, and optional SMTP email notifications (implemented)
- Authentication, RBAC, organization registration, and structured university/industry profiles (implemented)
- AI problem validation and structured analysis
- Ministry review transition (implemented) and broader decision workflows
- Structured advisory AI problem analysis with persisted failures and retry (implemented)
- University profile indexing, pgvector matching, grounded recommendations, and duplicate detection (implemented)
- Ministry recommendation approval/removal and manual addition (implemented)
- Ministry invitation dispatch, university-scoped assignment responses, team formation, and proposal drafts/submission (implemented)
- Industry proposal discovery limited to eligible submitted/under-review proposals, filtering, interest, support, funding, collaboration confirmation, and project monitoring (implemented)
- Project progress, field pilots, implementation, and impact measurement (implemented)
- In-app notifications for lifecycle, collaboration, invitation, proposal-interest, and project events
- Ministry-only analytics API with SQL-backed overview, problem, organization, project, and impact aggregation
- Modular Ministry control dashboard with KPI cards, charts, organization tables, and navigation
- Lifecycle history, auditability, dashboards, notifications, and reporting

## Local development prerequisites

The planned development environment requires:

- Node.js and npm
- Docker Desktop with Docker Compose
- PostgreSQL-compatible local container support with pgvector (provided by `docker-compose.yml`)
- OpenAI API access for live AI analysis (optional for local deterministic development)

Create a local `.env` file with the PostgreSQL variables expected by Docker Compose before starting the database. Do not commit it.

## Backend database commands

From `backend/`, copy `.env.example` to `.env`, set a local `DATABASE_URL`, install dependencies, and use the following commands:

```text
npm.cmd install
npm.cmd run prisma:format
npm.cmd run prisma:validate
npm.cmd exec -- prisma migrate dev --name <migration-name>
npm.cmd run db:seed
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

From the repository root, `npm.cmd run prisma:studio` delegates to the backend Prisma configuration and opens Studio without requiring a duplicate root Prisma environment file.

For Phase 7 local matching verification, run `docker compose up -d`, apply migrations with `DATABASE_URL=<local-url> npm.cmd exec -- prisma migrate deploy`, seed with `DATABASE_URL=<local-url> npm.cmd run db:seed`, then start the backend with `npm.cmd run dev`. Ministry clients can index approved universities with `POST /api/university-matching/knowledge/index` and match an approved problem with `POST /api/university-matching/problems/<problem-id>/match`. Without `OPENAI_API_KEY`, non-production matching uses deterministic local embeddings/ranking; production uses the configured OpenAI providers.

For Phase 8 collaboration, after Ministry approves matching records, send invitations with `POST /api/collaboration/problems/<problem-id>/invitations` and body `{ "matchIds": ["<match-id>"] }`. University accounts use `/api/collaboration/university/assignments` for invitation responses, teams, and proposals.

For Phase 9 industry collaboration, approved industry accounts use `/api/collaboration/industry/proposals` for filtered discovery, `/proposals/<proposal-id>/interests` to express support, `/interests/<interest-id>/accept` to confirm support and create a project, plus `/interests`, `/collaborations`, and `/projects` for their own tracking. Funding is recorded for planning purposes only; no payment processing is implemented.

With Docker/PostgreSQL running, execute the real transaction/concurrency test with `$env:RUN_COLLABORATION_INTEGRATION='true'; $env:DATABASE_URL='<local-url>'; npm.cmd test -- university-assignment.integration`. The test uses isolated synthetic fixtures and cleans them up.

For Phase 9 database-backed verification, set `$env:RUN_INDUSTRY_INTEGRATION='true'` with the same local `DATABASE_URL` and run `npm.cmd test -- industryCollaboration.integration`. The test creates and removes isolated synthetic industries, proposals, interests, funding records, and projects.

For Phase 10 project verification, set `$env:RUN_COLLABORATION_INTEGRATION='true'; $env:RUN_INDUSTRY_INTEGRATION='true'; $env:DATABASE_URL='<local-url>'` and run `npm.cmd test`. This covers project access isolation, delivery transitions, milestones, updates/documents, and impact records using synthetic PostgreSQL fixtures.

For Phase 11 notification verification, set `$env:RUN_NOTIFICATION_INTEGRATION='true'` with the same local `DATABASE_URL` and run `npm.cmd test`. Notification APIs are `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/<notification-id>/read`, and `POST /api/notifications/read-all`.

For community-gated problem intake, set `UPVOTE_THRESHOLD=3` in `backend/.env`. A completed development or OpenAI analysis publishes valid problems to the submitter community feed; supporters use `GET /api/community/problems` and `POST /api/community/problems/<problem-id>/upvote`. SMTP variables are optional; unset them for dashboard-only notifications.

For Phase 12 Ministry analytics, run the migrations and seed, start the backend, sign in as the synthetic Ministry account, and open `http://localhost:3000/ministry/analytics`. The protected API is `GET /api/analytics/ministry`; it uses PostgreSQL aggregation and returns overview KPIs, problem trends, university/industry participation, project stages, and impact metrics. Industry proposal-detail access creates one deduplicated view event per industry/proposal pair for discovery analytics.

For Phase 13 integration verification, start Docker Desktop and run the migrations and seed, then from `backend/` execute `$env:DATABASE_URL='<local-url>'; $env:RUN_E2E_INTEGRATION='true'; $env:RUN_COLLABORATION_INTEGRATION='true'; $env:RUN_INDUSTRY_INTEGRATION='true'; $env:RUN_NOTIFICATION_INTEGRATION='true'; npm.cmd test`. The E2E test uses deterministic mock AI providers and isolated synthetic records; it does not require `OPENAI_API_KEY`.

The Express foundation can be started with `npm.cmd run dev` or built with `npm.cmd run build` and started with `npm.cmd start`. The seeded development accounts use synthetic `.test` addresses and the password printed by the seed command; do not reuse it outside local development.

## Frontend commands

From `frontend/`:

```text
npm.cmd install
npm.cmd run dev
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

The frontend defaults to `http://localhost:4000/api`; set `NEXT_PUBLIC_API_URL` when the backend runs elsewhere. No frontend test suite is configured yet.
