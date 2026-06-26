# Decomposition Decisions (D2)

## Context Summary
- **Project**: ระบบจัดการสัตว์จรจัด — Greenfield, scope: new
- **Stories**: 28 across 7 functional areas (12 High, 10 Medium, 6 Low)
- **Domains**: Animal Registry, Citizen Reporting, Health/Medical, Adoption, Community/Volunteer, Map/Area, Admin/Operations
- **User Types**: 7 (ประชาชน, ผู้รับเลี้ยง, feeder, อาสาสมัคร, สัตวแพทย์, เจ้าหน้าที่, NGO)
- **Key Entities**: Animal, Report, MedicalRecord, Adoption, Volunteer, FeedingStation, Campaign, User
- **Integrations**: LINE OA, Map/GIS, Image storage
- **Team**: Medium (4-8 developers), Timeline: 5-6 เดือน

---

## Decision Questions

### D2-1: ความจำเป็นในการแบ่ง Units
**Question**: ควรแบ่งระบบออกเป็น units หรือทำเป็นก้อนเดียว?
- 1) Yes — แบ่งเป็น units (เหมาะกับ 7 domains, 7 user types, team 4-8 คน) **(Recommended)**
- 2) No — ทำเป็นก้อนเดียว comprehensive mode (เร็วกว่าแต่ยากจัดการ)

**Answer**: 1

---

### D2-2: Architecture Pattern
**Question**: pattern สถาปัตยกรรมที่เหมาะกับระบบนี้?
- 1) Modular Monolith — แบ่ง module ใน codebase เดียว deploy ร่วมกัน **(Recommended)**
- 2) Microservices — แต่ละ unit เป็น service แยก deploy อิสระ
- 3) Hybrid — core เป็น monolith, บาง service แยก (map, notification)
- 4) Other (please specify): _______

**Answer**: 1

---

### D2-3: Decomposition Strategy
**Question**: ใช้กลยุทธ์อะไรในการแบ่ง units?
- 1) Domain-Driven — แบ่งตาม bounded context (Animal, Reporting, Health, Adoption, Community, Map, Admin) **(Recommended)**
- 2) User Journey-Based — แบ่งตาม flow ของผู้ใช้แต่ละกลุ่ม
- 3) Layer-Based — แบ่งตาม layer (Frontend, API, Data)
- 4) Hybrid — ผสม Domain + User Journey

**Answer**: 1

---

### D2-4: Foundation Unit
**Question**: ต้องการ Foundation unit (shared infrastructure) หรือไม่?
- 1) Yes — สร้าง Foundation unit สำหรับ: repo setup, auth/RBAC, error handling, database schema, shared types, notification service **(Recommended)**
- 2) Yes (minimal) — เฉพาะ auth/RBAC + database setup
- 3) No — แต่ละ unit จัดการ infrastructure เอง

**Answer**: 1

---

### D2-5: Unit Proposals
**Question**: เห็นด้วยกับการแบ่ง units ดังนี้หรือไม่?

**Proposed Units:**
1. **Foundation** (US-26, US-27, US-28) — Auth/RBAC, PDPA, Performance infra, shared types
2. **Animal Registry** (US-01, US-02, US-03, US-04) — ฐานข้อมูลกลาง, duplicate detection
3. **Citizen Reporting** (US-05, US-06, US-07, US-08) — แจ้งเบาะแส, tracking, workflow
4. **Health & Medical** (US-09, US-10, US-11, US-12) — medical records, TNR campaign
5. **Adoption** (US-13, US-14, US-15, US-16) — profile, screening, matching, follow-up
6. **Community** (US-17, US-18, US-19, US-20) — feeder, volunteer, foster, donate
7. **Map & Dashboard** (US-21, US-22, US-23, US-24, US-25) — แผนที่, โซน, dashboard, reports

- 1) เห็นด้วย — ใช้ตามที่เสนอ **(Recommended)**
- 2) ปรับ — รวม Map กับ Dashboard แยกกัน
- 3) ปรับ — อื่นๆ (please specify): _______

**Answer**: 1

---

### D2-6: Dependencies ระหว่าง Units
**Question**: รูปแบบ dependency ระหว่าง units?
- 1) Foundation → ทุก unit, Animal Registry → ทุก unit ที่อ้าง Animal entity (shared data via DB) **(Recommended)**
- 2) Loose coupling ผ่าน events (event-driven) — ลด direct dependency
- 3) API contracts — unit เรียกกันผ่าน internal API
- 4) Other (please specify): _______

**Answer**: 1

---

### D2-7: Development Sequence
**Question**: ลำดับการพัฒนา unit ไหนก่อน?
- 1) Foundation → Animal Registry → Citizen Reporting → Health → Adoption → Community → Map & Dashboard **(Recommended)**
- 2) Foundation → Animal Registry + Citizen Reporting (parallel) → Health + Adoption (parallel) → Community → Map & Dashboard
- 3) Other (please specify): _______

**Answer**: 1

---

## Decisions Summary
<!-- Machine-readable compact summary. Downstream phases: read ONLY this section. -->
- D2-1 Decomposition: Yes — แบ่งเป็น units
- D2-2 Architecture: Modular Monolith
- D2-3 Strategy: Domain-Driven (bounded contexts)
- D2-4 Foundation: Yes — full (repo, auth/RBAC, error handling, DB, shared types, notifications)
- D2-5 Units: 7 units (Foundation, Animal Registry, Citizen Reporting, Health & Medical, Adoption, Community, Map & Dashboard)
- D2-6 Dependencies: Foundation → all, Animal Registry → downstream units (shared data via DB)
- D2-7 Sequence: Foundation → Animal Registry → Citizen Reporting → Health → Adoption → Community → Map & Dashboard

---

**Instructions**: กรุณากรอกคำตอบในแต่ละข้อด้านบน แล้วตอบว่า "done" หรือพิมพ์ "use recommendations" เพื่อใช้ตัวเลือกที่แนะนำ
