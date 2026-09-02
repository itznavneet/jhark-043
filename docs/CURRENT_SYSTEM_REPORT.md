# Current System Report

Audit date: 2026-09-01

This report describes the repository as it exists now. It is an MVP/SIH demonstration system, not a production-ready platform. Source code, the current Prisma schema, migrations, seed implementation, and executed verification commands are the source of truth.

## Current Architecture

- `frontend/` is a standalone Next.js 15 application using TypeScript, React, and Tailwind CSS.
- `backend/` is a standalone Express 5 application using TypeScript, Prisma, PostgreSQL, JWT, bcrypt, Zod, Helmet, CORS, and the OpenAI SDK.
- `backend/prisma/schema.prisma` is the Prisma schema. PostgreSQL runs through Docker Compose using `pgvector/pgvector:pg16`.
- Backend flow is `routes -> controllers -> services -> repositories`, with dedicated AI providers and domain state machines.
- Access tokens are short-lived JWTs. Refresh tokens are opaque, hashed, rotated database sessions delivered by HTTP-only cookies.
- Prisma's `Unsupported("vector")` fields and isolated tagged raw SQL are used only for pgvector storage/retrieval.
- Environment loading uses `dotenv/config` and the backend working directory. The backend Prisma schema reads `DATABASE_URL` from the environment.

## 2026-09-02 Authentication and Demo-Data Update

The common login page is available at `/login` with an account-type selector. The selected type is checked after password verification against the persisted `User.role`; email text is never used to infer authorization. The UI labels map to the existing roles: Citizen / Submitter → `SUBMITTER`, University → `UNIVERSITY`, Industry / Startup → `INDUSTRY`, and Ministry → `MINISTRY_ADMIN`.

Public submitter registration is available at `/register`. University and industry applications are separate at `/register/university` and `/register/industry`; they create inactive applicant accounts and `PENDING` applications. Ministry review is available at `/ministry/registrations`; approval links and activates the existing applicant account, while rejection leaves it inactive.

The deterministic development seed now performs a guarded development reset and creates exactly 10 authenticated accounts: 3 submitters, 1 Ministry administrator, 3 university administrators, and 3 industry accounts. It creates exactly 3 approved universities and exactly 3 approved industries with distinct searchable capability data. See [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md).

## Exact Database Model Count

Total models: **41**

Enums are not included in the model count. The schema contains 26 enums.

## Model List

Alphabetical list of every Prisma model:

