# Architecture

## Status

This document describes the architecture at Phase 14. The database/domain, Express infrastructure, authentication/RBAC, organization registration, structured organization profiles, problem intake/lifecycle, advisory AI analysis, semantic university matching, university/industry collaboration, project delivery tracking, in-app notifications, Ministry analytics, and the shared role-aware frontend experience are implemented. Backend behavior is verified against local PostgreSQL, including the deterministic end-to-end journey.

## Frontend (implemented Phases 5-14 slices; broader UI planned)

The frontend is a standalone Next.js application written in TypeScript and styled with Tailwind CSS. Implemented slices include login, submitter problem form/list/detail/timeline, the Ministry problem-intelligence workspace with semantic university recommendations and review actions, a university workspace for assigned problems, invitation response, team management, proposal drafting/submission, an industry workspace for proposal discovery/filtering/support/collaboration, a project delivery workspace, a refresh-based notification indicator/list, and a modular Ministry analytics dashboard. The analytics UI uses reusable KPI cards, bar lists, time-series visualization, decision/impact panels, and participation tables.

The frontend will not contain authoritative business rules, OpenAI calls, database access, or backend API routes for this product.

## Backend foundation and initial modules (implemented; broader modules planned)

The backend is a standalone Express.js application written in TypeScript. The implemented bootstrap includes environment validation, security middleware, JSON/urlencoded request limits, request IDs, API response envelopes, centralized errors, 404 handling, and graceful database disconnect handling. Authentication, registration-management, organization-profile, problem intake/lifecycle, problem intelligence, and university matching endpoints are implemented separately from future collaboration APIs.

Its feature modules follow:

```text
HTTP routes -> controllers -> application/domain services -> repositories
                                             -> AI services where applicable
```

Controllers will translate HTTP concerns. Services will own use cases, authorization-aware orchestration, transactions, and business rules. Repositories will own persistence access. The problem feature follows this layering in `problem.routes.ts`, `problem.controller.ts`, `problem.service.ts`, and `problem.repository.ts`.

The current health flow is:

```text
server -> app -> middleware -> health route -> controller -> service -> repository -> Prisma
```

### Backend layering and authentication

Feature routes compose validation and authorization middleware before calling thin controllers. Controllers translate HTTP input/output and delegate to services. Services own authentication use cases, password verification, token issuance, refresh-session rotation, and logout invalidation. Repositories own user and refresh-session queries. `authenticate` verifies a short-lived JWT and reloads the active user; `requireRole` enforces the requested role. Access tokens are returned in the response envelope, while refresh tokens are opaque values stored only as SHA-256 hashes in PostgreSQL and delivered through an HTTP-only cookie.

`createApp` accepts environment and service dependencies so infrastructure tests can exercise HTTP behavior without requiring a live database. Matching route dependencies also accept replaceable embedding and ranking providers for deterministic tests and local development.

## Database (implemented)

PostgreSQL runs locally through Docker using a pgvector-capable image. The initialization script enables the `vector` extension. The initial Prisma schema, migrations, indexes, constraints, and application data model are implemented and verified for the MVP foundation.

The initial Prisma schema and migrations now model users and refresh sessions, onboarding flags, submitter profiles/types, structured problem intake fields, provider-neutral problem evidence metadata, problem categories, AI analysis attempts/results, university capabilities and searchable knowledge embeddings, industry expertise/interests/support capabilities, explainable university matches, university invitations/assignments, accepted-university project contexts, teams, proposals/documents, industry interests/collaborations/funding, projects/milestones/updates/documents/impact measurements, registration applications/documents, notifications, and append-only problem status history.

### Entity relationships

- `User` stores authentication and role data once. `SubmitterProfile`, `University`, and `Industry` hold role-specific profile/organization data; university and industry users reference their organization rather than duplicating credentials.
- A `SubmitterProfile` owns many `Problem` records. Problems can have evidence, category/AI analyses, status history, matching records, assignments, teams, and proposals.
- `University` capability records cover faculty, research areas, laboratories, facilities, previous projects, and `UniversityKnowledgeEmbedding` rows. `ProblemUniversityMatch` stores score, rank, justification, metadata, and evidence; `UniversityProblemAssignment` stores the invitation state separately.
- A problem may have one team per university in the schema, with typed members. A university proposal is separate from the later `Project` and is linked to a team where applicable.
- Industries express proposal interest and may have collaborations with multiple funding records. A project starts after collaboration/support decisions and owns milestones, updates, documents, and impact measurements.
- Registration applications support Ministry review before an organization profile is approved. Ministry-created accounts are linked to the created organization in one transaction; approved self-registration applications reuse and activate the applicant account instead of creating a duplicate user. Notifications target authenticated users.

