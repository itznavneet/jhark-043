# Architectural Decisions

## ADR-001: Use a separate Next.js frontend and Express backend

- **Status:** Accepted
- **Decision:** Build the frontend with Next.js and keep the backend as a separate Express.js service. Backend logic must not be implemented in Next.js API routes.
- **Reason:** This keeps presentation and server-side domain concerns independently deployable and preserves a clear API boundary.

## ADR-002: Use TypeScript throughout

- **Status:** Accepted
- **Decision:** Use TypeScript for both frontend and backend.
- **Reason:** Shared type discipline and safer domain/API contracts are important for a multi-role workflow with many lifecycle states.

## ADR-003: Use PostgreSQL in Docker for local development

- **Status:** Accepted
- **Decision:** Use PostgreSQL as the primary database and run it locally with Docker Compose.
- **Reason:** PostgreSQL provides transactional integrity, mature relational modeling, and a consistent local environment.

## ADR-004: Enable pgvector

- **Status:** Accepted
- **Decision:** Enable PostgreSQL's `pgvector` extension for semantic retrieval.
- **Reason:** University matching must use semantic search across profiles, faculty, research areas, facilities, and prior projects.

## ADR-005: Use Prisma unless technically unsuitable

- **Status:** Accepted
- **Decision:** Prisma is the default ORM. If Prisma cannot express a pgvector type or query cleanly, isolate the minimum required raw SQL/unsupported-type handling behind a repository.
- **Reason:** Prisma provides typed relational access while allowing a controlled escape hatch for vector-specific functionality.

## ADR-006: Isolate OpenAI integration in AI services

- **Status:** Accepted
- **Decision:** Use the OpenAI API through dedicated backend AI services/modules; never call it directly from controllers.
- **Reason:** Prompts, structured output parsing, embeddings, retries, privacy controls, and explainability need a testable boundary.

## ADR-007: Use JWT authentication and RBAC

- **Status:** Accepted
- **Decision:** Authenticate with JWTs and authorize with backend-enforced role-based access control for `MINISTRY_ADMIN`, `SUBMITTER`, `UNIVERSITY`, and `INDUSTRY`.
- **Reason:** The platform has distinct responsibilities and Ministry-controlled decisions across the lifecycle.

## ADR-008: AI is advisory; Ministry is authoritative

- **Status:** Accepted
- **Decision:** AI may validate, categorize, extract, match, rank, and explain. It may not make final approval, rejection, invitation, or collaboration decisions. Ministry administrators retain final authority.
- **Reason:** The product requires accountable human governance over public-interest decisions.

## ADR-009: Use service/controller/repository separation

- **Status:** Accepted
- **Decision:** Backend modules follow routes -> controllers -> services -> repositories/database. Services own business logic and transactions.
- **Reason:** This makes the system easier to test, evolve, and review while preventing controllers from becoming business-logic containers.

## ADR-010: Model role-specific profiles separately from authentication

- **Status:** Accepted
- **Decision:** Store authentication credentials and the single application role on `User`. Store submitter, university, and industry profile/organization data in related models; organization users reference their organization.
- **Reason:** This avoids duplicated authentication data and allows each organization/profile to evolve independently while preserving a clear role boundary.

## ADR-011: Keep proposal and project as separate concepts

- **Status:** Accepted
- **Decision:** A `Proposal` represents a university's proposed solution. A `Project` is created for the collaboration that begins after industry acceptance/support. Funding is represented by multiple `IndustryFunding` records under a collaboration.
- **Reason:** Proposal discovery and evaluation must not be confused with an active, funded implementation project, and future support/funding records must remain extensible.

## ADR-012: Isolate vector storage behind an unsupported Prisma field and SQL migrations

- **Status:** Accepted
- **Decision:** Store university knowledge embeddings in `UniversityKnowledgeEmbedding.embedding` as Prisma `Unsupported("vector")`. Keep vector-specific SQL/migration behavior isolated; use normal Prisma access for relational data.
- **Reason:** Prisma's relational modeling remains useful while pgvector types and similarity operators can be introduced without making the application dependent on vector retrieval in Phase 1.

## ADR-013: Enforce one accepted university with a partial unique index

- **Status:** Accepted
- **Decision:** Add `UniversityProblemAssignment_one_accepted_per_problem_idx` on `problemId` where `status = 'ACCEPTED'` in a focused SQL migration.
- **Reason:** Prisma schema declarations do not express this conditional uniqueness rule, and the database must protect the invariant under concurrent acceptance attempts.

## ADR-014: Keep development seed data synthetic and idempotent

