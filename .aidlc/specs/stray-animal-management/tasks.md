# Tasks — ระบบจัดการสัตว์จรจัด

## Summary
- **Total Tasks**: 35 tasks across 8 waves
- **Approach**: By module, test-alongside, mock integrations first
- **Granularity**: 1-2 days per task
- **Parallel**: Tasks within same wave can execute in parallel
- **Estimated Duration**: 5-6 เดือน (team 4-8)

## Task Dependency Graph

```
Wave 1: [T-01, T-02, T-03, T-04, T-05] (Foundation)
Wave 2: [T-06, T-07, T-08, T-09] (Animal Registry)
Wave 3: [T-10, T-11, T-12, T-13] (Citizen Reporting)
Wave 4: [T-14, T-15, T-16, T-17] (Health & Medical)
Wave 5: [T-18, T-19, T-20, T-21] (Adoption)
Wave 6: [T-22, T-23, T-24, T-25] (Community)
Wave 7: [T-26, T-27, T-28, T-29, T-30] (Map & Dashboard)
Wave 8: [T-31, T-32, T-33, T-34, T-35] (Integration & Polish)
```

---

## Wave 1: Foundation (ทุก task ทำ parallel ได้)

### T-01: Project Setup + Monorepo
- [x] สร้าง Turborepo monorepo structure (apps/web, apps/api, packages/*)
- [x] Setup pnpm workspace, turbo.json, shared tsconfig
- [x] Docker Compose (PostgreSQL+PostGIS, Redis)
- [x] ESLint + Prettier config (shared)
- [x] Setup .env.example + config module

**Files**: turbo.json, pnpm-workspace.yaml, docker-compose.yml, packages/config/*
**Depends on**: —

---

### T-02: Database Schema + Prisma Setup
- [x] Initialize Prisma in apps/api
- [x] Create schema.prisma with all 18 entities
- [x] Setup PostGIS extension via migration
- [x] Create spatial indexes
- [x] Seed script with sample data (6 animals, 3 reports)
- [x] Test: migration runs clean, seed data loads

**Files**: apps/api/src/prisma/schema.prisma, migrations/*, seed.ts
**Depends on**: T-01

---

### T-03: NestJS Backend Skeleton
- [x] Initialize NestJS app in apps/api
- [x] Setup global pipes (validation), filters (exception), interceptors (response envelope)
- [x] Create shared module (AppException, ApiResponse type, decorators)
- [x] Setup Swagger/OpenAPI auto-docs at /api/docs
- [x] Health check endpoint GET /api/health
- [x] Test: app boots, health endpoint returns 200

**Files**: apps/api/src/main.ts, shared/*, app.module.ts
**Depends on**: T-01

---

### T-04: Auth & RBAC Module
- [x] JWT authentication (login, register, refresh token)
- [x] LINE Login OAuth integration (mock for now)
- [x] RBAC guard with 8 roles (CITIZEN, ADOPTER, FEEDER, VOLUNTEER, VET, OFFICER, NGO, ADMIN)
- [x] @Roles() decorator + RolesGuard
- [x] PDPA consent middleware (check consent before data access)
- [x] Test: auth flow unit tests, RBAC guard tests

**Files**: apps/api/src/modules/auth/*
**Depends on**: T-02, T-03

---

### T-05: Next.js Frontend Skeleton
- [x] Initialize Next.js 14 app in apps/web (App Router)
- [x] Tailwind CSS + Headless UI setup
- [x] Layout: nav bar, mobile-responsive shell
- [x] Auth context (JWT storage, login/logout)
- [x] API client (fetch wrapper with auth headers)
- [x] Shared UI components package (packages/ui)
- [x] Thai language setup (font, locale)

**Files**: apps/web/src/*, packages/ui/*
**Depends on**: T-01

---

## Wave 2: Animal Registry

### T-06: Animal CRUD API
- [x] AnimalModule: controller, service, repository
- [x] POST /api/v1/animals (create with photo upload to S3 mock)
- [x] GET /api/v1/animals (search with filters: type, district, status, neutered)
- [x] GET /api/v1/animals/:id (full profile with history)
- [x] PATCH /api/v1/animals/:id (update status, info)
- [x] Auto-generate Animal ID (ANM-YYYYMMDD-XXXX)
- [x] GPS auto-detect support (accept lat/lng from client)
- [x] Pagination (20 items/page)
- [x] Test: unit + integration tests, PBT for ID generation uniqueness

**Files**: apps/api/src/modules/animal/*
**Depends on**: T-02, T-03, T-04

---

### T-07: Duplicate Detection
- [x] POST /api/v1/animals/check-duplicate (image similarity stub)
- [x] Basic duplicate detection by location + color + type (within 500m)
- [x] Merge endpoint: POST /api/v1/animals/:id/merge
- [x] Test: duplicate detection logic, merge preserves history

**Files**: apps/api/src/modules/animal/duplicate.service.ts
**Depends on**: T-06

---

### T-08: Animal Registry Frontend
- [x] หน้าลงทะเบียนสัตว์ (form with photo upload, GPS auto-detect)
- [x] หน้ารายการสัตว์ (search, filter, pagination)
- [x] หน้า profile สัตว์ (ข้อมูลละเอียด, timeline)
- [x] Mobile-responsive design

**Files**: apps/web/src/features/animals/*
**Depends on**: T-05, T-06

---

### T-09: Image Upload Service
- [x] S3 upload service (presigned URL approach)
- [x] Auto-thumbnail generation (resize to 200x200, 400x400)
- [x] CloudFront CDN URL generation
- [x] Max 10 images per animal, 10MB per file
- [x] Test: upload + thumbnail generation

**Files**: apps/api/src/shared/services/image.service.ts
**Depends on**: T-03

---

## Wave 3: Citizen Reporting

### T-10: Report CRUD API
- [x] ReportModule: controller, service, repository
- [x] POST /api/v1/reports (create, anonymous support)
- [x] GET /api/v1/reports/:trackingId (public tracking)
- [x] GET /api/v1/reports (admin: list with filters)
- [x] Auto-generate tracking ID (RPT-YYYYMMDD-XXXX)
- [x] SLA calculation (72h normal, 24h urgent, 4h critical)
- [x] Test: unit tests, PBT for SLA calculation correctness

**Files**: apps/api/src/modules/report/*
**Depends on**: T-02, T-03, T-04

---

### T-11: Case Workflow Engine
- [x] PATCH /api/v1/reports/:id/assign (assign to team)
- [x] PATCH /api/v1/reports/:id/resolve (mark resolved + notify reporter)
- [x] Auto-priority by type (abuse=CRITICAL, injured=HIGH, aggressive=HIGH, others=MEDIUM)
- [x] Escalation logic (no update 48h → escalate)
- [x] Notification stub (notify reporter on status change)
- [x] Test: workflow state transitions, escalation timing

**Files**: apps/api/src/modules/report/case-workflow.service.ts
**Depends on**: T-10

---

### T-12: Reporting Frontend
- [x] หน้าแจ้งเบาะแส (3-step form: type → details+location → submit)
- [x] หน้าติดตามสถานะ (timeline view)
- [x] หน้าจัดการ cases (admin: assign, resolve)
- [x] Push notification UI placeholder

**Files**: apps/web/src/features/reports/*
**Depends on**: T-05, T-10

---

### T-13: Gamification Service
- [x] ReporterScore tracking (10 points per verified report)
- [x] Badge system (Bronze:5, Silver:20, Gold:50)
- [x] GET /api/v1/reports/leaderboard (top 10 per district)
- [x] Test: score calculation, badge thresholds

**Files**: apps/api/src/modules/report/gamification.service.ts
**Depends on**: T-10

---

## Wave 4: Health & Medical

### T-14: Medical Record API
- [x] HealthModule: controller, service, repository
- [x] POST /api/v1/animals/:id/medical-records
- [x] GET /api/v1/animals/:id/medical-records
- [x] Offline sync support (accept offlineSync flag, sync later)
- [x] Auto-update animal status on sterilization record
- [x] Test: medical record CRUD, status transitions

**Files**: apps/api/src/modules/health/*
**Depends on**: T-06

---

### T-15: Vaccine Schedule + Reminders
- [x] Auto-calculate next vaccine date by type (rabies=1yr, 5in1=1yr)
- [x] GET /api/v1/vaccines/schedule (upcoming, overdue)
- [x] Reminder logic (7 days before → notify officer)
- [x] Overdue escalation (30 days past due → change status)
- [x] Test: schedule calculation, reminder timing, PBT for date arithmetic

**Files**: apps/api/src/modules/health/vaccine.service.ts
**Depends on**: T-14

---

### T-16: TNR Campaign Management
- [x] POST /api/v1/campaigns (create with target, budget, area)
- [x] PATCH /api/v1/campaigns/:id/record (record results)
- [x] GET /api/v1/campaigns (list with progress)
- [x] Campaign summary generation on completion
- [x] Test: progress tracking, budget calculation

**Files**: apps/api/src/modules/health/campaign.service.ts
**Depends on**: T-14

---

### T-17: Health Frontend
- [x] หน้าบันทึก medical record (offline-capable form)
- [x] หน้า vaccine schedule + overdue list
- [x] หน้า TNR campaign management
- [x] สถิติสุขภาพ (charts per district)

**Files**: apps/web/src/features/health/*
**Depends on**: T-05, T-14

---

## Wave 5: Adoption

### T-18: Adoption Profile API
- [x] AdoptionModule: controller, service, repository
- [x] GET /api/v1/adoption/profiles (filter: type, size, personality, child-friendly)
- [x] Auto-create AdoptionProfile when animal status = ADOPTABLE
- [x] Include health history in profile
- [x] Test: profile creation, filtering logic

**Files**: apps/api/src/modules/adoption/*
**Depends on**: T-06, T-14

---

### T-19: Screening + Matching
- [x] POST /api/v1/adopters (register + questionnaire)
- [x] POST /api/v1/adopters/:id/screening (auto-evaluate)
- [x] Matching algorithm (lifestyle → recommend 3-5 animals)
- [x] POST /api/v1/adoption/applications (apply to adopt)
- [x] Adoption flow: INTERESTED → MEETING → TRIAL → CONFIRMED
- [x] Test: screening evaluation, matching logic, PBT for matching fairness

**Files**: apps/api/src/modules/adoption/screening.service.ts, matching.service.ts
**Depends on**: T-18

---

### T-20: Post-Adoption Follow-up
- [x] Auto-create follow-up schedule on CONFIRMED (1wk, 1mo, 3mo)
- [x] GET /api/v1/adoption/:id/followups
- [x] PATCH /api/v1/followups/:id (complete with photo)
- [x] Missed follow-up detection (2 consecutive misses → notify officer)
- [x] Test: schedule generation, overdue detection

**Files**: apps/api/src/modules/adoption/followup.service.ts
**Depends on**: T-19

---

### T-21: Adoption Frontend
- [x] หน้า browse สัตว์พร้อมรับเลี้ยง (gallery, filter)
- [x] หน้าสมัครรับเลี้ยง (screening form)
- [x] หน้า adoption process tracking
- [x] หน้า follow-up (submit photo + status)

**Files**: apps/web/src/features/adoption/*
**Depends on**: T-05, T-18

---

## Wave 6: Community

### T-22: Feeding Station + Feeder API
- [x] CommunityModule: controller, service, repository
- [x] POST /api/v1/feeding-stations (register)
- [x] POST /api/v1/feeding-stations/:id/check-in
- [x] GET /api/v1/feeding-stations (list with active/inactive status)
- [x] Active = check-in within 7 days
- [x] Points: 5 per check-in
- [x] Test: check-in tracking, active/inactive logic

**Files**: apps/api/src/modules/community/feeding.service.ts
**Depends on**: T-02, T-03, T-04

---

### T-23: Volunteer + Assignment API
- [x] POST /api/v1/volunteers (register with skills)
- [x] GET /api/v1/assignments (available, matched by skill+area)
- [x] PATCH /api/v1/assignments/:id (accept, complete)
- [x] Hours tracking + badge system (10h=Starter, 50h=Active, 200h=Hero)
- [x] Test: matching logic, hours accumulation, badge thresholds

**Files**: apps/api/src/modules/community/volunteer.service.ts
**Depends on**: T-22

---

### T-24: Foster + Donation API
- [x] POST /api/v1/foster (apply to foster)
- [x] Foster period management (check-in weekly)
- [x] POST /api/v1/donations (record donation/sponsor)
- [x] GET /api/v1/donations/transparency (income-expense report)
- [x] Test: foster flow, donation tracking

**Files**: apps/api/src/modules/community/foster.service.ts, donation.service.ts
**Depends on**: T-22, T-06

---

### T-25: Community Frontend
- [x] หน้า feeder registration + check-in
- [x] หน้า volunteer registration + assignments
- [x] หน้า foster application
- [x] หน้า donation + sponsor

**Files**: apps/web/src/features/community/*
**Depends on**: T-05, T-22

---

## Wave 7: Map & Dashboard

### T-26: Map API + Heatmap
- [x] MapModule: controller, service
- [x] GET /api/v1/map/heatmap (PostGIS spatial aggregation)
- [x] GET /api/v1/map/markers (individual animals within bounds)
- [x] Adaptive mode: markers when <100, heatmap when >=100
- [x] GET /api/v1/map/layers (feeding stations, shelters, TNR areas)
- [x] Test: spatial queries, adaptive mode logic

**Files**: apps/api/src/modules/map/*
**Depends on**: T-06, T-22

---

### T-27: Zone Management
- [x] POST /api/v1/zones (draw polygon, assign team)
- [x] Auto-assign reports to zone team
- [x] GET /api/v1/zones/:id/stats (per-zone dashboard)
- [x] Test: polygon containment, auto-assign logic

**Files**: apps/api/src/modules/map/zone.service.ts
**Depends on**: T-26, T-10

---

### T-28: Dashboard API
- [x] GET /api/v1/dashboard/overview (aggregated stats)
- [x] Action Items section (unassigned urgent cases, overdue vaccines, pending follow-ups)
- [x] Redis caching (5-min TTL for dashboard stats)
- [x] District filtering
- [x] Test: aggregation correctness, cache invalidation

**Files**: apps/api/src/modules/map/dashboard.service.ts
**Depends on**: T-06, T-10, T-14, T-18, T-22

---

### T-29: Task Management + Reports
- [x] POST /api/v1/tasks (create, assign, deadline)
- [x] Overdue detection + escalation
- [x] GET /api/v1/reports/monthly (auto-generate monthly report)
- [x] KPI tracking (registered, sterilization rate, adoption rate, resolution rate)
- [x] PDF export
- [x] Test: KPI calculation, report generation

**Files**: apps/api/src/modules/map/task.service.ts, report.service.ts
**Depends on**: T-28

---

### T-30: Map & Dashboard Frontend
- [x] หน้าแผนที่ (Leaflet + heatmap + layers toggle)
- [x] หน้า zone management (draw polygon)
- [x] หน้า dashboard (stats cards, action items, charts)
- [x] หน้า monthly report (view + PDF export)
- [x] หน้า task management

**Files**: apps/web/src/features/map/*, apps/web/src/features/dashboard/*
**Depends on**: T-05, T-26, T-28

---

## Wave 8: Integration & Polish

### T-31: LINE OA Integration
- [x] LINE Login (OAuth → JWT exchange)
- [x] LINE Messaging API (push notifications)
- [x] Report via LINE (webhook → create report)
- [x] Notification templates (Thai language)
- [x] Test: webhook handling, message formatting

**Files**: apps/api/src/shared/services/line.service.ts
**Depends on**: T-04, T-10

---

### T-32: S3 + CloudFront Integration (Real)
- [x] Replace mock image upload with real S3 presigned URLs
- [x] CloudFront distribution setup
- [x] Image optimization (Sharp for thumbnails)
- [x] Test: upload flow end-to-end

**Files**: apps/api/src/shared/services/image.service.ts (update)
**Depends on**: T-09

---

### T-33: Notification Service (Real)
- [x] Replace notification stubs with real implementation
- [x] LINE push, in-app notification, email (optional)
- [x] Notification preferences per user
- [x] Queue-based (Bull/Redis) for reliability
- [x] Test: notification delivery, preference filtering

**Files**: apps/api/src/shared/services/notification.service.ts
**Depends on**: T-31

---

### T-34: E2E Tests + Performance
- [x] Playwright E2E tests (report flow, adoption flow, dashboard)
- [x] Load testing with k6 (target: 1000 concurrent users)
- [x] Performance optimization (Redis caching, query optimization)
- [x] Lighthouse audit (mobile performance score > 80)

**Files**: apps/web/e2e/*, apps/api/test/load/*
**Depends on**: T-30

---

### T-35: CI/CD + Deployment
- [x] GitHub Actions pipeline (lint, test, build, deploy)
- [x] Docker multi-stage build
- [x] AWS ECS Fargate task definition
- [x] RDS PostgreSQL + ElastiCache Redis provisioning
- [x] Environment: dev + staging + production
- [x] Health checks + auto-scaling

**Files**: .github/workflows/*, infrastructure/*
**Depends on**: T-34
