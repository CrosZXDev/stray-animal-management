# Units — ระบบจัดการสัตว์จรจัด

## Summary
- **Total Units**: 7 (1 foundation + 6 domain units)
- **Architecture**: Modular Monolith
- **Strategy**: Domain-Driven Design (Bounded Contexts)
- **Total Stories**: 28 (distributed across 6 domain units)
- **Development Sequence**: Foundation → Animal Registry → Citizen Reporting → Health & Medical → Adoption → Community → Map & Dashboard

## Context Map

```
┌──────────────────────────────────────────────────────────────┐
│                        FOUNDATION                             │
│  Auth/RBAC, DB Schema, Shared Types, Notifications, PDPA    │
└──────────────────────┬───────────────────────────────────────┘
                       │ (ทุก unit ขึ้นกับ Foundation)
         ┌─────────────┼─────────────────────────────┐
         ▼             ▼                             ▼
┌─────────────┐ ┌──────────────┐           ┌──────────────┐
│   ANIMAL    │ │   CITIZEN    │           │  COMMUNITY   │
│  REGISTRY   │ │  REPORTING   │           │              │
└──────┬──────┘ └──────┬───────┘           └──────────────┘
       │               │                          │
       ▼               ▼                          │
┌─────────────┐ ┌──────────────┐                  │
│   HEALTH    │ │              │                  │
│  & MEDICAL  │ │   ADOPTION   │◄─────────────────┘
└─────────────┘ └──────────────┘
       │               │
       ▼               ▼
┌──────────────────────────────────────────────────────────────┐
│                    MAP & DASHBOARD                             │
│        (อ่านข้อมูลจากทุก unit เพื่อแสดงผล)                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Unit 1: Foundation

**Type**: Infrastructure (ไม่มี user stories)
**Responsibility**: โครงสร้างพื้นฐานที่ทุก domain unit ใช้ร่วมกัน
**Scope**:
- Repository structure + build configuration
- Authentication & Authorization (RBAC 7 roles)
- Database schema setup + migration system
- Shared types/interfaces (User, Animal base, Location)
- Error handling patterns + API response envelope
- Notification service (LINE OA, push notification)
- PDPA compliance infrastructure (consent, encryption, data deletion)
- Image upload/storage service
- Logging + monitoring setup

**Stories**: ไม่มี (infrastructure-only) — อ้างอิง NFR จาก US-26, US-27, US-28
**Dependencies**: ไม่มี (upstream root)
**Downstream**: ทุก unit

---

## Unit 2: Animal Registry

**Bounded Context**: Animal Identity & Registration
**Responsibility**: จัดการฐานข้อมูลกลางสัตว์จรจัด ระบุตัวตน ค้นหา อัพเดท

**Stories**:
| ID | Title | Priority |
|----|-------|----------|
| US-01 | ลงทะเบียนสัตว์จรจัด | High |
| US-02 | ตรวจสอบสัตว์ซ้ำ (Duplicate Detection) | High |
| US-03 | ค้นหาและดูข้อมูลสัตว์ | High |
| US-04 | อัพเดทข้อมูลและสถานะสัตว์ | Medium |

**Key Entities**: Animal, AnimalPhoto, AnimalHistory
**Interfaces Provided**:
- `AnimalService.register(data)` → Animal
- `AnimalService.search(criteria)` → Animal[]
- `AnimalService.getById(id)` → Animal
- `AnimalService.updateStatus(id, status)` → Animal

**Dependencies**:
| Dependency | Type | Description |
|-----------|------|-------------|
| Foundation | Data | Auth, DB, Image storage, shared types |

**Downstream consumers**: Health & Medical, Adoption, Map & Dashboard, Citizen Reporting

---

## Unit 3: Citizen Reporting

**Bounded Context**: Incident Reporting & Case Management
**Responsibility**: ประชาชนแจ้งเบาะแส, tracking, case workflow, gamification

**Stories**:
| ID | Title | Priority |
|----|-------|----------|
| US-05 | แจ้งพบสัตว์จรจัด/ปัญหา | High |
| US-06 | ติดตามสถานะรายงาน | High |
| US-07 | จัดการ case (Workflow) | High |
| US-08 | Gamification ผู้แจ้งเบาะแส | Low |

**Key Entities**: Report, CaseAssignment, ReporterScore, Badge
**Interfaces Provided**:
- `ReportService.create(data)` → Report
- `ReportService.getByTrackingId(id)` → Report
- `CaseService.assign(reportId, teamId)` → CaseAssignment
- `CaseService.resolve(reportId, result)` → Report

**Dependencies**:
| Dependency | Type | Description |
|-----------|------|-------------|
| Foundation | Data | Auth, DB, Notifications, shared types |
| Animal Registry | Data | ลิงก์ report กับสัตว์ในระบบ (optional) |

---

## Unit 4: Health & Medical

**Bounded Context**: Medical Records & TNR Operations
**Responsibility**: บันทึกสุขภาพ, วัคซีน, ทำหมัน, TNR campaign management

**Stories**:
| ID | Title | Priority |
|----|-------|----------|
| US-09 | บันทึก Medical Record | High |
| US-10 | กำหนดการวัคซีน (Auto-remind) | Medium |
| US-11 | TNR Campaign Management | High |
| US-12 | สถิติสุขภาพสัตว์จรจัด | Medium |

**Key Entities**: MedicalRecord, Vaccination, Campaign, CampaignResult
**Interfaces Provided**:
- `MedicalService.createRecord(animalId, data)` → MedicalRecord
- `VaccineService.getSchedule(animalId)` → VaccineSchedule
- `CampaignService.create(data)` → Campaign
- `CampaignService.recordResult(campaignId, data)` → CampaignResult

**Dependencies**:
| Dependency | Type | Description |
|-----------|------|-------------|
| Foundation | Data | Auth, DB, Notifications, offline sync |
| Animal Registry | Data | อ้าง Animal entity, อัพเดทสถานะทำหมัน |

---

## Unit 5: Adoption

**Bounded Context**: Adoption Process & Matching
**Responsibility**: profile สัตว์สำหรับรับเลี้ยง, screening, matching, follow-up

**Stories**:
| ID | Title | Priority |
|----|-------|----------|
| US-13 | Animal Profile สำหรับรับเลี้ยง | High |
| US-14 | ลงทะเบียนผู้รับเลี้ยง + Screening | High |
| US-15 | Matching + Adoption Process | Medium |
| US-16 | Post-Adoption Follow-up | Medium |

**Key Entities**: AdoptionProfile, Adopter, ScreeningResult, AdoptionApplication, FollowUp
**Interfaces Provided**:
- `AdoptionService.getProfiles(filter)` → AdoptionProfile[]
- `AdoptionService.apply(adopterId, animalId)` → AdoptionApplication
- `ScreeningService.evaluate(adopterId)` → ScreeningResult
- `FollowUpService.createSchedule(applicationId)` → FollowUp[]

**Dependencies**:
| Dependency | Type | Description |
|-----------|------|-------------|
| Foundation | Data | Auth, DB, Notifications |
| Animal Registry | Data | ดึงข้อมูลสัตว์ + สถานะสุขภาพ |
| Health & Medical | Data | ดึงประวัติสุขภาพสำหรับ profile |
| Community | Data | Foster → Adoption pipeline |

---

## Unit 6: Community

**Bounded Context**: Community Engagement & Volunteer Management
**Responsibility**: feeder, อาสาสมัคร, foster, บริจาค

**Stories**:
| ID | Title | Priority |
|----|-------|----------|
| US-17 | ลงทะเบียน Community Feeder + จุดให้อาหาร | Medium |
| US-18 | ลงทะเบียนอาสาสมัคร + รับ Assignment | Medium |
| US-19 | ระบบ Foster | Medium |
| US-20 | บริจาค + Sponsor | Low |

**Key Entities**: FeedingStation, FeederCheckIn, Volunteer, Assignment, FosterPeriod, Donation
**Interfaces Provided**:
- `FeederService.register(data)` → FeedingStation
- `FeederService.checkIn(stationId)` → FeederCheckIn
- `VolunteerService.register(data)` → Volunteer
- `VolunteerService.assignTask(volunteerId, task)` → Assignment
- `FosterService.apply(volunteerId, animalId)` → FosterPeriod

**Dependencies**:
| Dependency | Type | Description |
|-----------|------|-------------|
| Foundation | Data | Auth, DB, Notifications, gamification infra |
| Animal Registry | Data | อ้าง Animal entity สำหรับ foster/sponsor |

---

## Unit 7: Map & Dashboard

**Bounded Context**: Visualization, Analytics & Operations Management
**Responsibility**: แผนที่ heatmap, โซนรับผิดชอบ, dashboard, task management, reports

**Stories**:
| ID | Title | Priority |
|----|-------|----------|
| US-21 | แผนที่ Heatmap | High |
| US-22 | แบ่งโซนรับผิดชอบ + มอบหมายทีม | Medium |
| US-23 | Dashboard ภาพรวม | High |
| US-24 | Assign Tasks + Track Completion | Medium |
| US-25 | Monthly Report + KPI Tracking | Medium |

**Key Entities**: Zone, ZoneAssignment, Task, KPISnapshot, MonthlyReport
**Interfaces Provided**:
- `MapService.getHeatmapData(bounds)` → HeatmapPoint[]
- `ZoneService.create(polygon, teamId)` → Zone
- `DashboardService.getOverview(district)` → DashboardData
- `TaskService.create(data)` → Task
- `ReportService.generateMonthly(district, month)` → MonthlyReport

**Dependencies**:
| Dependency | Type | Description |
|-----------|------|-------------|
| Foundation | Data | Auth, DB |
| Animal Registry | Data | ตำแหน่งสัตว์สำหรับ heatmap |
| Citizen Reporting | Data | Cases สำหรับ dashboard + zone auto-assign |
| Health & Medical | Data | TNR progress, vaccination stats |
| Adoption | Data | Adoption rate |
| Community | Data | Feeding stations, volunteer hours |

---

## Development Sequence

```
Wave 1:  [Foundation]
Wave 2:  [Animal Registry]
Wave 3:  [Citizen Reporting]
Wave 4:  [Health & Medical]
Wave 5:  [Adoption]
Wave 6:  [Community]
Wave 7:  [Map & Dashboard]
```

**หมายเหตุ**: ทีม 4-8 คน สามารถทำ Wave 3+4 parallel ได้ (Citizen Reporting ไม่ขึ้นกับ Health & Medical) และ Wave 5+6 parallel ได้เช่นกัน

## Story Assignment Verification

| Unit | Stories | Count |
|------|---------|-------|
| Foundation | (US-26, US-27, US-28 as NFR reference) | 0 (infra) |
| Animal Registry | US-01, US-02, US-03, US-04 | 4 |
| Citizen Reporting | US-05, US-06, US-07, US-08 | 4 |
| Health & Medical | US-09, US-10, US-11, US-12 | 4 |
| Adoption | US-13, US-14, US-15, US-16 | 4 |
| Community | US-17, US-18, US-19, US-20 | 4 |
| Map & Dashboard | US-21, US-22, US-23, US-24, US-25 | 5 |
| **Total** | | **25 domain + 3 NFR = 28** |
