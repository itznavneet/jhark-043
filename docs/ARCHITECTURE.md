# Architecture

## Status

This document describes the intended architecture at Phase 0. The repository structure and local PostgreSQL/pgvector compose scaffold are established; application modules are planned, not implemented.

## Frontend (planned)

The frontend will be a standalone Next.js application written in TypeScript and styled with Tailwind CSS. It will provide role-aware experiences for submitters, Ministry administrators, universities, and industries, while using a typed client to communicate with the Express backend.

The frontend will not contain authoritative business rules, OpenAI calls, database access, or backend API routes for this product.

## Backend (planned)

The backend will be a standalone Express.js application written in TypeScript. Its feature modules will follow:

```text
HTTP routes -> controllers -> application/domain services -> repositories
                                             -> AI services where applicable
```

Controllers will translate HTTP concerns. Services will own use cases, authorization-aware orchestration, transactions, and business rules. Repositories will own persistence access.

## Database (scaffolded, schema planned)

PostgreSQL will be run locally through Docker using a pgvector-capable image. The initialization script enables the `vector` extension. The Prisma schema, migrations, indexes, constraints, and application data model are planned for Phase 1 and have not been created.

The eventual model is expected to include users and roles, submitter profiles/types, organizations, problems, AI analyses, university capabilities, embeddings, recommendations, invitations, teams, proposals, industry collaborations, project milestones, impact measurements, and append-only status history.

## AI layer (planned)

Dedicated backend AI services will wrap the OpenAI API. The planned problem pipeline is:

```text
problem understanding -> structured validation/extraction -> embedding
       -> pgvector retrieval -> candidate university context
       -> LLM ranking/reasoning -> top five recommendations with justifications
```

AI will provide validation, categorization, extraction, semantic matching, ranking, and explanations. It will never approve or reject a problem, university, invitation, or collaboration on behalf of the Ministry.

## Authentication and RBAC (planned)

The backend will authenticate users with JWTs and enforce role-based permissions for `MINISTRY_ADMIN`, `SUBMITTER`, `UNIVERSITY`, and `INDUSTRY`. Frontend route visibility will be treated as a usability concern only; backend authorization will be authoritative. University and industry onboarding will support Ministry approval.

## Lifecycle management (planned)

The problem/project lifecycle will be implemented as an explicit domain state machine. It will validate allowed transitions and actor permissions in one reusable module rather than scattering status string comparisons across controllers.

The lifecycle will support:

`SUBMITTED` -> AI validation -> Ministry review/decision -> university matching/recommendation -> Ministry university approval -> invitations -> one accepted university -> team -> proposal -> industry collaboration -> prototype -> field pilot -> implementation -> impact measurement -> completion.

Every important transition will append a status-history record containing status, actor, timestamp, and optional reason/comment. The accepted-university operation will use a transaction and database constraints/locking strategy so concurrent acceptances cannot produce multiple accepted universities.

## Semantic search (planned)

University matching will search embeddings stored in PostgreSQL with pgvector. Searchable context will include university profiles, faculty, research areas, laboratories, facilities, innovation centers, incubation facilities, and previous projects. Similarity retrieval will produce candidates for explainable LLM ranking. Vector persistence and similarity queries will be isolated behind repositories; Prisma will remain the default ORM for the rest of the data model.

## Major planned modules

- Identity, onboarding, authentication, and RBAC
- Problem intake, submitter profiles, and problem lifecycle
- AI validation, extraction, embeddings, and recommendation explanations
- Ministry review, approvals, invitations, and oversight
- University capability profiles, teams, proposals, and project progress
- Industry proposal discovery, support, funding, and monitoring
- Collaboration milestones, field pilots, implementation, and impact
- Status history, auditability, notifications, dashboards, and reporting

## Implemented vs planned

| Area | Implemented in Phase 0 | Planned |
| --- | --- | --- |
| Repository foundation | Root folders, documentation, and ignore rules | Application package setup |
| Frontend | Directory placeholder only | Next.js UI and API client |
| Backend | Directory placeholder only | Express API and feature modules |
| Database | Docker Compose scaffold and pgvector init script | Prisma schema, migrations, and repositories |
| AI | None | OpenAI services, embeddings, retrieval, and explanations |
| Auth/RBAC | None | JWT, roles, onboarding, and authorization middleware |
| Lifecycle | Domain requirements documented | State machine, transitions, and status history |
