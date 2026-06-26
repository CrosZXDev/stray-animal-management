# Design — ระบบจัดการสัตว์จรจัด

## Summary
- **Architecture**: Modular Monolith (NestJS modules)
- **Stack**: Next.js (frontend) / NestJS (backend) / PostgreSQL+PostGIS (DB) / AWS ECS Fargate (infra)
- **Components**: 7 modules (Foundation, AnimalRegistry, CitizenReporting, HealthMedical, Adoption, Community, MapDashboard)
- **Entities**: 18 core entities
- **Endpoints**: 45+ REST API endpoints
- **Integrations**: 4 (LINE OA, S3+CloudFront, PostGIS/Leaflet, Redis)
- **PBT Properties**: 12 correctness properties defined
- **Testing Strategy**: Vitest + Supertest + fast-check + Playwright
- **NFR**: Performance, Scalability, Security (PDPA), Offline, Availability

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTS                                │
│  Web (Next.js)  |  LINE OA  |  Mobile (PWA)            │
└────────────┬──────────────────────────────┬─────────────┘
             │          HTTPS               │
             ▼                              ▼
┌─────────────────────────────────────────────────────────┐
│              API GATEWAY (NestJS)                         │
│  Auth Middleware → Rate Limit → Validation → Router     │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│              APPLICATION LAYER (NestJS Modules)           │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Animal  │  │ Citizen  │  │  Health  │             │
│  │ Registry │  │Reporting │  │ Medical  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Adoption │  │Community │  │   Map &  │             │
│  │          │  │          │  │Dashboard │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                          │
│  ┌──────────────────────────────────────────┐           │
│  │         SHARED / FOUNDATION               │           │
│  │  Auth, RBAC, Notification, ImageService  │           │
│  └──────────────────────────────────────────┘           │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│              DATA LAYER                                   │
│  PostgreSQL+PostGIS  |  Redis  |  S3 (images)           │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack (D3 Decisions)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14+ / React | SSR, mobile-first, code sharing via monorepo |
| UI | Tailwind CSS + Headless UI | Utility-first, lightweight, flexible |
| Backend | NestJS (TypeScript) | Modular, DI, TypeScript-native, suits Modular Monolith |
| API Style | REST + OpenAPI | Standard, cacheable, LINE webhook compatible |
| Database | PostgreSQL 16 + PostGIS | Relational, spatial queries, JSONB for flexible data |
| ORM | Prisma | Type-safe, auto-generated client, good DX |
| Auth | JWT + Custom RBAC | Stateless, LINE OAuth integration |
| Map | Leaflet + leaflet.heat | Open-source, lightweight, PostGIS compatible |
| Cache | Redis | Dashboard stats, search results, session cache |
| Image | AWS S3 + CloudFront | Scalable, CDN delivery, cost-effective |
| Compute | AWS ECS Fargate | Container, serverless-managed, auto-scale |
| CI/CD | GitHub Actions | Popular, good ecosystem, free for OSS |
| Repo | Monorepo + Turborepo | Shared code, consistent tooling |
| Testing | Vitest + Supertest + fast-check + Playwright | Full coverage |

## Design Documents

| Document | Path | Content |
|----------|------|---------|
| Components | `design/components.md` | Module specifications, responsibilities, interfaces |
| Data Model | `design/data-model.md` | Entity definitions, relationships, Prisma schema |
| API Spec | `design/api-spec.md` | REST endpoints, request/response, OpenAPI |
| Integration | `design/integration.md` | LINE OA, S3, PostGIS, Redis integration details |
| Implementation | `design/implementation.md` | Directory structure, conventions, module layout |
| Correctness | `design/correctness.md` | PBT properties, invariants, correctness criteria |
| Testing Strategy | `design/testing-strategy.md` | Test architecture, coverage mapping, tooling |

## Traceability

| Requirement | Component | Endpoints | Entities |
|-------------|-----------|-----------|----------|
| US-01 | AnimalRegistry | POST /animals | Animal, AnimalPhoto |
| US-02 | AnimalRegistry | POST /animals/check-duplicate | Animal, AnimalPhoto |
| US-03 | AnimalRegistry | GET /animals, GET /animals/:id | Animal |
| US-04 | AnimalRegistry | PATCH /animals/:id | Animal, AnimalHistory |
| US-05 | CitizenReporting | POST /reports | Report |
| US-06 | CitizenReporting | GET /reports/:trackingId | Report |
| US-07 | CitizenReporting | PATCH /reports/:id/assign, /resolve | Report, CaseAssignment |
| US-08 | CitizenReporting | GET /reports/leaderboard | ReporterScore, Badge |
| US-09 | HealthMedical | POST /animals/:id/medical-records | MedicalRecord |
| US-10 | HealthMedical | GET /vaccines/schedule | VaccineSchedule |
| US-11 | HealthMedical | POST /campaigns, PATCH /campaigns/:id | Campaign, CampaignResult |
| US-12 | HealthMedical | GET /stats/health | (aggregated) |
| US-13 | Adoption | GET /adoption/profiles | AdoptionProfile |
| US-14 | Adoption | POST /adopters, POST /adopters/:id/screening | Adopter, ScreeningResult |
| US-15 | Adoption | POST /adoption/applications | AdoptionApplication |
| US-16 | Adoption | GET /adoption/:id/followups | FollowUp |
| US-17 | Community | POST /feeding-stations, POST /check-in | FeedingStation, CheckIn |
| US-18 | Community | POST /volunteers, GET /assignments | Volunteer, Assignment |
| US-19 | Community | POST /foster | FosterPeriod |
| US-20 | Community | POST /donations | Donation |
| US-21 | MapDashboard | GET /map/heatmap, GET /map/markers | (spatial query) |
| US-22 | MapDashboard | POST /zones, PATCH /zones/:id/assign | Zone, ZoneAssignment |
| US-23 | MapDashboard | GET /dashboard/overview | (aggregated) |
| US-24 | MapDashboard | POST /tasks, PATCH /tasks/:id | Task |
| US-25 | MapDashboard | GET /reports/monthly | MonthlyReport |
| US-26 | Foundation | POST /auth/*, /users/* | User, Role |
| US-27 | Foundation | (infrastructure) | Consent, AuditLog |
| US-28 | Foundation | (infrastructure) | (performance config) |