1. `ImpactMeasurement` - project impact metrics and evidence. Relations: `Project`.
2. `Industry` - approved industry organization and profile. Relations: `User`, `IndustryExpertise`, `IndustryInterestArea`, `IndustrySupportCapability`, `IndustryProposalInterest`, `IndustryProposalView`, `IndustryCollaboration`, `Project`, `RegistrationApplication`.
3. `IndustryCollaboration` - industry support relationship for a proposal. Relations: `Proposal`, `Industry`, optional `Project`, `IndustryFunding`.
4. `IndustryExpertise` - structured industry expertise. Relations: `Industry`.
5. `IndustryFunding` - tracked funding or in-kind support record. Relations: `IndustryCollaboration`.
6. `IndustryInterestArea` - industry interest domain. Relations: `Industry`.
7. `IndustryProposalInterest` - an industry's proposal interest and response state. Relations: `Proposal`, `Industry`.
8. `IndustryProposalView` - deduplicated industry proposal-detail view. Relations: `Proposal`, `Industry`.
9. `IndustrySupportCapability` - structured support capability. Relations: `Industry`.
10. `Notification` - recipient-scoped in-app notification. Relations: `User`.
11. `Problem` - submitted societal challenge and current lifecycle status. Relations: `SubmitterProfile`, optional `ProblemCategory`, `ProblemEvidence`, `ProblemAIAnalysis`, `ProblemEmbedding`, `UniversityMatchingRun`, `ProblemStatusHistory`, `University`, `UniversityProjectContext`, `ProblemUniversityMatch`, `UniversityProblemAssignment`, `ProjectTeam`, `Proposal`.
12. `ProblemAIAnalysis` - one structured AI processing attempt. Relations: `Problem`, optional `ProblemCategory`.
13. `ProblemCategory` - normalized problem domain/category. Relations: `Problem`, `ProblemAIAnalysis`.
14. `ProblemEmbedding` - problem vector and provenance metadata. Relations: `Problem`.
15. `ProblemEvidence` - image, video, document, or link metadata reference for a problem. Relations: `Problem`.
16. `ProblemStatusHistory` - append-only problem transition audit record. Relations: `Problem`, optional `User` actor.
17. `ProblemUniversityMatch` - university recommendation, decision, score, and evidence. Relations: `Problem`, `University`, optional `UniversityMatchingRun`, optional approving/removing `User`, `UniversityProblemAssignment`.
18. `Project` - operational collaboration project. Relations: `Proposal`, optional `Industry`, `IndustryCollaboration`, `ProjectMilestone`, `ProjectUpdate`, `ProjectDocument`, `ImpactMeasurement`, `ProjectStatusHistory`.
19. `ProjectDocument` - provider-neutral project document metadata. Relations: `Project`, optional `ProjectUpdate`.
20. `ProjectMilestone` - project milestone, schedule, progress, and deliverables. Relations: `Project`, `ProjectUpdate`.
21. `ProjectStatusHistory` - append-only project transition audit record. Relations: `Project`, optional `User` actor.
22. `ProjectTeam` - university project team. Relations: `Problem`, `University`, optional `UniversityProjectContext`, `TeamMember`, `Proposal`.
23. `ProjectUpdate` - project progress update. Relations: `Project`, optional `User` author, optional `ProjectMilestone`, `ProjectDocument`.
24. `Proposal` - university solution proposal and submission state. Relations: `Problem`, `University`, optional `UniversityProjectContext`, optional `ProjectTeam`, `ProposalDocument`, `IndustryProposalInterest`, `IndustryProposalView`, `IndustryCollaboration`, optional `Project`.
25. `ProposalDocument` - provider-neutral proposal document metadata. Relations: `Proposal`.
26. `RefreshSession` - hashed refresh-token session and revocation state. Relations: `User`.
27. `RegistrationApplication` - university or industry self-registration application. Relations: applicant/reviewer `User`, optional `SubmitterProfile`, optional approved `University` or `Industry`, `RegistrationApplicationDocument`.
28. `RegistrationApplicationDocument` - provider-neutral registration document metadata. Relations: `RegistrationApplication`.
29. `SubmitterProfile` - submitter type and profile. Relations: `User`, `Problem`, `RegistrationApplication`.
30. `TeamMember` - faculty, research, or other team member. Relations: `ProjectTeam`, optional `User`.
31. `University` - approved university organization and structured capability profile. Relations: `User`, approval/creator `User`, `UniversityFaculty`, `UniversityResearchArea`, `UniversityLab`, `UniversityFacility`, `UniversityPreviousProject`, `UniversityKnowledgeEmbedding`, `UniversityProjectContext`, `ProblemUniversityMatch`, `UniversityProblemAssignment`, `ProjectTeam`, `Proposal`, `RegistrationApplication`.
32. `UniversityFacility` - typed university facility and capabilities. Relations: `University`.
33. `UniversityFaculty` - faculty expertise/profile source. Relations: `University`.
34. `UniversityKnowledgeEmbedding` - traceable university source embedding. Relations: `University`.
35. `UniversityLab` - laboratory and capabilities. Relations: `University`.
36. `UniversityMatchingRun` - retryable university matching attempt. Relations: `Problem`, `ProblemUniversityMatch`.
37. `UniversityPreviousProject` - prior university project source. Relations: `University`.
38. `UniversityProblemAssignment` - invitation and acceptance state for a university/problem. Relations: `Problem`, `University`, optional `ProblemUniversityMatch`, optional `UniversityProjectContext`.
39. `UniversityProjectContext` - accepted-university workspace for a problem. Relations: `Problem`, `University`, `UniversityProblemAssignment`, optional `ProjectTeam`, optional `Proposal`.
40. `UniversityResearchArea` - university research domain source. Relations: `University`.
41. `User` - authentication identity, role, organization links, and actors. Relations: `RefreshSession`, optional `SubmitterProfile`, optional `University`, optional `Industry`, approvals/reviews, team memberships, project updates/status changes, `Notification`.

## Enums

`UserRole`, `SubmitterType`, `ProblemStatus`, `AssignmentStatus`, `RegistrationStatus`, `RegistrationTargetType`, `ProposalStatus`, `IndustryProposalInterestStatus`, `IndustryCollaborationStatus`, `ProjectStatus`, `ProblemPriority`, `AiValidationDecision`, `AiProcessingStatus`, `MatchingProcessingStatus`, `ProblemEvidenceType`, `MatchDecision`, `UniversityFacilityType`, `TeamMemberType`, `ProposalDocumentType`, `ProjectDocumentType`, `MilestoneStatus`, `FundingType`, `FundingStatus`, `IndustrySupportType`, `SearchableSourceType`, and `NotificationType`.

## Important Indexes and Unique Constraints

- Unique user email; unique university/industry names and registration numbers.
- Submitter/problem status/category/geography/priority indexes for problem access and Ministry filtering.
- Problem AI analysis processing/decision indexes.
- Unique problem embedding per problem/model and unique university source embedding per source type/source ID/model.
- Explicit pgvector HNSW indexes on both embedding tables using cosine operators.
- Unique problem/university recommendation, assignment, project-context, team, and proposal relationships.
- Partial unique index enforcing at most one accepted university assignment per problem.
- Unique proposal/industry interest, proposal/industry view, and proposal/industry collaboration pairs.
- Partial unique index enforcing at most one active industry collaboration per proposal.
- Milestone uniqueness by project/sequence and project/title; impact uniqueness by project/metric.
- Database range checks for milestone/update progress and non-negative people/locations counts.
- Recipient/read/created indexes for notifications and project/status-history indexes for timelines.

## Exact Demo Accounts

The seed defines exactly 10 accounts. All use the explicit development-only password constant `DevOnly-Portal-123!`; the seed hashes it with bcrypt before persistence and prints it only as seed output. These are synthetic `.test` accounts and must not be used outside local development. The complete table is in [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md).

| Role             | Count | Account emails                                                                                      |
| ---------------- | ----: | --------------------------------------------------------------------------------------------------- |
| `MINISTRY_ADMIN` |     1 | `ministry.admin@example.test`                                                                       |
| `SUBMITTER`      |     3 | `citizen.rahul@example.test`, `panchayat.barkagaon@example.test`, `org.jrdf@example.test`           |
| `UNIVERSITY`     |     3 | `university.water@example.test`, `university.agri@example.test`, `university.embedded@example.test` |
| `INDUSTRY`       |     3 | `industry.aqua@example.test`, `industry.green@example.test`, `industry.digital@example.test`        |

