# Design Decisions (D3)

## Context Summary
- **Project**: ระบบจัดการสัตว์จรจัด — Greenfield, Modular Monolith, 7 units
- **Architecture**: Modular Monolith (D2 decision)
- **Stories**: 28 across 7 functional areas
- **NFR**: Mobile-first, PDPA, offline capable, page load <3s, 50k+ animals, LINE OA
- **Team**: Medium (4-8 developers), Timeline: 5-6 เดือน
- **Integrations**: LINE OA, Map/GIS, Image upload/storage
- **Special**: Offline sync (field staff), Heatmap visualization, Gamification

---

## Decision Questions

### D3-1: Backend Language & Runtime
**Question**: ภาษาและ runtime สำหรับ backend?
- 1) TypeScript / Node.js (ใช้ภาษาเดียวกับ frontend, ecosystem ใหญ่, team คุ้นเคย) **(Recommended)**
- 2) Python / FastAPI (เหมาะกับ data processing, image similarity, ML-ready)
- 3) Go (performance สูง, concurrency ดี, แต่ ecosystem เล็กกว่า)
- 4) Other (please specify): _______

**Answer**: 

---

### D3-2: Backend Framework
**Question**: framework สำหรับ API server?
- 1) NestJS (TypeScript, modular architecture, built-in DI, suits modular monolith) **(Recommended)**
- 2) Express.js + custom structure (lightweight, flexible, ต้อง setup เอง)
- 3) Fastify (เร็วกว่า Express, plugin system, TypeScript support)
- 4) Other (please specify): _______

**Answer**: 

---

### D3-3: Frontend Framework & Architecture
**Question**: framework สำหรับ web frontend (mobile-first)?
- 1) Next.js / React (SSR/SSG, large ecosystem, mobile-first with Tailwind) **(Recommended)**
- 2) Nuxt / Vue (ง่ายกว่า React, good DX, smaller community)
- 3) SvelteKit (lightweight, fast, modern, แต่ ecosystem เล็ก)
- 4) Other (please specify): _______

**Answer**: 

---

### D3-4: Database Technology
**Question**: ฐานข้อมูลหลัก?
- 1) PostgreSQL + PostGIS (relational, spatial queries สำหรับ map/heatmap, mature, JSONB) **(Recommended)**
- 2) MySQL (relational, popular, ง่าย, แต่ไม่มี spatial ดีเท่า PostGIS)
- 3) MongoDB (flexible schema, geo queries, แต่ complex joins ยาก)
- 4) Other (please specify): _______

**Answer**: 

---

### D3-5: ORM / Database Client
**Question**: ORM สำหรับ data access?
- 1) Prisma (type-safe, auto-generated client, migrations, ดีกับ TypeScript) **(Recommended)**
- 2) TypeORM (mature, decorator-based, supports complex queries)
- 3) Drizzle ORM (lightweight, SQL-like syntax, type-safe)
- 4) Other (please specify): _______

**Answer**: 

---

### D3-6: Authentication & Authorization
**Question**: ระบบ auth สำหรับ 7 roles + LINE OA integration?
- 1) JWT + Custom RBAC (flexible, stateless, ง่ายต่อ LINE login integration) **(Recommended)**
- 2) NextAuth.js + custom RBAC (built-in providers, session management)
- 3) Keycloak (enterprise-grade, self-hosted, feature-rich แต่ complex)
- 4) Other (please specify): _______

**Answer**: 

---

### D3-7: API Design Pattern
**Question**: รูปแบบ API?
- 1) REST + OpenAPI (standard, cacheable, เหมาะกับ mobile, LINE webhook) **(Recommended)**
- 2) GraphQL (flexible queries, ลด over-fetching, แต่ complex caching)
- 3) tRPC (end-to-end type-safe, แต่ tight coupling frontend/backend)
- 4) Other (please specify): _______

**Answer**: 

---

### D3-8: UI Component Library
**Question**: UI library สำหรับ mobile-first Thai language?
- 1) Tailwind CSS + Headless UI (utility-first, flexible, mobile-friendly, light) **(Recommended)**
- 2) Material UI (MUI) (comprehensive, accessible, แต่ bundle ใหญ่)
- 3) Ant Design (feature-rich, ดี enterprise, แต่ style เป็น Chinese-standard)
- 4) Other (please specify): _______

**Answer**: 

---