The schema uses foreign keys, composite uniqueness, indexes, timestamps, and explicit delete behavior. The partial unique assignment index and acceptance transaction enforce one accepted university per problem. The application layer still enforces role/profile consistency and lifecycle transition authorization.

## AI layer (implemented Phases 6-7)

Dedicated backend AI services wrap the OpenAI API. The Phase 6 problem-analysis pipeline is:

```text
problem submission -> structured LLM validation/extraction
       -> Zod validation -> persisted advisory analysis attempt/result
```

The Phase 7 university-matching pipeline is:

```text
university profile sources -> normalized searchable text -> embeddings -> pgvector
problem -> embedding -> cosine retrieval -> grouped candidate evidence
       -> structured LLM/development ranking -> grounded recommendations
```

`OpenAiProblemAnalysisProvider` and `OpenAiUniversityRankingProvider` send only the information required for analysis/ranking, request strict JSON Schema responses, and validate results again with Zod. `OpenAiEmbeddingProvider` calls the embeddings endpoint with a fixed 1,536-dimension contract. Prompts and schemas are isolated under `backend/src/ai/`. Problem analysis and university matching runs persist processing status, model metadata, safe failure reasons, and retryable attempts.

AI provides validation, categorization, extraction, and explanations. On submission, a completed advisory result may move a problem to AI_VALIDATED or AI_REJECTED. A failed or pending analysis leaves it at SUBMITTED and can be retried. AI never approves or rejects a problem on behalf of the Ministry. Validated problems are published to the submitter community feed, and only the configured support threshold makes them eligible for Ministry review. Ministry approval/rejection remains an explicit, attributable lifecycle action.

When `OPENAI_API_KEY` is absent, non-production problem intake and university matching use deterministic development providers so local demonstrations remain runnable; production uses the OpenAI providers and records failures as retryable runs when unavailable. Tests inject providers and do not require an external API key. The frontend never receives the API key.

## Authentication and RBAC (implemented foundation; account onboarding implemented)

The backend authenticates users with bcrypt password verification and JWT access tokens, and enforces role-based permissions for `MINISTRY_ADMIN`, `SUBMITTER`, `UNIVERSITY`, and `INDUSTRY`. Refresh sessions are database-backed, rotated on use, and revocable on logout. `GET /api/auth/me` returns a safe public user representation without password hashes. Ministry-created organization accounts receive generated temporary credentials and `mustChangePassword`/`mustCompleteProfile` flags; the protected password-change and profile-update flows clear those flags independently. Frontend route visibility will be treated as a usability concern only; backend authorization is authoritative. Submitter types remain profile data separate from the authorization role. Organization onboarding is implemented for Phase 4; password reset and broader account administration remain planned.

## Registration management and organization profiles (implemented)

`/api/registrations` contains Ministry-only account creation and application review endpoints, plus role-restricted self-registration submission. Applications carry typed organization data in `applicationData`, use the `PENDING`/`APPROVED`/`REJECTED` workflow, and record reviewer/reason timestamps. Approval claims a pending application transactionally, creates the appropriate approved organization, links the existing applicant user, and stores the approved organization ID on the application. Conditional pending uniqueness prevents duplicate applications by one applicant and target type.

`/api/organizations/university/profile` and `/api/organizations/industry/profile` expose own-organization GET/PUT operations. University faculty, research areas, laboratories, facilities, and previous projects are stored as structured relational records. Industry expertise, interest areas, and support capabilities are stored as structured relational records. Phase 7 indexes approved university records into traceable `UniversityKnowledgeEmbedding` rows.

## Problem intake and lifecycle (implemented Phase 5 slice)