No `CITIZEN`, `GOVERNMENT`, `UNIVERSITY_ADMIN`, `FACULTY`, `STUDENT`, `MENTOR`, or `SUPER_ADMIN` authorization roles exist in the current schema. The requested Citizen and University Admin concepts are represented by the existing `SUBMITTER` and `UNIVERSITY` roles; `INDIVIDUAL_CITIZEN` is a submitter category, not an authorization role.

## Seeded Demo Data

The following counts are the deterministic rows defined by the seed IDs, excluding unrelated temporary integration-test rows that may remain in the local development database:

| Model/data concept                  |                                    Seed count |
| ----------------------------------- | --------------------------------------------: |
| Users                               |                                            10 |
| Submitter profiles                  |                                             3 |
| Universities                        |                                             3 |
| University faculty                  |                                             3 |
| University research areas           |                                            18 |
| University labs                     |                                             9 |
| University facilities               |                                             3 |
| University previous projects        |                                             9 |
| University knowledge embeddings     |   0; generated by matching/indexing, not seed |
| Industries                          |                                             3 |
| Industry expertise                  |                                            17 |
| Industry interest areas             |                                             6 |
| Industry support capabilities       |                                             9 |
| Problem categories                  |                                             3 |
| Problems                            |                                             3 |
| Problem evidence                    |                                             0 |
| AI analyses                         |          0; created by an AI analysis request |
| Problem embeddings                  | 0; created by matching or duplicate detection |
| Matching runs                       |                        0; created by matching |
| Problem status histories            |                                            33 |
| University matches                  |                                             0 |
| University assignments              |                                             0 |
| University project contexts         |                                             0 |
| Teams                               |                                             0 |
| Team members                        |                                             0 |
| Proposals                           |                                             0 |
| Proposal documents                  |                                             0 |
| Industry proposal interests         |                                             0 |
| Industry proposal views             |                                             0 |
| Industry collaborations             |                                             0 |
| Industry funding records            |                                             0 |
| Projects                            |                                             0 |
| Project status histories            |                                             0 |
| Project milestones                  |                                             0 |
| Project updates                     |                                             0 |
| Project documents                   |                                             0 |
| Impact measurements                 |                                             0 |
| Registration applications/documents |                                         0 / 0 |
| Notifications                       |                   0; generated by event flows |

There are no `Department`, `Student`, `Deliverable`, `Risk`, `TestingOutcome`, `Similarity`, or `AuditLog` models in the current schema. Those counts are **not applicable**, not missing rows.

The live local database was reseeded after verification. The counts above are the final clean development database snapshot; lifecycle and collaboration records are created as the demonstration flow is exercised.

## Frontend Routes

### Public

| Route                  | Status      | Reality                                                 |
| ---------------------- | ----------- | ------------------------------------------------------- |
| `/`                    | IMPLEMENTED | Login form and role-based redirect after authentication |
| `/login`               | IMPLEMENTED | Common login with persisted-role account selector       |
| `/register`            | IMPLEMENTED | Submitter registration and role-path selection          |
| `/register/university` | IMPLEMENTED | University application form                             |
| `/register/industry`   | IMPLEMENTED | Industry/startup application form                       |
| `/_not-found`          | IMPLEMENTED | Next.js framework fallback                              |

### Submitter

| Route            | Status      | Reality                                                                 |
| ---------------- | ----------- | ----------------------------------------------------------------------- |
| `/my-problems`   | IMPLEMENTED | Own problem list, empty/loading/error states, submission form           |
| `/problems/[id]` | IMPLEMENTED | Own problem detail and lifecycle timeline; backend remains owner-scoped |

### University

| Route         | Status      | Reality                                                             |
| ------------- | ----------- | ------------------------------------------------------------------- |
| `/university` | IMPLEMENTED | Assignment response, team form, proposal draft/submission workspace |
| `/projects`   | IMPLEMENTED | Shared project workspace with university management controls        |

### Industry

| Route       | Status      | Reality                                                                        |
| ----------- | ----------- | ------------------------------------------------------------------------------ |
| `/industry` | IMPLEMENTED | Proposal discovery, filters, interest, support, collaboration, project summary |
| `/projects` | IMPLEMENTED | Shared read-only/full-visibility project workspace for supported projects      |

### Ministry/Admin

| Route                     | Status      | Reality                                                                    |
| ------------------------- | ----------- | -------------------------------------------------------------------------- |
| `/ministry/problems`      | IMPLEMENTED | Problem review, advisory AI view, matching/recommendation controls         |
| `/ministry/analytics`     | IMPLEMENTED | KPI cards, reporting panels, charts, organization/project/impact reporting |
| `/ministry/registrations` | IMPLEMENTED | Pending application approval/rejection                                     |
| `/projects`               | IMPLEMENTED | Ministry project visibility                                                |

### Shared authenticated

| Route            | Status      | Reality                                             |
| ---------------- | ----------- | --------------------------------------------------- |
| `/notifications` | IMPLEMENTED | Notification list, unread count, mark-read/read-all |

