# SIH Demonstration Runbook

This runbook targets the current local MVP. It uses synthetic development accounts and data only.

## 1. Prerequisites

- Node.js and npm
- Docker Desktop with the Linux engine running
- Ports `3000`, `4000`, `55432`, and `5555` available, or adjust them deliberately

## 2. Environment Setup

From the repository root:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
```

Use development-only values. For the default Docker setup, set the root `.env` values to:

```text
POSTGRES_USER=sicip_dev
POSTGRES_PASSWORD=local_placeholder_only
POSTGRES_DB=sicip_dev
POSTGRES_PORT=55432
```

In `backend/.env`, set `DATABASE_URL` to:

```text
DATABASE_URL="postgresql://sicip_dev:local_placeholder_only@localhost:55432/sicip_dev?schema=public"
```

Set a local JWT secret of at least 32 characters. `OPENAI_API_KEY` may remain unset for the deterministic development AI gate and matching providers. Set `UPVOTE_THRESHOLD=3` (or another local demo value). SMTP variables may remain unset for dashboard-only notifications. Never commit either `.env` file.

## 3. Start PostgreSQL

From the repository root:

```powershell
docker compose up -d
docker compose ps
```

Expected: `societal-innovation-postgres` is `healthy` and maps host port `55432` to container port `5432`.

## 4. Database Setup

From `backend/`:

```powershell
npm.cmd install
npm.cmd exec -- prisma generate
npm.cmd exec -- prisma migrate deploy
npm.cmd run db:seed
```

The seed is idempotent and uses deterministic synthetic IDs. It prints the development password; the current seed password is `DevOnly-Portal-123!`.

## 5. Prisma Commands

From `backend/`:

```powershell
npm.cmd run prisma:validate
npm.cmd exec -- prisma migrate status
npm.cmd run prisma:studio
```

From the repository root, the clean wrapper is:

```powershell
npm.cmd run prisma:studio
```

Studio opens at `http://localhost:5555`. The wrapper delegates into `backend`, where `backend/.env` and `backend/prisma/schema.prisma` are loaded. Stop it with `Ctrl+C` when finished.

## 6. Start the Backend

From `backend/`:

```powershell
npm.cmd run dev
```

Expected health check: `http://localhost:4000/api/health` returns API and database status.

## 7. Start the Frontend

In a second terminal, from `frontend/`:

```powershell
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`.

## 8. Demo Accounts

| Role                     | Email                              | Password              | Use                                           |
| ------------------------ | ---------------------------------- | --------------------- | --------------------------------------------- |
| Ministry administrator   | `ministry.admin@example.test`      | `DevOnly-Portal-123!` | Review, match, applications, analytics        |
| Submitter/citizen        | `citizen.rahul@example.test`       | `DevOnly-Portal-123!` | Individual problem submission and tracking    |
| Submitter/Panchayati Raj | `panchayat.barkagaon@example.test` | `DevOnly-Portal-123!` | Community/local-government problem submission |
| Submitter/organization   | `org.jrdf@example.test`            | `DevOnly-Portal-123!` | Organization problem submission               |
| University               | `university.water@example.test`    | `DevOnly-Portal-123!` | Water research and collaboration demo         |
| University               | `university.agri@example.test`     | `DevOnly-Portal-123!` | Agriculture matching demo                     |
| University               | `university.embedded@example.test` | `DevOnly-Portal-123!` | Embedded/IoT matching demo                    |
| Industry/startup         | `industry.aqua@example.test`       | `DevOnly-Portal-123!` | Water technology support demo                 |
| Industry/startup         | `industry.green@example.test`      | `DevOnly-Portal-123!` | Rural sustainability support demo             |
| Industry                 | `industry.digital@example.test`    | `DevOnly-Portal-123!` | AI and digital support demo                   |

These credentials are synthetic and local-only. The login selector must match the account category; the backend still authorizes using the persisted database role.

The complete account table is available in [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md). Rerun `npm.cmd run db:seed` from `backend/` for a clean development database; the guarded seed produces exactly 10 authenticated users, 3 universities, and 3 industries.

## 9. Exact Demo Flow