Submitters can create multiple problems with structured location, priority, context, desired outcome, supporting information, and evidence references. Evidence stores a type plus either a provider-neutral storageKey or an externalUrl; binary upload handling is intentionally deferred until a storage provider abstraction is introduced. Completed submission analysis gates community publication. The submitter community API exposes only AI_VALIDATED problems, records at most one active upvote or downvote per submitter, prevents self-voting, hides downvote totals from other submitters, and hands a problem to Ministry at the configured upvote threshold. A submitter may change direction or remove their active vote; threshold eligibility remains an explicit Ministry decision. Ministry list/detail queries exclude pre-threshold intake states. Upvotes and downvotes are separate persisted records guarded by unique constraints and a PostgreSQL transaction-scoped advisory lock per problem.

Submitter list/detail/timeline queries are always scoped by the authenticated submitter profile. Ministry list/detail/timeline queries have the privileged all-problems view and support status, category, district, and block filters. Other roles cannot use these operations.

Creation and status changes are service/repository use cases. Creation writes the initial `SUBMITTED` status-history record in the same transaction as the problem. Ministry review transitions use the centralized lifecycle transition map and a conditional status update inside a transaction before appending history, preventing arbitrary or stale transitions. AI analysis is a separate Ministry-triggered advisory operation and does not automatically transition or approve a problem.

## Lifecycle management (implemented through Phase 10)

Prisma enums represent the persisted lifecycle vocabulary, and `backend/src/domain/lifecycle.ts` provides TypeScript status constants, types, allowed problem transitions, and actor-aware transition validation. Phase 7 adds AI-authorized matching transitions and Ministry recommendation approval. Phase 8 adds Ministry invitation dispatch plus university-authorized invitation acceptance/rejection, team formation, proposal draft, and proposal submission transitions. Phase 9 adds industry-authorized review, acceptance, and collaboration-confirmed transitions. Phase 10 adds a separate project state machine for operational delivery, append-only `ProjectStatusHistory`, transaction-safe university transitions, and project progress records.

The lifecycle supports:

`SUBMITTED` -> AI validation -> community support -> threshold eligibility -> Ministry review/decision -> university matching/recommendation -> Ministry university approval -> invitations -> one accepted university -> team -> proposal -> industry collaboration -> prototype -> field pilot -> implementation -> impact measurement -> completion.

Every important transition will append a status-history record containing old status, new status, actor, timestamp, and optional reason/metadata. The accepted-university operation will use a transaction and the `UniversityProblemAssignment_one_accepted_per_problem_idx` partial unique index so concurrent acceptances cannot produce multiple accepted universities. The constraint has been verified with a rolled-back transaction test.

## Semantic search and matching (implemented Phase 7 slice)

`UniversityKnowledgeEmbedding` stores the university owner, source type, source record ID, source content, embedding model, dimensions, and optional metadata. `ProblemEmbedding` stores the normalized problem representation. Both vector fields use Prisma `Unsupported("vector")`; parameterized vector writes, cosine retrieval, and vector indexes remain isolated in `university-matching.repository.ts`. `UniversityMatchingRun` records processing state/failures; `ProblemUniversityMatch` stores rank, score, grounded evidence, generated time, and Ministry decision fields. Approved universities are searchable by profile, faculty, research area, lab, facility, and previous project source types. Duplicate detection reuses problem embeddings and only reports candidates; it never merges or rejects automatically.

The Ministry-only matching API is exposed under `/api/university-matching`: `POST /knowledge/index`, `POST /problems/:problemId/match`, `POST /problems/:problemId/match/retry`, `GET /problems/:problemId/recommendations`, `GET /problems/:problemId/duplicates`, `POST /problems/:problemId/recommendations/approve`, `POST /problems/:problemId/recommendations/:matchId/remove`, and `POST /problems/:problemId/recommendations/add/:universityId`. Collaboration routes expose Ministry invitation dispatch/listing, university-scoped assignments/team/proposal management, and Phase 9 industry discovery/interest/collaboration/project operations under `/api/collaboration`.

## University collaboration (implemented Phase 8 slice)

Ministry may dispatch invitations only from approved recommendation records. Assignment reads are scoped through the authenticated university organization. Acceptance runs in one database transaction: the assignment is conditionally changed to `ACCEPTED`, the problem transitions to `UNIVERSITY_ACCEPTED`, other pending/invited assignments are cancelled, a `UniversityProjectContext` is created, and status history is appended. The existing partial unique index on accepted assignments prevents a concurrent second acceptance; unique conflicts are returned as a safe conflict response.