Registration-management screens are implemented for public applications and Ministry review; full organization profile-edit screens remain limited. Frontend role checks are UX checks only; backend authorization is authoritative.

## Backend API Inventory

All routes below are mounted under `/api`. No endpoint returning HTTP 501 or a `NOT_IMPLEMENTED` response was found.

### Health and authentication

| Method | Path                    | Role           | Purpose                                       | Status      |
| ------ | ----------------------- | -------------- | --------------------------------------------- | ----------- |
| GET    | `/health`               | Public         | Database-backed health                        | IMPLEMENTED |
| POST   | `/auth/login`           | Public         | Login and access/refresh issuance             | IMPLEMENTED |
| POST   | `/auth/refresh`         | Refresh cookie | Rotate refresh session and issue access token | IMPLEMENTED |
| POST   | `/auth/logout`          | Refresh cookie | Revoke refresh session                        | IMPLEMENTED |
| GET    | `/auth/me`              | Authenticated  | Current user                                  | IMPLEMENTED |
| POST   | `/auth/change-password` | Authenticated  | Change password and revoke sessions           | IMPLEMENTED |

### Registrations and organization profiles

| Method  | Path                                                 | Role                | Purpose                                        | Status      |
| ------- | ---------------------------------------------------- | ------------------- | ---------------------------------------------- | ----------- |
| POST    | `/registrations/organizations`                       | Ministry            | Create university/industry account             | IMPLEMENTED |
| POST    | `/registrations/applications`                        | University/Industry | Submit registration application                | IMPLEMENTED |
| GET     | `/registrations/applications`                        | Ministry            | List applications                              | IMPLEMENTED |
| GET     | `/registrations/applications/:applicationId`         | Ministry            | Application detail                             | IMPLEMENTED |
| POST    | `/registrations/applications/:applicationId/approve` | Ministry            | Approve and link applicant account             | IMPLEMENTED |
| POST    | `/registrations/applications/:applicationId/reject`  | Ministry            | Reject with reason                             | IMPLEMENTED |
| GET/PUT | `/organizations/university/profile`                  | University          | Read/update own profile and structured sources | IMPLEMENTED |
| GET/PUT | `/organizations/industry/profile`                    | Industry            | Read/update own profile and capabilities       | IMPLEMENTED |

### Problems and AI

| Method | Path                                     | Role                     | Purpose                                                | Status      |
| ------ | ---------------------------------------- | ------------------------ | ------------------------------------------------------ | ----------- |
| POST   | `/problems`                              | Submitter                | Create a problem; starts `SUBMITTED`                   | IMPLEMENTED |
| GET    | `/problems/mine`                         | Submitter                | List own problems                                      | IMPLEMENTED |
| GET    | `/problems`                              | Ministry                 | Filter/list all problems                               | IMPLEMENTED |
| GET    | `/problems/:problemId`                   | Ministry/Submitter owner | Problem detail                                         | IMPLEMENTED |
| GET    | `/problems/:problemId/timeline`          | Ministry/Submitter owner | Lifecycle timeline                                     | IMPLEMENTED |
| POST   | `/problems/:problemId/transition`        | Ministry                 | Review/approve/reject and allowed Ministry transitions | IMPLEMENTED |
| GET    | `/problems/:problemId/ai-analysis`       | Ministry                 | Analysis attempts/latest result                        | IMPLEMENTED |
| POST   | `/problems/:problemId/ai-analysis`       | Ministry                 | Trigger analysis                                       | IMPLEMENTED |
| POST   | `/problems/:problemId/ai-analysis/retry` | Ministry                 | Retry latest failed analysis                           | IMPLEMENTED |

### University matching

| Method | Path                                                                         | Role     | Purpose                              | Status      |
| ------ | ---------------------------------------------------------------------------- | -------- | ------------------------------------ | ----------- |
| POST   | `/university-matching/knowledge/index`                                       | Ministry | Embed approved university sources    | IMPLEMENTED |
| POST   | `/university-matching/problems/:problemId/match`                             | Ministry | Create matching run                  | IMPLEMENTED |
| POST   | `/university-matching/problems/:problemId/match/retry`                       | Ministry | Retry failed run                     | IMPLEMENTED |
| GET    | `/university-matching/problems/:problemId/recommendations`                   | Ministry | View recommendations                 | IMPLEMENTED |
| GET    | `/university-matching/problems/:problemId/duplicates`                        | Ministry | View potential vector duplicates     | IMPLEMENTED |
| POST   | `/university-matching/problems/:problemId/recommendations/approve`           | Ministry | Approve selected recommendations     | IMPLEMENTED |
| POST   | `/university-matching/problems/:problemId/recommendations/:matchId/remove`   | Ministry | Remove recommendation                | IMPLEMENTED |
| POST   | `/university-matching/problems/:problemId/recommendations/add/:universityId` | Ministry | Add indexed university manually      | IMPLEMENTED |
| GET    | `/university-matching/problems/:problemId/available-universities`            | Ministry | List available approved universities | IMPLEMENTED |

### University collaboration

