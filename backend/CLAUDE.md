# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
bun install              # Install dependencies
bun run dev              # Development server with hot reload
bun run start            # Production server
bun run build            # Build to ./dist
bun run type-check       # TypeScript validation (no emit)
```

## Database Commands

```bash
bun run db:push          # Apply schema changes (dev)
bun run db:generate      # Generate migrations
bun run db:migrate       # Run migrations
bun run db:studio        # Drizzle Studio GUI
```

## Testing Commands

```bash
bun run test             # Run Vitest unit tests
bun run test:watch       # Vitest in watch mode
bun run test:bun         # Run Bun integration/e2e tests
bun run test:all         # Run all test suites

# Run single test file
bunx vitest run tests/unit/domain/entities/User.test.ts
bun test tests/e2e/auth.bun.test.ts --preload ./tests/bun-preload.ts
```

## Architecture Overview

This is a **Clean Architecture + DDD + CQRS** backend using Bun, Elysia, and Drizzle ORM.

### Layer Structure (dependencies point inward)

```
src/
├── contexts/
│   ├── auth/                # Auth Bounded Context (users, roles, permissions, OAuth)
│   │   ├── domain/          # Entities, Value Objects, Domain Events, Repository interfaces
│   │   ├── application/     # Commands, Queries, Handlers (use cases)
│   │   ├── infrastructure/  # Drizzle repositories, services, mappers
│   │   └── presentation/    # Controllers, middleware
│   └── courses/             # Courses Bounded Context (courses, lessons, enrollments)
│       ├── domain/          # Course, Lesson, Enrollment entities + VOs
│       ├── application/     # CQRS handlers for courses
│       ├── infrastructure/  # Drizzle repositories, mappers
│       └── presentation/    # CourseAdmin, CoursePublic, Enrollment controllers
├── shared/                  # Shared Kernel (base classes, utilities)
└── infrastructure/
    ├── di/Container.ts      # Manual dependency injection factory
    └── database/            # Connection, migrations, seeds
```

### Path Aliases

- `@shared/*` → `./src/shared/*`
- `@auth/*` → `./src/contexts/auth/*`
- `@courses/*` → `./src/contexts/courses/*`
- `@infrastructure/*` → `./src/infrastructure/*`

### Key Patterns

**CQRS**: Commands (writes) and Queries (reads) are separate. Commands use rich domain entities; Queries return DTOs.

**Result Pattern**: All handlers return `Result<T, E>` instead of throwing exceptions. Use `Result.ok()` / `Result.fail()`.

**Value Objects**: Email, Password, UserId, Role, Permission are immutable VOs with validation in factory methods.

**Domain Events**: Entities emit events (UserCreated, RoleAssigned) captured by handlers. Events flow: Entity → DomainEventPublisher → EventHandlers.

**Repository Pattern**: Interface in domain (`IUserRepository`), implementation in infrastructure (`DrizzleUserRepository`).

**Manual DI**: `Container.ts` creates object graphs with factory methods. Singletons: DatabaseProvider, TokenService. Transient: Repositories, Handlers.

## Adding New Features

1. **Domain** (`contexts/[context]/domain/`): Create entities, value objects, events, repository interface
2. **Application** (`contexts/[context]/application/`): Write Command/Query + Handler
3. **Infrastructure** (`contexts/[context]/infrastructure/`): Implement repository, add schema, create mapper
4. **Presentation** (`contexts/[context]/presentation/`): Create controller
5. **Wire up** (`infrastructure/di/Container.ts`): Add factory methods
6. **Register routes** (`main.ts`): Call `controller.routes(app)`

## Testing Conventions

- **Unit tests** (Vitest): `tests/unit/**/*.test.ts` - Domain logic, handlers, mappers
- **Integration tests** (Bun): `tests/integration/**/*.bun.test.ts` - Repository implementations
- **E2E tests** (Bun): `tests/e2e/**/*.bun.test.ts` - Full HTTP request flows

Mock repositories in unit tests; use real DB in integration tests.

## Tech Stack

- **Runtime**: Bun (not Node.js)
- **Framework**: Elysia (Bun-native)
- **ORM**: Drizzle with PostgreSQL
- **Auth**: JWT dual-token (access + refresh), OAuth via Arctic
- **Validation**: TypeBox + Zod