The accepted university can create/update one team with a required faculty mentor and research members. A team creates the `TEAM_FORMED` lifecycle transition. A team can create/update a `DRAFT` proposal with structured solution, planning, resource, budget, support-type, and impact fields, then submit it to transition the problem to `PROPOSAL_SUBMITTED`.

## Industry collaboration (implemented Phase 9)

Approved industry users can discover proposals whose proposal/problem states are eligible for industry review. Repository filters cover domain, technology, university, required-expertise text, budget range, and structured requested support types. Proposal details expose university/team evidence without exposing another industry's interest message.

Each industry can create at most one `IndustryProposalInterest` per proposal. An industry can accept only its own pending interest. In one transaction, the repository advances the problem through `INDUSTRY_REVIEW`, `INDUSTRY_ACCEPTED`, and `COLLABORATION_CONFIRMED`, marks competing interests rejected, creates an `IndustryCollaboration`, optionally creates an `IndustryFunding` planning record, and creates the initial `Project`. A partial unique PostgreSQL index prevents more than one active industry collaboration per proposal. Funding is tracking data only; payment processing is out of scope.

Industry reads for interests, collaborations, and projects are filtered by the authenticated industry's organization ID. No industry proposal-edit endpoint exists; university proposal writes remain protected by university role and organization scope.

## Project lifecycle management (implemented Phase 10)

`/api/projects` provides role-scoped project listing and detail views. Ministry sees all projects; universities see projects attached to their accepted proposal; industries see projects they support; submitters see a simplified lifecycle, milestone progress, and update timeline for their own problem. Only the assigned university can mutate project delivery data.

`ProjectRepository` owns the transaction boundary for status changes and validates `backend/src/domain/projectLifecycle.ts`. It appends project status history and mirrors active delivery states into the problem lifecycle. Milestones use ordered records with status, due date, completion percentage, and deliverables. Updates can reference a milestone and include provider-neutral project documents. Impact measurements use one record per project/metric with beneficiary, location, outcome, evidence, and notes fields.

## Notifications (implemented Phase 11; optional email extension)

`NotificationRepository` stores recipient-scoped notifications with typed event categories, explicit related entity type/ID, read timestamp, and creation timestamp. `notificationEvents.ts` is called by problem, AI, invitation, team, proposal, industry collaboration, and project repositories. Event inserts occur inside existing transactions where available, so a rolled-back lifecycle change cannot leave a notification behind. The API exposes list, unread count, mark-read, and mark-all-read operations; every query is constrained by the authenticated recipient ID. The frontend uses refresh plus one-minute polling and does not require WebSockets.

`EmailNotificationService` is configured centrally from optional SMTP environment variables. It is invoked by the same notification fan-out after the in-app notification is persisted. A role-aware workflow email policy sends only major milestones: submission to submitters, threshold handoff to Ministry, Ministry approval/rejection to submitters, proposal submission to submitters/universities, new proposals to industries, collaboration confirmation to all stakeholders, and implementation/completion updates to stakeholders. Smaller events remain in-app only. Missing configuration, invalid recipient addresses, provider errors, and transport failures are handled safely, so email is best-effort and never breaks the primary workflow or dashboard notifications.

## Ministry analytics and control dashboard (implemented Phase 12; verified Phase 13)

`GET /api/analytics/ministry` is protected by `authenticate` and `requireRole(MINISTRY_ADMIN)`. The controller delegates to `AnalyticsService`, which composes `AnalyticsRepository` aggregation queries. PostgreSQL performs counts, grouped status/category/district/time series, acceptance rates, organization participation, project stages/delays/progress, and impact totals; Node.js only maps already-aggregated rows into the API contract.

The frontend route `/ministry/analytics` is composed from `MinistryAnalyticsDashboard`, `AnalyticsCard`, `AnalyticsBarList`, and focused dashboard subviews. Ministry navigation distinguishes implemented destinations from organization/application screens that remain planned. Proposal detail views are recorded once per industry/proposal pair by the industry proposal-detail endpoint and aggregated alongside interest and collaboration counts.