| Method  | Path                                                                  | Role       | Purpose                              | Status      |
| ------- | --------------------------------------------------------------------- | ---------- | ------------------------------------ | ----------- |
| POST    | `/collaboration/problems/:problemId/invitations`                      | Ministry   | Send approved university invitations | IMPLEMENTED |
| GET     | `/collaboration/problems/:problemId/invitations`                      | Ministry   | View invitations                     | IMPLEMENTED |
| GET     | `/collaboration/university/assignments`                               | University | List own assignments                 | IMPLEMENTED |
| GET     | `/collaboration/university/assignments/:assignmentId`                 | University | Assignment detail                    | IMPLEMENTED |
| POST    | `/collaboration/university/assignments/:assignmentId/accept`          | University | Accept transaction-safely            | IMPLEMENTED |
| POST    | `/collaboration/university/assignments/:assignmentId/reject`          | University | Reject assignment                    | IMPLEMENTED |
| GET/PUT | `/collaboration/university/assignments/:assignmentId/team`            | University | Read/save own team                   | IMPLEMENTED |
| GET/PUT | `/collaboration/university/assignments/:assignmentId/proposal`        | University | Read/save draft                      | IMPLEMENTED |
| POST    | `/collaboration/university/assignments/:assignmentId/proposal/submit` | University | Submit proposal                      | IMPLEMENTED |
| GET     | `/collaboration/proposals`                                            | Industry   | Compatibility proposal listing       | IMPLEMENTED |

### Industry collaboration

| Method | Path                                                      | Role     | Purpose                                          | Status      |
| ------ | --------------------------------------------------------- | -------- | ------------------------------------------------ | ----------- |
| GET    | `/collaboration/industry/proposals`                       | Industry | Filter eligible submitted proposals              | IMPLEMENTED |
| GET    | `/collaboration/industry/proposals/:proposalId`           | Industry | View and record deduplicated view                | IMPLEMENTED |
| POST   | `/collaboration/industry/proposals/:proposalId/interests` | Industry | Express interest/support type                    | IMPLEMENTED |
| GET    | `/collaboration/industry/interests`                       | Industry | Own interests                                    | IMPLEMENTED |
| POST   | `/collaboration/industry/interests/:interestId/accept`    | Industry | Accept interest and create collaboration/project | IMPLEMENTED |
| GET    | `/collaboration/industry/collaborations`                  | Industry | Own collaborations/funding                       | IMPLEMENTED |
| GET    | `/collaboration/industry/projects`                        | Industry | Own supported projects                           | IMPLEMENTED |

### Projects, notifications, analytics

| Method | Path                                           | Role                    | Purpose                             | Status      |
| ------ | ---------------------------------------------- | ----------------------- | ----------------------------------- | ----------- |
| GET    | `/projects`                                    | All authenticated roles | Role-scoped project list            | IMPLEMENTED |
| GET    | `/projects/:projectId`                         | All authenticated roles | Role-scoped project detail          | IMPLEMENTED |
| POST   | `/projects/:projectId/status`                  | University              | Project state transition            | IMPLEMENTED |
| POST   | `/projects/:projectId/milestones`              | University              | Create milestone                    | IMPLEMENTED |
| PUT    | `/projects/:projectId/milestones/:milestoneId` | University              | Update milestone                    | IMPLEMENTED |
| POST   | `/projects/:projectId/updates`                 | University              | Post progress update and documents  | IMPLEMENTED |
| POST   | `/projects/:projectId/documents`               | University              | Add project document metadata       | IMPLEMENTED |
| PUT    | `/projects/:projectId/impact`                  | University              | Upsert impact measurement           | IMPLEMENTED |
| GET    | `/notifications`                               | Authenticated           | List own notifications              | IMPLEMENTED |
| GET    | `/notifications/unread-count`                  | Authenticated           | Own unread count                    | IMPLEMENTED |
| PATCH  | `/notifications/:notificationId/read`          | Authenticated           | Mark own notification read          | IMPLEMENTED |
| POST   | `/notifications/read-all`                      | Authenticated           | Mark all own notifications read     | IMPLEMENTED |
| GET    | `/analytics/ministry`                          | Ministry                | SQL-aggregated dashboard read model | IMPLEMENTED |

## Role Access Matrix

| Feature                | Submitter                                              | University               | Industry                    | Ministry/Admin                   |
| ---------------------- | ------------------------------------------------------ | ------------------------ | --------------------------- | -------------------------------- |
| Login                  | Yes                                                    | Yes                      | Yes                         | Yes                              |
| Register               | No generic registration; profile/application path only | Application API          | Application API             | Creates organization accounts    |
| Submit challenge       | Yes                                                    | No                       | No                          | No                               |
| View own challenge     | Yes                                                    | No                       | No                          | All problems                     |
| View all challenges    | No                                                     | No                       | No                          | Yes                              |
| Review challenge       | No                                                     | No                       | No                          | Yes                              |
| AI analysis            | No                                                     | No                       | No                          | Yes                              |
| University matching    | No                                                     | No                       | No                          | Yes                              |
| Approve university     | No                                                     | No                       | No                          | Yes                              |
| Accept challenge       | No                                                     | Yes, assigned only       | No                          | No                               |
| Create team            | No                                                     | Accepted university only | No                          | No                               |
| Create/submit proposal | No                                                     | Accepted university only | No                          | No                               |
| Discover proposals     | No                                                     | No                       | Submitted proposals only    | No dedicated discovery endpoint  |
| Fund/support           | No                                                     | No                       | Yes                         | No dedicated acceptance endpoint |
| Create project         | No                                                     | No direct endpoint       | On collaboration acceptance | No                               |
| Update project         | No                                                     | University owner         | No                          | No                               |
| View project           | Own submitter view                                     | Own university projects  | Supported projects          | All projects                     |
| Analytics              | No                                                     | No                       | No                          | Yes                              |
| Notifications          | Own only                                               | Own only                 | Own only                    | Own only                         |

