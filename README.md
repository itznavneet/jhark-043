# Societal Innovation Collaboration Portal

Societal Innovation Collaboration Portal is a planned production-style MVP for SIH Problem Statement 26043:

> A digital platform to crowdsource societal challenges and facilitate collaborative problem solving through universities and industry partnerships.

The portal will connect problem submitters, Ministry administrators, universities, higher education institutions, industries, startups, MSMEs, and CSR organizations through a Ministry-governed problem-to-impact lifecycle.

## Status

The repository is currently in **Phase 0 - Project Initialization**. This phase establishes the repository structure and documentation foundation. Product features are not implemented yet.

## Architecture overview

The planned system has separate Next.js and Express.js applications. The frontend will consume backend APIs. The backend will use routes, controllers, services, and repositories, with dedicated modules for lifecycle management, authentication/RBAC, AI analysis, university matching, collaboration, and impact tracking. PostgreSQL with pgvector will provide transactional storage and semantic retrieval.

## Technology stack

- Next.js, TypeScript, and Tailwind CSS for the frontend
- Express.js and TypeScript for the backend
- PostgreSQL in Docker for local development
- pgvector for semantic university/proposal matching
- Prisma as the ORM, with isolated raw SQL only if required for vector operations
- OpenAI API for explainable validation, extraction, and recommendations
- JWT authentication and backend-enforced role-based access control

## Planned modules

- Problem submission and submitter profiles
- AI problem validation and structured analysis
- Ministry review and decision workflows
- University profiles, semantic matching, and invitations
- University teams and solution proposals
- Industry discovery, support, and funding
- Project progress, field pilots, implementation, and impact measurement
- Lifecycle history, auditability, dashboards, notifications, and reporting

## Local development prerequisites

The planned development environment requires:

- Node.js and npm (versions to be pinned during Phase 1)
- Docker Desktop with Docker Compose
- PostgreSQL-compatible local container support with pgvector (provided by `docker-compose.yml`)
- OpenAI API access for future AI integration

Create a local `.env` file with the PostgreSQL variables expected by Docker Compose before starting the database. Do not commit it.

## Future commands

Application run, lint, typecheck, test, migration, and build commands will be added when the frontend and backend packages are initialized. At present, there are no application dependencies or feature commands to run.
