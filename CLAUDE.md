# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CursosMaroquio** is a learning management system (LMS) for on-demand courses with interactive static lessons. The platform serves in-person students with rich, versioned content bundles (HTML/CSS/JS) with access control and progress tracking.

## Monorepo Structure

```
/
├── backend/     # Bun + Elysia API (Clean Architecture + DDD + CQRS)
├── frontend/    # React + Vite + Mantine
└── PRD.md       # Product requirements
```

## Build & Development Commands

### Backend (from `/backend`)

```bash
bun install              # Install dependencies
bun run dev              # Dev server with hot reload (port 3000)
bun run build            # Build to ./dist
bun run type-check       # TypeScript validation

# Database
bun run db:push          # Apply schema (dev)
bun run db:migrate       # Run migrations
bun run db:studio        # Drizzle Studio GUI

# Testing
bun run test             # Vitest unit tests
bun run test:bun         # Bun integration/E2E tests
bun run test:all         # All test suites

# Run single test
bunx vitest run tests/unit/path/to/test.test.ts
bun test tests/e2e/auth.bun.test.ts --preload ./tests/bun-preload.ts

# i18n
bun run i18n             # Update i18n types
```

### Frontend (from `/frontend`)

```bash
npm install              # Install dependencies
npm run dev              # Vite dev server (port 5173)
npm run build            # Production build
npm run lint             # ESLint
```

### Docker (from `/backend`)

```bash
docker-compose up -d     # Start PostgreSQL + pgAdmin
# Database: postgresql://app:app@localhost:5435/app
# pgAdmin: http://localhost:5050 (admin@admin.com / admin)
```

## Backend Architecture

Clean Architecture with bounded contexts:

```
backend/src/
├── contexts/
│   ├── auth/                # Users, roles, permissions, OAuth
│   │   ├── domain/          # Entities, Value Objects, Repository interfaces
│   │   ├── application/     # Commands, Queries, Handlers
│   │   ├── infrastructure/  # Drizzle repos, services, mappers
│   │   └── presentation/    # Controllers, middleware
│   └── courses/             # Courses, lessons, enrollments, bundles
│       └── (same structure)
├── shared/                  # Base classes, utilities, middleware
└── infrastructure/
    ├── di/Container.ts      # Manual DI factory
    └── database/            # Connection, migrations, seeds
```

### Path Aliases

- `@shared/*` → `./src/shared/*`
- `@auth/*` → `./src/contexts/auth/*`
- `@courses/*` → `./src/contexts/courses/*`
- `@infrastructure/*` → `./src/infrastructure/*`

### Key Patterns

**CQRS**: Commands (writes) and Queries (reads) are separate handlers.

**Result Pattern**: Handlers return `Result<T, E>`, not exceptions. Use `Result.ok()` / `Result.fail()`.

**Value Objects**: Email, Password, UserId are immutable with validation in factory methods.

**Repository Pattern**: Interface in domain layer, Drizzle implementation in infrastructure.

**Manual DI**: `Container.ts` creates object graphs. Singletons: DatabaseProvider, TokenService. Transient: Repositories, Handlers.

### Adding Backend Features

1. **Domain** (`contexts/[context]/domain/`): Create entities, value objects, repository interface
2. **Application** (`contexts/[context]/application/`): Write Command/Query + Handler
3. **Infrastructure** (`contexts/[context]/infrastructure/`): Implement repository, schema, mapper
4. **Presentation** (`contexts/[context]/presentation/`): Create controller
5. **Wire up** (`infrastructure/di/Container.ts`): Add factory methods
6. **Register routes** (`main.ts`): Call `controller.routes(app)`

## Frontend Architecture

```
frontend/src/
├── api/           # Axios client + API modules (auth, courses, enrollments)
├── stores/        # Zustand stores (auth, courses, theme)
├── pages/         # Route components (Home, Login, Dashboard, admin/*, courses/*)
├── components/    # Reusable UI (layout/, auth/, courses/, admin/, common/)
├── routes/        # React Router config
├── hooks/         # Custom React hooks
├── types/         # TypeScript definitions
├── utils/         # Helpers (storage, token parsing)
├── theme/         # Mantine theme customization
└── i18n/          # i18next setup
```

## Testing Conventions

- **Unit tests** (Vitest): `tests/unit/**/*.test.ts` — Domain logic, handlers
- **Integration tests** (Bun): `tests/integration/**/*.bun.test.ts` — Repositories
- **E2E tests** (Bun): `tests/e2e/**/*.bun.test.ts` — HTTP flows

Mock repositories in unit tests; use real DB in integration tests.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend Runtime | Bun |
| Backend Framework | Elysia |
| Database | PostgreSQL + Drizzle ORM |
| Auth | JWT dual-token (15min access + 7d refresh), OAuth via Arctic |
| Frontend | React 19 + Vite 7 |
| UI Library | Mantine 8 |
| State | Zustand |
| i18n | typesafe-i18n (backend), i18next (frontend) |

## Section Bundles

Section Bundles are versioned content packages (HTML/CSS/JS) for lesson sections. Each section can have multiple bundle versions, with one active at a time.

### API Endpoints

**Admin (requires `courses:*` permission):**
- `POST /v1/admin/sections/:sectionId/bundles` — Upload bundle (multipart/form-data with ZIP)
- `GET /v1/admin/sections/:sectionId/bundles` — List all bundle versions
- `POST /v1/admin/section-bundles/:bundleId/activate` — Activate a specific version
- `DELETE /v1/admin/section-bundles/:bundleId` — Delete a bundle version

**Public:**
- `GET /v1/sections/:sectionId/bundle` — Get active bundle for a section

### Key Files

| Layer | File |
|-------|------|
| Domain Entity | `backend/src/contexts/courses/domain/entities/SectionBundle.ts` |
| Repository | `backend/src/contexts/courses/infrastructure/persistence/drizzle/DrizzleSectionBundleRepository.ts` |
| Admin Controller | `backend/src/contexts/courses/presentation/http/SectionBundleAdminController.ts` |
| Frontend Renderer | `frontend/src/components/courses/SectionRenderer.tsx` |
| Lesson Player | `frontend/src/pages/courses/LessonPlayer.tsx` |

## API Documentation

- Swagger UI: `http://localhost:3000/swagger`
- Health check: `GET /health`
- Metrics: `GET /metrics`

## Key Documentation

- `PRD.md` — Product requirements and course curriculum
- `backend/docs/ENDPOINTS.md` — API reference
- `backend/docs/readme/03-architecture.md` — Architecture details
- `backend/docs/readme/06-feature-tutorial.md` — Feature implementation guide