## Complete Challenge Lifecycle

The actual problem state machine is centralized in `backend/src/domain/lifecycle.ts` and the project state machine is in `backend/src/domain/projectLifecycle.ts`.

| Stage                   | Actor, page, endpoint                                                                      | Service/controller and database change                                                                                                                                   | Status/audit/notification                                                                                                   | Next                                             |
| ----------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Account/login           | Any seeded role, `/`, `POST /api/auth/login`                                               | `auth.controller.ts` -> `AuthService`; `User` read and `RefreshSession` created                                                                                          | No problem status                                                                                                           | Role redirect                                    |
| Problem creation        | Submitter, `/my-problems`, `POST /api/problems`                                            | `problem.controller.ts` -> `ProblemService` -> `ProblemRepository`; creates `Problem` and initial `ProblemStatusHistory`                                                 | `SUBMITTED`; submitter and Ministry notifications                                                                           | Ministry review/AI request                       |
| AI analysis             | Ministry, `/ministry/problems`, `POST /api/problems/:id/ai-analysis`                       | `problemAi.controller.ts` -> `ProblemAiService` -> `ProblemAiRepository` and provider; creates `ProblemAIAnalysis`                                                       | Analysis `PENDING -> PROCESSING -> COMPLETED/FAILED`; successful completion notifies submitter; problem status is unchanged | Ministry evaluates advisory result               |
| Ministry review         | Ministry, `/ministry/problems`, `POST /api/problems/:id/transition` with `MINISTRY_REVIEW` | `problem.controller.ts` -> `ProblemService` -> lifecycle repository                                                                                                      | `MINISTRY_REVIEW`; `ProblemStatusHistory` and submitter lifecycle notification                                              | Approve or reject                                |
| Ministry decision       | Ministry, same endpoint with `MINISTRY_APPROVED` or `MINISTRY_REJECTED`                    | Same service/repository transition guard                                                                                                                                 | Decision status and history; submitter notification                                                                         | Approved problems can be matched                 |
| University matching     | Ministry, `/ministry/problems`, `POST /api/university-matching/problems/:id/match`         | `universityMatching.controller.ts` -> `UniversityMatchingService`; `ProblemEmbedding`, `UniversityKnowledgeEmbedding`, `UniversityMatchingRun`, `ProblemUniversityMatch` | `AI_UNIVERSITY_MATCHED -> UNIVERSITIES_RECOMMENDED`; problem history; no automatic approval                                 | Ministry reviews recommendations                 |
| Recommendation decision | Ministry, `/ministry/problems`; approve/remove/add endpoints                               | Matching service/repository updates `MatchDecision`, evidence, approving/removing actor                                                                                  | `MINISTRY_APPROVED_UNIVERSITIES` after selected approval; no automatic invitation                                           | Ministry sends invitations                       |
| Invitations             | Ministry, `/ministry/problems`, `POST /api/collaboration/problems/:id/invitations`         | University collaboration service/repository creates/updates `UniversityProblemAssignment`                                                                                | `INVITATIONS_SENT`; history; invitation notifications to university users                                                   | Universities respond                             |
| University acceptance   | University, `/university`, `POST /api/collaboration/university/assignments/:id/accept`     | Transactional assignment repository conditionally accepts one row, cancels competing invites, creates `UniversityProjectContext`                                         | `UNIVERSITY_ACCEPTED`; history and participant/Ministry notifications                                                       | Accepted university forms team                   |
| Team                    | University, `/university`, `PUT /api/collaboration/university/assignments/:id/team`        | Team service/repository creates `ProjectTeam` and `TeamMember`                                                                                                           | `TEAM_FORMED` on first team creation; history and participant notification                                                  | Draft proposal                                   |
| Proposal draft          | University, `/university`, `PUT .../proposal`                                              | Proposal service/repository creates or updates `Proposal`                                                                                                                | Proposal `DRAFT`; problem `PROPOSAL_DRAFT`; history on first draft; no industry visibility                                  | University completes draft                       |
| Proposal submission     | University, `/university`, `POST .../proposal/submit`                                      | Proposal service/repository changes `Proposal.status`                                                                                                                    | Proposal `SUBMITTED`; problem `PROPOSAL_SUBMITTED`; history; submitter/university/industry notifications                    | Industry review/discovery                        |
| Industry interest       | Industry, `/industry`, `POST /api/collaboration/industry/proposals/:id/interests`          | Industry service/repository creates `IndustryProposalInterest`; proposal may enter `UNDER_INDUSTRY_REVIEW`                                                               | Problem `INDUSTRY_REVIEW` when applicable; history; university notification                                                 | Industry may accept                              |
| Partnership/funding     | Industry, `/industry`, `POST .../interests/:id/accept`                                     | Transaction changes interest/proposal/collaboration, optionally creates `IndustryFunding`, and creates `Project`                                                         | Problem `INDUSTRY_ACCEPTED -> COLLABORATION_CONFIRMED`; histories; collaboration notification                               | Project delivery                                 |
| Project creation        | Industry acceptance transaction, no separate create endpoint                               | `IndustryCollaboration`, `Project`, links to proposal/team/context/industry                                                                                              | Project starts `INITIATED`; collaboration is `CONFIRMED`                                                                    | University manages execution                     |
| Milestones              | University, `/projects`, `POST/PUT /api/projects/:id/milestones...`                        | Project service/repository creates/updates `ProjectMilestone`                                                                                                            | Milestone status/progress; project stakeholder notification                                                                 | Progress updates                                 |
| Updates/documents       | University, `/projects`, `POST /api/projects/:id/updates` and `/documents`                 | Creates `ProjectUpdate` and `ProjectDocument` metadata                                                                                                                   | Stakeholder notification with `COLLABORATION_UPDATE`; no separate document binary upload                                    | Continue project                                 |
| Project status          | University, `/projects`, `POST /api/projects/:id/status`                                   | Project service/repository validates centralized transitions, conditionally updates `Project.status`, writes `ProjectStatusHistory`, and mirrors problem lifecycle       | `PROTOTYPE_DEVELOPMENT`, `FIELD_PILOT`, `IMPLEMENTATION`, `IMPACT_MEASURED`, or `COMPLETED`; stakeholder notification       | Next valid state                                 |
| Impact                  | University, `/projects`, `PUT /api/projects/:id/impact`                                    | Upserts `ImpactMeasurement`                                                                                                                                              | Stakeholder notification; project status is not automatically changed                                                       | University explicitly moves to `IMPACT_MEASURED` |
| Completion/tracking     | University completes; Ministry/industry/submitter view `/projects` or problem detail       | Project and problem records remain linked; analytics aggregates SQL                                                                                                      | `COMPLETED`, completion timestamps, histories, notifications; submitter sees simplified lifecycle                           | Ministry analytics/reporting                     |

