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
