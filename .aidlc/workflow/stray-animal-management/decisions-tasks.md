# Tasks Decisions (D4)

## Context Summary
- **Architecture**: Modular Monolith (NestJS + Next.js + PostgreSQL+PostGIS)
- **Components**: 7 modules
- **Entities**: 18
- **Endpoints**: 45+
- **Integrations**: 4 (LINE OA, S3, PostGIS, Redis)
- **Mode**: Comprehensive (ทุก unit พร้อมกัน)
- **Team**: Medium (4-8), Timeline: 5-6 เดือน
- **Testing**: Vitest + Supertest + fast-check + Playwright

---

## Decision Questions

### D4-1: Task Breakdown Strategy
**Question**: แบ่ง tasks ด้วยวิธีใด?
- 1) By module — ทำทีละ module ให้เสร็จ (Foundation → Animal → Reporting → ...) **(Recommended)**
- 2) By layer — ทำ data layer ทุก module → service layer ทุก module → API layer ทุก module
- 3) By feature slice — ทำ vertical slice (DB+API+UI) ต่อ feature ไปเรื่อยๆ

**Answer**: 1

---

### D4-2: Implementation Approach
**Question**: แนวทาง testing ระหว่าง implement?
- 1) Test-alongside — เขียน test พร้อมกับ code ในแต่ละ task **(Recommended)**
- 2) TDD — เขียน test ก่อน code
- 3) Test-after — เขียน code ก่อน แล้วเพิ่ม test ทีหลัง

**Answer**: 1

---

### D4-3: Module Priority (Build Order)
**Question**: ลำดับการ implement modules?
- 1) Foundation → Animal Registry → Citizen Reporting → Health → Adoption → Community → Map & Dashboard (ตาม dependency) **(Recommended)**
- 2) Foundation → ทุก module parallel (ต้อง coordinate มาก)
- 3) Custom order: _______

**Answer**: 1

---

### D4-4: Integration Strategy
**Question**: จัดการ external dependencies (LINE, S3, Map) ระหว่าง dev อย่างไร?
- 1) Mock/Stub ก่อน → integrate จริงทีหลัง (ลด blocking) **(Recommended)**
- 2) Integrate จริงตั้งแต่แรก (ช้ากว่า แต่ realistic)
- 3) Separate integration task per service (isolate risk)

**Answer**: 1

---

### D4-5: Task Granularity
**Question**: ขนาด task ที่เหมาะสม?
- 1) 1-2 วัน ต่อ task (focused, measurable progress) **(Recommended)**
- 2) 2-4 ชั่วโมง ต่อ task (very granular, high overhead)
- 3) 3-5 วัน ต่อ task (fewer tasks, harder to track)

**Answer**: 1

---

### D4-6: Parallel Execution
**Question**: รองรับการทำงาน parallel หรือไม่?
- 1) Yes — จัดเป็น execution waves, tasks ใน wave เดียวกันทำ parallel ได้ **(Recommended)**
- 2) Strictly sequential — ทำทีละ task เท่านั้น
- 3) Fully parallel — ทุก task ที่ไม่มี dependency ทำพร้อมกัน

**Answer**: 1

---

### D4-7: Infrastructure Tasks
**Question**: รวม infrastructure tasks (Docker, CI/CD, IaC) หรือไม่?
- 1) Yes — รวมใน Foundation wave แรก (Docker compose, CI/CD pipeline, basic IaC) **(Recommended)**
- 2) Yes — แยกเป็น wave สุดท้าย (build & deploy phase)
- 3) No — ข้ามไปก่อน ทำทีหลัง

**Answer**: 1

---

## Decisions Summary
- D4-1 Breakdown: By module (sequential per dependency order)
- D4-2 Testing: Test-alongside (test พร้อม code)
- D4-3 Priority: Foundation → Animal → Reporting → Health → Adoption → Community → Map & Dashboard
- D4-4 Integration: Mock/Stub first → integrate later
- D4-5 Granularity: 1-2 days per task
- D4-6 Parallel: Execution waves (parallel within wave)
- D4-7 Infrastructure: Included in Foundation wave