### D3-9: Map / GIS Library
**Question**: library สำหรับแผนที่และ heatmap?
- 1) Leaflet + leaflet.heat (lightweight, open-source, plugin-rich, PostGIS compat) **(Recommended)**
- 2) Mapbox GL JS (powerful, beautiful, แต่มีค่าใช้จ่ายหลัง free tier)
- 3) Google Maps Platform (familiar, reliable, แต่แพงที่สุด)
- 4) Other (please specify): _______

**Answer**: 

---

### D3-10: Cloud Provider & Compute
**Question**: cloud provider และ compute platform?
- 1) AWS — ECS Fargate (container, serverless-managed, scalable, cost-effective) **(Recommended)**
- 2) AWS — Lambda + API Gateway (serverless, pay-per-use, cold start concern)
- 3) GCP — Cloud Run (container, auto-scale, simple, competitive pricing)
- 4) Other (please specify): _______

**Answer**: 

---

### D3-11: CI/CD Tool
**Question**: CI/CD pipeline?
- 1) GitHub Actions (popular, free for open-source, good ecosystem) **(Recommended)**
- 2) GitLab CI (built-in, self-hosted option, full DevOps platform)
- 3) AWS CodePipeline (native AWS integration, แต่ DX ไม่ดีเท่า)
- 4) Other (please specify): _______

**Answer**: 

---

### D3-12: Repository Strategy
**Question**: โครงสร้าง repository?
- 1) Monorepo + Turborepo (shared code easy, single PR, consistent tooling) **(Recommended)**
- 2) Monorepo + Nx (powerful but complex, good for large teams)
- 3) Multi-repo (isolated, independent deploy, แต่ shared code ยาก)
- 4) Other (please specify): _______

**Answer**: 

---

### D3-13: Testing Strategy & Correctness
**Question**: แนวทางทดสอบและ property-based testing?
- 1) Vitest (unit) + Supertest (API) + fast-check (PBT) + Playwright (E2E) — ครอบคลุมทุกระดับ **(Recommended)**
- 2) Jest (unit) + Supertest (API) + fast-check (PBT) — ข้าม E2E ช่วงแรก
- 3) Vitest (unit) + manual testing — minimal, เร็วที่สุด
- 4) Other (please specify): _______

**Answer**: 

---

### D3-14: Caching Strategy
**Question**: caching สำหรับ performance (page load <3s, 50k+ animals)?
- 1) Redis (in-memory cache สำหรับ dashboard stats, search results, sessions) **(Recommended)**
- 2) CDN + browser cache only (simple, ไม่ต้อง maintain Redis)
- 3) No caching for MVP — optimize later
- 4) Other (please specify): _______

**Answer**: 

---

### D3-15: Image Storage
**Question**: ที่เก็บรูปภาพสัตว์ (upload + thumbnail)?
- 1) AWS S3 + CloudFront CDN (scalable, cheap, fast delivery via CDN) **(Recommended)**
- 2) Cloudinary (managed, auto-resize/optimize, free tier, แต่ dependency)
- 3) MinIO (self-hosted S3-compatible, no vendor lock-in)
- 4) Other (please specify): _______

**Answer**: 

---

## Decisions Summary
<!-- Machine-readable compact summary. Downstream phases: read ONLY this section. -->
- D3-1 Backend: TypeScript / Node.js
- D3-2 Framework: NestJS (modular architecture, DI, TypeScript-native)
- D3-3 Frontend: Next.js / React (SSR, mobile-first, Tailwind)
- D3-4 Database: PostgreSQL + PostGIS (relational, spatial queries, JSONB)
- D3-5 ORM: Prisma (type-safe, auto-generated client, migrations)
- D3-6 Auth: JWT + Custom RBAC (stateless, LINE login integration)
- D3-7 API: REST + OpenAPI (standard, cacheable, LINE webhook compatible)
- D3-8 UI: Tailwind CSS + Headless UI (utility-first, mobile-friendly)
- D3-9 Map: Leaflet + leaflet.heat (lightweight, open-source, PostGIS compat)
- D3-10 Cloud: AWS — ECS Fargate (container, serverless-managed, scalable)
- D3-11 CI/CD: GitHub Actions
- D3-12 Repo: Monorepo + Turborepo (shared code, single PR, consistent tooling)
- D3-13 Testing: Vitest + Supertest + fast-check (PBT) + Playwright (E2E)
- D3-14 Caching: Redis (dashboard stats, search results, sessions)
- D3-15 Image Storage: AWS S3 + CloudFront CDN

---

**Instructions**: กรุณากรอกคำตอบในแต่ละข้อด้านบน แล้วตอบว่า "done" หรือพิมพ์ "use recommendations" เพื่อใช้ตัวเลือกที่แนะนำ