## MVP UI/UX and demonstration polish (implemented Phase 14)

The frontend now uses a shared visual vocabulary in `frontend/app/globals.css` and `frontend/components/ui.tsx` for page headers, panels, buttons, badges, form controls, loading states, errors, and empty states. `AppShell` provides role-aware navigation, account identity, notification access, and responsive wrapping for smaller screens. The submitter, Ministry, university, industry, project, problem detail, and notification views use the shared components without moving business logic into the frontend.

`LifecycleStepper` presents the challenge-to-impact journey with accessible landmark and current-step semantics. Intermediate backend states are grouped into meaningful demonstration stages for readability. Ministry review explicitly labels AI output as an advisory recommendation and keeps Ministry actions visually separate as authoritative decisions. Interactive controls include labels, focus-visible states, semantic navigation, status announcements, and responsive layouts.

## Major modules

- Identity, authentication, refresh sessions, and RBAC (implemented)
- Ministry organization account creation, registration applications, approval/rejection, and structured organization profiles (implemented)
- Problem intake, submitter profiles, and initial problem lifecycle (implemented)
- AI-gated community problem posts, one-per-user up/down votes, and Ministry threshold handoff (implemented)
- AI validation, extraction, embeddings, grounded university ranking, and recommendation explanations (implemented)
- Ministry review, recommendation approvals/removals/manual additions, invitation dispatch, and oversight (implemented through Phase 8)
- University capability profiles, teams, proposals, and project progress (project delivery implemented; broader dashboard planned)
- Industry proposal discovery, support, funding, collaboration confirmation, and project monitoring (implemented through Phase 9)
- Collaboration milestones, field pilots, implementation, and impact (implemented Phase 10)
- Status history, auditability, notifications, Ministry analytics dashboards, and reporting

## Implemented vs planned

| Area | Implemented through Phase 13 | Planned |
| --- | --- | --- |
| Repository/domain foundation | Root folders, documentation, ignore rules, TypeScript lifecycle module, problem repository/service/controller layering | Remaining business domain service implementations |
| Frontend | Next.js/TypeScript/Tailwind scaffold, auth integration, shared UI primitives, responsive role-aware shell, submitter problem form/list/detail/timeline, community problem/support feed, Ministry AI/matching review screens, university assignment/team/proposal workspace, industry discovery/collaboration workspace, project workspace, notification indicator/list, and Ministry analytics dashboard | Ministry organization/application screens, richer upload UX, frontend test suite, visual regression coverage, and advanced reporting |
| Backend | Express app/server, environment validation, security middleware, error/404 handling, response conventions, health route, repository/service/controller layering, authentication, registration/profile/problem/AI/matching/community/collaboration/project/notification APIs, optional best-effort SMTP email fan-out, Ministry analytics aggregation API, recipient isolation, tests, and Prisma/TypeScript tooling | Production deployment configuration, durable email queue/provider operations, and additional reporting endpoints |
| Database | Prisma schema, migrations, constraints, onboarding/profile/problem/AI/matching/community up/down-vote/collaboration data, project status history, milestones, updates, documents, impact records, notification related-entity fields, proposal view events, pgvector indexes, analytics seed strategy/data, Docker Compose, and pgvector init script | Additional reporting/read models |
| AI | OpenAI structured-output and embedding provider boundaries, dedicated prompts/schemas, Zod validation, automatic submission gate, deterministic development providers, persisted failures/retry, grounded evidence validation, and Ministry advisory view | Broader AI recommendations and operational model governance |
| Auth/RBAC | JWT login/refresh/logout, bcrypt password verification, safe current-user endpoint, refresh-session revocation, role middleware, onboarding flags, and synthetic role seed accounts | Password reset, account administration, and feature-specific authorization policies |
| Registration/profiles | Ministry account creation, self-registration applications, approval/rejection, duplicate guards, and university/industry structured profile maintenance | Notifications, documents, public discovery, and broader onboarding UX |
| Lifecycle | Persisted enums, append-only problem/project status histories, centralized actor-aware transition maps, review/approval transactions, invitation/acceptance/rejection transitions, project-context creation, team/proposal transitions, project delivery transitions, notification event records, and human-controlled AI boundary | Richer audit reporting |