| Step | Browser/account         | Action                                                                    | Expected result                                                                            |
| ---: | ----------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
|    1 | Submitter               | Sign in and open `/my-problems`                                           | Submitter workspace loads                                                                  |
|    2 | Submitter               | Create a societal challenge                                               | AI validation runs first; valid submissions become `AI_VALIDATED`, while rejected submissions stay out of community and Ministry views |
|    3 | Submitter accounts      | Open `/my-problems`, review community posts, and support from another submitter account | Support count is visible; self-support and duplicate support are blocked |
|    4 | Submitter accounts      | Reach `UPVOTE_THRESHOLD` support                                           | Problem moves to `MINISTRY_REVIEW` and Ministry receives the handoff notification; upvotes do not approve it |
|    5 | Ministry                | Open `/ministry/problems` and choose `MINISTRY_APPROVED` or `MINISTRY_REJECTED` | Ministry makes the final decision and the transition is written to status history |
|    6 | Ministry                | Run matching and review recommendations                                   | `AI_UNIVERSITY_MATCHED` then `UNIVERSITIES_RECOMMENDED`; evidence and scores are visible   |
|    7 | Ministry                | Remove one recommendation, approve the final list, then click `Send invitations to approved universities` | Approved assignments become `INVITED`; universities receive notifications                  |
|    8 | Two university sessions | Accept the same problem at nearly the same time                           | Exactly one acceptance succeeds; competing pending assignment is `CANCELLED`               |
|    9 | Winning university      | Save a faculty mentor and research members                                | `ProjectTeam` and `TeamMember` rows exist; problem becomes `TEAM_FORMED`                   |
|   10 | Winning university      | Save proposal draft, then submit it                                       | Proposal becomes `SUBMITTED`; industry can now discover it                                 |
|   11 | Industry                | Open `/industry`, filter/view proposal, express interest                  | Industry view/interest is stored; duplicate interest is rejected                           |
|   12 | Industry                | Accept the interest and optionally record funding                         | Collaboration is confirmed and a project is created; no payment occurs                     |
|   13 | University              | Open `/projects`, create milestone, post update/document                  | Project delivery records and stakeholder notifications appear                              |
|   14 | University              | Move project through prototype, pilot, implementation, impact, completion | Project and mirrored problem state histories are appended                                  |
|   15 | Industry/Ministry       | Open `/projects`                                                          | Supported project progress is visible                                                      |
|   16 | Submitter               | Open `/my-problems` and the problem detail                                | Simplified lifecycle and timeline are visible; private other-user data is not              |
|   17 | Ministry                | Open `/ministry/analytics` and `/notifications`                           | Completion, impact, and notification metrics are reflected                                 |

The deterministic automated equivalent is the Phase 13 `mvp.integration.test.ts` scenario and does not require a live OpenAI key.

## 10. Inspect Database Records

- Open Studio at `http://localhost:5555` using the root or backend Studio command above.
- For a read-only PostgreSQL check:

```powershell
docker exec societal-innovation-postgres psql -U sicip_dev -d sicip_dev -c 'SELECT extname, extversion FROM pg_extension WHERE extname = ''vector'';'
```

- Useful tables include `User`, `Problem`, `ProblemStatusHistory`, `ProblemAIAnalysis`, `UniversityKnowledgeEmbedding`, `ProblemUniversityMatch`, `UniversityProblemAssignment`, `Proposal`, `IndustryCollaboration`, `Project`, `ProjectMilestone`, `ProjectUpdate`, `ImpactMeasurement`, and `Notification`.

## 11. Safe Development Reset

Do not reset merely to fix a command. The seed is idempotent and integration tests use isolated fixtures. To preserve the Docker volume while stopping the database:

```powershell
docker compose down
```

For a deliberately disposable local database only, from `backend/`:

```powershell
npm.cmd exec -- prisma migrate reset --force
npm.cmd run db:seed
```

`prisma migrate reset` deletes development data. Never run it against a shared or production database.

## 12. Troubleshooting

- **Prisma says no database URL:** run `npm.cmd run prisma:studio` from the repository root or run Prisma from `backend/`. Confirm `backend/.env` exists and contains `DATABASE_URL`; do not create a duplicate root Prisma environment file.
- **Database URL points to the wrong port:** Docker Compose publishes host port `55432` in the demonstrated setup, while PostgreSQL listens on container port `5432`.
- **Docker permission or engine error:** start Docker Desktop's Linux engine, then rerun `docker compose ps`.
- **Backend refuses to start:** validate `DATABASE_URL` and ensure `JWT_SECRET` has at least 32 characters. `OPENAI_API_KEY` is optional for local fallback/failure-path demonstrations.
- **Studio port is busy:** stop the existing Studio process or run `cd backend; npm.cmd run prisma:studio -- --port 5566 --browser none`.
- **Frontend cannot reach the API:** confirm backend port `4000` and `FRONTEND_URL=http://localhost:3000`.
- **No AI result appears:** inspect the problem's analysis status. The development provider is used when no key is configured; if a live provider fails, add a valid key and use Ministry retry. Failed analysis keeps the problem out of community and Ministry review until it completes.