- **Status:** Accepted
- **Decision:** Provide a small TypeScript Prisma seed with deterministic IDs, `.test` email addresses, and development-only credentials for one Ministry admin, submitter, university, and industry.
- **Reason:** Repeatable local setup is useful during foundation phases while avoiding real personal information or large fabricated datasets.

## ADR-015: Use an app factory with injected infrastructure dependencies

- **Status:** Accepted
- **Decision:** Build the Express application through `createApp`, accepting validated environment settings and replaceable service dependencies. Keep server listening and process shutdown in `server.ts`.
- **Reason:** HTTP behavior can be tested independently from process startup and database availability, while production startup remains explicit.

## ADR-016: Use a consistent API envelope and centralized error boundary

- **Status:** Accepted
- **Decision:** Successful responses use `{ success, data, requestId }`; errors use `{ success, error: { code, message, details? }, requestId }`. A final error middleware owns normalization and safe responses.
- **Reason:** Clients receive predictable contracts, request correlation is available, and internal stack traces are not exposed in production responses.

## ADR-017: Use short-lived JWT access tokens with rotating database-backed refresh sessions

- **Status:** Accepted
- **Decision:** Issue short-lived HS256 JWT access tokens and opaque refresh tokens. Store only a SHA-256 hash of each refresh token in PostgreSQL. Rotate refresh sessions atomically on refresh and revoke them on logout.
- **Reason:** The API can authenticate requests without a database lookup for token signature validation while retaining server-side refresh-session invalidation and replay protection.

## ADR-018: Keep refresh tokens in HTTP-only cookies

- **Status:** Accepted
- **Decision:** Deliver refresh tokens through an HTTP-only, same-site cookie scoped to `/api/auth`; return access tokens through the API. Use secure cookies in production.
- **Reason:** This reduces exposure of long-lived credentials to frontend JavaScript while preserving a simple separate-frontend/backend API contract.

## ADR-019: Separate authorization roles from submitter types

- **Status:** Accepted
- **Decision:** Keep `MINISTRY_ADMIN`, `SUBMITTER`, `UNIVERSITY`, and `INDUSTRY` as authorization roles. Model `CITIZEN`, `PANCHAYATI_RAJ`, `ORGANIZATION`, `GOVERNMENT_ORGANIZATION`, and `OTHER` as submitter profile types.
- **Reason:** A submitter's organizational identity describes the source of a problem and must not change the permissions granted by the application role.

## ADR-020: Reuse applicant users when approving self-registration

- **Status:** Accepted
- **Decision:** A pending university or industry application is associated with an existing role-specific applicant user. Ministry approval creates the organization and links that same user in one transaction; it does not create a second user for the same application.
- **Reason:** Account ownership, credentials, refresh sessions, and application history remain continuous and duplicate identities are avoided.

## ADR-021: Use explicit first-login onboarding flags

- **Status:** Accepted
- **Decision:** Ministry-created accounts receive a generated temporary password and two independent user flags: `mustChangePassword` and `mustCompleteProfile`. Password change and organization profile update operations clear their respective flags.
- **Reason:** Credential setup and organization data completion are separate responsibilities, and the backend can communicate/enforce onboarding state without exposing temporary credentials through email infrastructure that does not yet exist.

## ADR-022: Store organization capabilities as structured relational data before embeddings

- **Status:** Accepted
- **Decision:** Store university faculty, research areas, laboratories, facilities, previous projects, and industry expertise, interest areas, and support capabilities in typed relational tables. Do not generate semantic embeddings in Phase 4.
- **Reason:** Clean structured source data is required before adding semantic retrieval, and it keeps this phase deterministic and independently verifiable.

## ADR-023: Keep Ministry review as the approval boundary

- **Status:** Accepted
- **Decision:** Only `MINISTRY_ADMIN` can create organization accounts or list, inspect, approve, and reject registration applications. University and industry users can submit their own application and manage only their approved organization profile.
- **Reason:** Organization onboarding is a governance decision and must remain attributable to the Ministry while preserving least-privilege access for applicants.

## ADR-024: Keep problem evidence provider-neutral

- **Status:** Accepted
- **Decision:** Store evidence metadata with a typed `IMAGE`, `VIDEO`, or `DOCUMENT` value and either a `storageKey` or `externalUrl`. Do not couple problem submission to a cloud storage provider before a storage abstraction is introduced.
- **Reason:** Phase 5 needs to preserve evidence references while leaving binary upload, signed URLs, retention, and provider selection for a later infrastructure decision.

## ADR-025: Enforce submitter ownership at the repository boundary

