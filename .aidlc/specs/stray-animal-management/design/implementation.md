# Implementation — ระบบจัดการสัตว์จรจัด

## Summary
- **Repo**: Monorepo (Turborepo)
- **Package Manager**: pnpm
- **Language**: TypeScript 5.x (strict mode)
- **Code Style**: ESLint + Prettier
- **Branch Strategy**: GitHub Flow (main + feature branches)

## Directory Structure

```
stray-animal-management/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/            # App Router (Next.js 14)
│   │   │   ├── components/     # Shared UI components
│   │   │   ├── features/       # Feature-based modules
│   │   │   │   ├── animals/
│   │   │   │   ├── reports/
│   │   │   │   ├── health/
│   │   │   │   ├── adoption/
│   │   │   │   ├── community/
│   │   │   │   ├── map/
│   │   │   │   └── dashboard/
│   │   │   ├── hooks/
│   │   │   ├── lib/            # Utilities, API client
│   │   │   └── styles/
│   │   ├── public/
│   │   └── package.json
│   │
│   └── api/                    # NestJS backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── animal/      # Animal Registry module
│       │   │   ├── report/      # Citizen Reporting module
│       │   │   ├── health/      # Health & Medical module
│       │   │   ├── adoption/    # Adoption module
│       │   │   ├── community/   # Community module
│       │   │   ├── map/         # Map & Dashboard module
│       │   │   └── auth/        # Foundation: Auth/RBAC
│       │   ├── shared/
│       │   │   ├── guards/      # Auth guards, RBAC
│       │   │   ├── pipes/       # Validation pipes
│       │   │   ├── filters/     # Exception filters
│       │   │   ├── interceptors/
│       │   │   ├── decorators/
│       │   │   └── services/    # Notification, Image, etc.
│       │   ├── prisma/
│       │   │   ├── schema.prisma
│       │   │   └── migrations/
│       │   ├── config/
│       │   └── main.ts
│       ├── test/
│       │   ├── unit/
│       │   ├── integration/
│       │   ├── e2e/
│       │   └── properties/     # Property-based tests
│       └── package.json
│
├── packages/
│   ├── shared-types/           # Shared TypeScript types/interfaces
│   │   ├── src/
│   │   │   ├── entities/
│   │   │   ├── dto/
│   │   │   └── enums/
│   │   └── package.json
│   ├── ui/                     # Shared UI components library
│   │   ├── src/
│   │   └── package.json
│   └── config/                 # Shared configs (ESLint, TypeScript, Tailwind)
│       └── package.json
│
├── infrastructure/             # IaC (AWS CDK หรือ Terraform)
│   ├── lib/
│   └── package.json
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .env.example
├── docker-compose.yml          # Local dev (PostgreSQL, Redis)
└── README.md
```

## Module Structure (NestJS)

แต่ละ module ใน `apps/api/src/modules/` มีโครงสร้าง:

```
modules/{module-name}/
├── {module}.module.ts          # NestJS module definition
├── {module}.controller.ts      # REST endpoints
├── {module}.service.ts         # Business logic
├── {module}.repository.ts      # Data access (Prisma)
├── dto/                        # Request/Response DTOs (class-validator)
│   ├── create-{entity}.dto.ts
│   └── update-{entity}.dto.ts
├── entities/                   # Domain entities (if different from Prisma)
├── guards/                     # Module-specific guards
└── __tests__/
    ├── {module}.service.spec.ts
    ├── {module}.controller.spec.ts
    └── {module}.properties.spec.ts  # PBT tests
```

## Conventions

### Naming
- Files: kebab-case (`animal-registry.service.ts`)
- Classes: PascalCase (`AnimalRegistryService`)
- Functions/methods: camelCase (`findByDistrict`)
- Constants: UPPER_SNAKE_CASE (`MAX_UPLOAD_SIZE`)
- Database tables: PascalCase (Prisma default)
- API routes: kebab-case (`/api/v1/medical-records`)

### API Response Envelope
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  meta?: { page: number; limit: number; total: number };
}
```

### Error Handling
- NestJS Exception Filters (global)
- Custom `AppException` class with error codes
- HTTP status codes: 400 validation, 401 unauthorized, 403 forbidden, 404 not found, 500 internal

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/stray_animal?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=xxx
JWT_EXPIRES_IN=7d

# LINE OA
LINE_CHANNEL_ID=xxx
LINE_CHANNEL_SECRET=xxx
LINE_ACCESS_TOKEN=xxx

# AWS
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=stray-animal-images
AWS_CLOUDFRONT_URL=https://cdn.example.com

# App
APP_URL=https://app.example.com
NODE_ENV=development
```