## Challenge Submission Flow Reality Check

1. Endpoint: `POST /api/problems`.
2. Initial state: `SUBMITTED`, not `DRAFT`.
3. Submit creates the problem, initial status history, and notifications.
4. AI does **not** run automatically on submit.
5. The configured problem-analysis implementation is a real OpenAI SDK provider when `OPENAI_API_KEY` exists; absent key produces a persisted safe failure.
6. Analysis is stored in `ProblemAIAnalysis` as an attempt.
7. Fields include societal validity, decision, reason, category, summary, keywords, expertise, facilities, solution areas, priority, confidence, model, prompt version, raw structured response, processing state, and failure reason.
8. OpenAI is actually called only when the backend has a key and Ministry triggers analysis; it was not required for the deterministic suite.
9. Gemini is not implemented and is not a dependency.
10. No embedding is generated by problem submission or problem analysis itself.
11. pgvector is used by the separate Ministry matching/duplicate-detection flow.
12. Duplicate detection is vector-based when matching is triggered, not lexical-only.
13. A problem classified invalid is stored as an advisory `INVALID` analysis; it is not automatically rejected.
14. Ministry can still review the problem and make an explicit decision.
15. Ministry uses `POST /api/problems/:problemId/transition`.
16. Approval creates `MINISTRY_APPROVED` and a history record.
17. Matching is a separate Ministry-triggered action after approval.
18. Universities are selected through vector retrieval plus ranking and Ministry approve/remove/add controls.
19. Submitters see their own status history at `/my-problems` and `/problems/[id]`; they cannot see another submitter's records.

## AI Architecture

| Capability             | Classification                                            | Actual implementation                                                                                                       |
| ---------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| OpenAI problem LLM     | REAL when key configured; FAILED/pending path without key | Official OpenAI SDK, dedicated provider, strict JSON schema plus Zod validation                                             |
| Gemini                 | MISSING                                                   | No dependency or integration found                                                                                          |
| Problem classification | REAL/PARTIAL                                              | Real OpenAI structured result when configured; no-key path is failure, not a fake classification                            |
| Embeddings             | REAL/PARTIAL                                              | Real OpenAI embeddings when configured; deterministic token-hash 1,536-vector provider for non-production development       |
| pgvector               | REAL                                                      | Actual `vector` extension, vector columns, HNSW indexes, cosine `<=>` retrieval                                             |
| Duplicate detection    | REAL/PARTIAL                                              | pgvector similarity with threshold `0.78`; development embeddings are deterministic fallback                                |
| University matching    | REAL/PARTIAL                                              | Traceable indexing, pgvector retrieval, grounded OpenAI ranking when configured, deterministic development ranker otherwise |
| Grounded justification | REAL                                                      | Ranking output source IDs are validated against retrieved evidence before persistence                                       |

## University Matching

The matching path is Ministry-only and requires a Ministry-approved problem. University sources are normalized into traceable searchable records for university profile, faculty profile, research area, laboratory, facility, and previous project. Each record stores source type, source ID, university ID, content text, model, dimensions, metadata, and vector.

The problem text combines title, description, context, geography, desired outcome, category, completed AI summary/keywords/expertise/facilities/solution areas, and supporting information. The service creates/updates a `ProblemEmbedding`, retrieves approved-university knowledge using PostgreSQL cosine similarity, groups evidence by university, then sends only retrieved candidate evidence to the ranking provider. The output is restricted to top five ranked universities and source IDs. Unsupported university/evidence IDs are rejected before persistence.