- **Status:** Accepted
- **Decision:** Submitter problem list, detail, and timeline queries include the authenticated submitter user as a repository filter. Ministry queries use a separate privileged viewer path for all problems.
- **Reason:** Privacy must be enforced in the data-access path, not only by frontend filtering or controller conventions.

## ADR-026: Centralize and transact problem status transitions

- **Status:** Accepted
- **Decision:** Define allowed problem transitions and actor permissions in the lifecycle domain module. Execute a transition with a conditional current-status update and append `ProblemStatusHistory` inside one database transaction.
- **Reason:** Explicit state-machine rules prevent arbitrary transitions, and the conditional update makes stale concurrent requests fail safely while preserving an auditable history.

## ADR-027: Use strict structured output for AI problem analysis

- **Status:** Accepted
- **Decision:** The OpenAI provider requests a strict JSON Schema response and the backend validates the response again with Zod before persistence. Prompts and schemas live in dedicated AI modules.
- **Reason:** Ministry review needs typed fields for validity, reasoning, classification, keywords, expertise, facilities, priority, and solution areas; free-form model text is not a safe application contract.

## ADR-028: Persist AI processing attempts and safe failures

- **Status:** Accepted
- **Decision:** Store one `ProblemAIAnalysis` row per processing attempt with `PENDING`, `PROCESSING`, `COMPLETED`, or `FAILED` status. Persist model/prompt metadata, structured results, completion time, and a safe failure reason; failed attempts can be retried.
- **Reason:** Provider outages and malformed responses must be visible to Ministry users without corrupting the submitted problem or silently converting failure into a decision.

## ADR-029: Keep AI advisory and Ministry-controlled

- **Status:** Accepted
- **Decision:** AI analysis never makes a Ministry approval/rejection decision. The later community-gated intake workflow permits a completed AI analysis to classify a submission as AI_VALIDATED or AI_REJECTED before publication; only authenticated Ministry actions can perform the final public-interest approval/rejection transitions.
- **Reason:** AI provides evidence and recommendations, while accountable Ministry actors retain final authority over public-interest decisions.

## ADR-030: Store traceable embeddings for university knowledge and problems

- **Status:** Accepted
- **Decision:** Store normalized source text, source type, source identity, model, dimensions, and vector data for approved university knowledge. Store problem embeddings separately by problem and model. Use PostgreSQL pgvector cosine retrieval behind a repository.
- **Reason:** Matching evidence must remain inspectable and rerunnable; opaque vectors without source provenance cannot support accountable Ministry review or duplicate detection.

## ADR-031: Use persisted matching runs for retryable recommendations

- **Status:** Accepted
- **Decision:** Persist each matching attempt as a `UniversityMatchingRun` with processing status, model metadata, candidate count, timestamps, and safe failure reason. Recommendations link to the run and retain generated evidence and Ministry decision fields.
- **Reason:** Embedding/provider failures must not corrupt problems, and Ministry needs to distinguish a failed attempt from a completed recommendation set.

## ADR-032: Ground ranking output in retrieved evidence IDs

- **Status:** Accepted
- **Decision:** The ranking prompt receives only retrieved candidate evidence and must return source IDs. Zod validation and service-level grounding checks reject university or evidence references not returned by retrieval. A deterministic token-hash embedding/ranker is used only for non-production local development when no OpenAI key is configured.
- **Reason:** Structured output alone does not prevent invented evidence; source-ID validation makes recommendations auditable while keeping local setup usable without paid API calls.

## ADR-033: Model university acceptance as a transaction-owned project context

- **Status:** Accepted
- **Decision:** Ministry-approved recommendation records become university assignments only through an explicit invitation dispatch operation. A university acceptance transaction conditionally accepts one invitation, cancels competing invitations, appends lifecycle history, and creates one `UniversityProjectContext` linked to the accepted assignment. A partial unique database index remains the final guard against concurrent acceptance.
- **Reason:** Assignment state, problem lifecycle, cancellation, and the university's team/proposal workspace must remain consistent even when multiple universities respond at nearly the same time.

## ADR-034: Keep proposal drafts private until submission

- **Status:** Accepted
- **Decision:** Universities may save structured `DRAFT` proposals scoped to their accepted project context. Only `SUBMITTED` proposals are returned by industry discovery endpoints, and submitted proposals cannot be edited through the MVP university endpoint.
- **Reason:** Industry should discover reviewable proposals only after the university has explicitly submitted a complete solution package.

## ADR-035: Treat industry support as tracked collaboration, not payment processing

- **Status:** Accepted
- **Decision:** Phase 9 stores structured industry support types, one organization-scoped interest per proposal, collaboration status, optional funding amount/currency/conditions/status, and a project created inside the confirmation transaction. A PostgreSQL partial unique index permits at most one active industry collaboration per proposal.
- **Reason:** The MVP needs accountable partnership intent and funding visibility while avoiding payment, settlement, or financial transaction responsibilities. Organization-scoped reads and backend role checks preserve access isolation.

## ADR-036: Keep project delivery state and visibility explicit

- **Status:** Accepted
- **Decision:** Model operational project states and append-only `ProjectStatusHistory` separately from problem lifecycle history. Use a centralized project state machine with university-only delivery transitions, while Ministry, supporting industry, and owning submitter receive role-scoped project views. Store milestones, progress updates, provider-neutral documents, and simple impact metrics as structured relational records.
- **Reason:** Project execution needs its own operational timeline and data model without weakening Ministry authority or exposing private project data across organizations. Transactional conditional updates and history records make progress auditable.

## ADR-037: Use transactional in-app notifications with refresh retrieval

- **Status:** Accepted
- **Decision:** Store notifications in PostgreSQL with recipient ID, typed category, explicit related entity type/ID, read timestamp, and creation timestamp. Generate event notifications inside existing repository transactions where possible. Provide list, unread-count, mark-read, and mark-all-read APIs scoped to the authenticated recipient. Use refresh-based frontend retrieval with one-minute polling instead of WebSockets for the MVP.
- **Reason:** In-app notifications provide an auditable, low-complexity event trail while transaction-scoped writes prevent notifications for changes that did not commit. Polling is sufficient for MVP freshness without introducing real-time infrastructure.

## ADR-038: Use PostgreSQL aggregation for Ministry analytics

- **Status:** Accepted
- **Decision:** Expose one Ministry-protected analytics read endpoint backed by a dedicated analytics service and repository. PostgreSQL performs the dashboard's counts, grouped distributions, rates, organization participation, project stages/delays/progress, and impact totals. A unique industry/proposal view record is created on proposal-detail access and aggregated with interest/collaboration events.
- **Reason:** Ministry reporting must remain efficient as records grow and must not depend on loading complete tables into Node.js. A focused read contract keeps dashboard calculations separate from transactional business workflows, while a deduplicated detail-view record provides a truthful discovery signal.

## ADR-039: Gate community publication with advisory AI and support threshold

- **Status:** Accepted
- **Decision:** A submitted problem is processed before publication. A completed advisory result may move it to AI_VALIDATED or AI_REJECTED; failures remain retryable at SUBMITTED. Only validated problems appear in the community feed. A submitter may support another user's problem once, and reaching UPVOTE_THRESHOLD changes eligibility to MINISTRY_REVIEW; it never approves the problem.
- **Reason:** Community support should filter and prioritize genuine public-interest challenges while preserving the Ministry's final decision authority and preventing duplicate or self-support.

## ADR-040: Keep email notification delivery optional and best-effort

- **Status:** Accepted
- **Decision:** In-app notifications remain the durable workflow record. A central email service optionally sends the same event through SMTP configured by environment variables. Missing configuration, invalid addresses, and delivery failures are handled without throwing into the originating workflow.
- **Reason:** Local demonstrations use synthetic addresses and may have no mail provider. Dashboard notifications must remain reliable even when email is unavailable.

## ADR-041: Model community votes as one-way up/down actions

- **Status:** Accepted
- **Decision:** Store upvotes and downvotes as separate problem/user records with unique constraints. A PostgreSQL transaction-scoped advisory lock per problem serializes the cross-table check and insert, so a submitter can vote only once and cannot change vote direction under concurrent requests. Only upvotes contribute to the configurable Ministry handoff threshold; downvote totals are returned only to the original problem submitter.
- **Reason:** The feed needs visible thumbs-up/thumbs-down state without allowing vote manipulation or exposing negative totals as a popularity signal to other submitters, while preserving the existing upvote migration and API compatibility.

## ADR-042: Restrict workflow email to major milestones

- **Status:** Accepted
- **Decision:** Keep every lifecycle event as an in-app notification, but apply a centralized role-aware email allowlist. Email is reserved for problem submission, Ministry review handoff, Ministry decisions, proposal submission/discovery, collaboration confirmation, and implementation/completion milestones. Each event is sent only to the relevant roles; SMTP remains optional and best-effort.
- **Reason:** Email should provide meaningful action/status updates without overwhelming users with milestone-adjacent events such as individual votes, interest expressions, milestone edits, or routine document/impact updates.