Development without an OpenAI key uses `development-token-hash-1536` and `development-grounded-heuristic-ranker`; these are explicitly demo components, not production semantic quality. Ministry controls recommendation approval, removal, and manual addition. Invitations are not sent until Ministry approval and dispatch.

Duplicate detection reuses the problem embedding and PostgreSQL cosine search, reports candidates at or above `0.78`, and does not merge, reject, or automatically decide.

## University Workflow

The university uses the seeded account to log in, then `/university` calls `GET /api/collaboration/university/assignments`. Assignment access is scoped through the authenticated user's linked university. The university may accept or reject only its own invitation. Acceptance is a conditional transaction with the partial unique database guard, cancellation of competing pending invitations, lifecycle history, notifications, and a `UniversityProjectContext`. The concurrent integration test verifies exactly one winner.

The accepted university saves a team using the team endpoint. The payload always includes a faculty mentor and may include research members with roles. It then saves a private proposal draft and submits it. Only submitted proposals are returned to industry. Submitted proposals cannot be edited by the university MVP endpoint after submission, and industry has read-only proposal access.

## Industry Workflow

The industry uses `/industry` and `GET /api/collaboration/industry/proposals` to discover only submitted proposals with eligible problem status. Filters include domain, technology, university, expertise, budget, and support type. Detail access records one deduplicated proposal view per industry/proposal.

Industry can express one interest per proposal, select `FUNDING`, `MENTORSHIP`, `TECHNICAL_SUPPORT`, `INFRASTRUCTURE`, `PILOT_SUPPORT`, or `OTHER`, and add a message. Acceptance records collaboration status and support summary, can create a funding record with amount/currency/conditions/status, changes the proposal/interest/problem lifecycle, and creates a project in one transaction. There is no payment processing. Industry project reads are organization-scoped.

## Project Lifecycle

Project enum values are `COLLABORATION_CONFIRMED`, `INITIATED`, `PROTOTYPE_DEVELOPMENT`, `FIELD_PILOT`, `IMPLEMENTATION`, `IMPACT_MEASURED`, `COMPLETED`, `ON_HOLD`, and `CANCELLED`. Projects created by industry acceptance start at `INITIATED`; the problem lifecycle is already `COLLABORATION_CONFIRMED`.

Only university users can call project mutation endpoints. `ProjectService` and `ProjectRepository` validate transitions through the project state machine, use conditional updates, append `ProjectStatusHistory`, mirror the corresponding problem transition for delivery stages, and notify university, industry, Ministry, and submitter stakeholders. Milestones, updates, documents, and impact records are relational and structured. Ministry and industry have full visibility; submitters receive a simplified role-scoped view.

## Analytics

`GET /api/analytics/ministry` is Ministry-only. `AnalyticsService` runs dedicated repository aggregations for overview KPIs, problem status/category/district/time/decision/acceptance, university participation, industry discovery/interest/collaboration/funding, project stages/delays/progress, and impact totals. The implementation uses PostgreSQL aggregation rather than loading complete tables into Node.js. The frontend is `/ministry/analytics`.

## Notifications

Notifications are stored in `Notification` with recipient, typed event, title, message, optional related entity and metadata, read timestamp, and creation timestamp. Event fan-out exists for problem submission/lifecycle, completed AI analysis, university invitations, team/proposal events, industry interest, collaboration confirmation, milestones, project updates/status, documents, impact, and completion. Retrieval, unread count, mark-read, and mark-all-read are recipient-scoped. The frontend uses refresh/polling, not WebSockets.

## Known Limitations

- Actual binary uploads, signed URLs, antivirus scanning, and cloud storage are not implemented; only metadata references exist.
- Live OpenAI calls require a user-provided key. The deterministic suite uses mocked providers or the development matching fallback.
- Funding is tracking only; there are no payments or settlement controls.
- Registration/profile management has backend APIs and dedicated public application and Ministry review screens; full profile-edit UX remains limited.
- No frontend automated test suite is configured.
- Production rate limiting, secret management, monitoring, backups, deployment configuration, and operational SLOs are NOT VERIFIED.
- Prisma's `package.json#prisma` configuration is deprecated for Prisma 7.
- `npm audit --audit-level=high` reports three high findings in the Prisma development dependency chain; no breaking forced fix was applied.

## Known Security Issues

No reproducible authentication, authorization, IDOR, unsafe-SQL, secret-exposure, password-handling, validation, or stack-trace disclosure issue was found in this audit. The backend reloads active users for authorization, scopes repository queries, validates UUIDs and request bodies, parameterizes raw SQL through Prisma tagged queries, and keeps the OpenAI key backend-only.

The following are production hardening gaps rather than verified vulnerabilities: no rate limiter, no binary-upload scanning pipeline, no production secret manager/rotation policy, and no independent browser security assessment. These are NOT VERIFIED for production suitability.

## Known Mock/Demo Components

- Deterministic token-hash embeddings and heuristic ranking are used for development when no OpenAI key is configured.
- E2E tests inject deterministic mock AI providers.
- Seed organizations, people, URLs, projects, and credentials are synthetic.
- Provider-neutral storage references stand in for a real storage service.

## Recommended Next Fixes

The next recommended development task is to implement the provider-neutral file-storage adapter and secure upload pipeline (size/type validation, signed retrieval, malware scanning, and tests), because evidence and project documents are currently metadata-only. After that, add browser E2E coverage and production deployment hardening.
