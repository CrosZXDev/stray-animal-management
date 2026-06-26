# Requirements — ระบบจัดการสัตว์จรจัด

## Summary
- **Total Stories**: 28 stories across 7 functional areas
- **Priority Distribution**: 12 High, 10 Medium, 6 Low
- **User Types**: ประชาชนทั่วไป, ผู้รับเลี้ยง, community feeder, อาสาสมัคร, สัตวแพทย์, เจ้าหน้าที่เทศบาล, NGO
- **Key Entities**: Animal, Report, MedicalRecord, Adoption, Volunteer, FeedingStation, Campaign, User
- **Integrations**: LINE OA, Map/GIS service, Image upload/storage
- **Core Flows**:
  - ประชาชนแจ้งพบสัตว์จรจัด → assign ทีม → ดำเนินการ → แจ้งผล
  - ลงทะเบียนสัตว์ → บันทึกสุขภาพ → ทำหมัน/วัคซีน → พร้อม adopt
  - ผู้รับเลี้ยงค้นหา → screening → นัดพบ → ทดลองเลี้ยง → follow-up
  - TNR campaign: วางแผนพื้นที่ → จับ → ทำหมัน → ปล่อยคืน → บันทึกผล
  - Dashboard → วิเคราะห์ข้อมูล → วางแผนทรัพยากร → รายงาน

---

## Functional Area 1: Animal Registry

### US-01: ลงทะเบียนสัตว์จรจัด
- **As a** เจ้าหน้าที่เทศบาล/อาสาสมัคร
- **I want** ลงทะเบียนสัตว์จรจัดพร้อมรูปถ่าย ลักษณะ และพิกัด
- **So that** มีฐานข้อมูลกลางที่ระบุตัวตนสัตว์แต่ละตัวได้
- **Priority**: High

**Acceptance Criteria (EARS)**:
1. WHEN ผู้ใช้กดลงทะเบียนสัตว์ใหม่ THE system SHALL สร้าง Animal ID อัตโนมัติในรูปแบบ ANM-YYYYMMDD-XXXX
2. WHEN ผู้ใช้ upload รูปถ่ายสัตว์ THE system SHALL รองรับไฟล์ภาพ JPG/PNG ขนาดไม่เกิน 10MB และบีบอัดเป็น thumbnail อัตโนมัติ
3. The system shall บันทึกข้อมูลพื้นฐาน: ประเภท (สุนัข/แมว), เพศ, สี, ขนาด, ลักษณะเด่น, นิสัย, พิกัด GPS
4. WHEN ผู้ใช้กดปักหมุดพิกัด THE system SHALL auto-detect GPS location จากอุปกรณ์เป็นค่า default และอนุญาตให้ปรับด้วยมือได้

**Dependencies**: -
**Source**: D1-4, FR-01, Prototype discovery

---

### US-02: ตรวจสอบสัตว์ซ้ำ (Duplicate Detection)
- **As a** เจ้าหน้าที่เทศบาล
- **I want** ระบบตรวจสอบว่าสัตว์ที่กำลังลงทะเบียนมีอยู่ในระบบแล้วหรือไม่
- **So that** ไม่มีข้อมูลซ้ำซ้อนในฐานข้อมูล
- **Priority**: High

**Acceptance Criteria (EARS)**:
1. WHEN ผู้ใช้ upload รูปสัตว์ใหม่ THE system SHALL เปรียบเทียบกับรูปในฐานข้อมูลและแสดงรายการที่คล้ายกัน (similarity > 70%) ภายใน 5 วินาที
2. IF ระบบพบสัตว์ที่อาจซ้ำ THEN แสดง candidate list ให้ผู้ใช้ยืนยัน ELSE ดำเนินการลงทะเบียนใหม่ต่อ
3. WHEN ผู้ใช้ยืนยันว่าเป็นตัวเดิม THE system SHALL merge ข้อมูลใหม่เข้ากับ record เดิมและบันทึก history

**Dependencies**: US-01
**Source**: D1-7, FR-01

---

### US-03: ค้นหาและดูข้อมูลสัตว์
- **As a** ผู้ใช้ทุกบทบาท
- **I want** ค้นหาสัตว์จากเงื่อนไขต่าง ๆ (ID, พื้นที่, ลักษณะ, สถานะ)
- **So that** เข้าถึงข้อมูลสัตว์ที่ต้องการได้รวดเร็ว
- **Priority**: High

**Acceptance Criteria (EARS)**:
1. WHEN ผู้ใช้ค้นหาด้วย Animal ID THE system SHALL แสดงผลภายใน 1 วินาที
2. WHEN ผู้ใช้กรองด้วยเงื่อนไข (ประเภท, เขต, สถานะทำหมัน, สถานะ adoption) THE system SHALL แสดงรายการที่ตรงเงื่อนไขพร้อม pagination (20 รายการ/หน้า)
3. The system shall แสดง profile สัตว์ที่ประกอบด้วย: รูปถ่ายทั้งหมด, ข้อมูลพื้นฐาน, ประวัติสุขภาพ, สถานะปัจจุบัน, timeline กิจกรรม

**Dependencies**: US-01
**Source**: D1-4, FR-01

---

### US-04: อัพเดทข้อมูลและสถานะสัตว์
- **As a** เจ้าหน้าที่เทศบาล/อาสาสมัคร/สัตวแพทย์
- **I want** แก้ไขข้อมูลสัตว์ได้ตลอดเวลา (รูปใหม่, สถานะ, ลักษณะ)
- **So that** ข้อมูลในระบบเป็นปัจจุบันเสมอ
- **Priority**: Medium

**Acceptance Criteria (EARS)**:
1. WHEN ผู้ใช้แก้ไขข้อมูลสัตว์ THE system SHALL บันทึก change history พร้อม timestamp และผู้แก้ไข
2. WHEN สถานะสัตว์เปลี่ยน (เช่น จรจัด → รอรับเลี้ยง → ถูกรับเลี้ยง) THE system SHALL บันทึก state transition และแจ้ง stakeholders ที่เกี่ยวข้อง
3. The system shall รองรับการ upload รูปเพิ่มเติมได้สูงสุด 10 รูปต่อสัตว์ 1 ตัว

**Dependencies**: US-01
**Source**: FR-01

---

## Functional Area 2: Citizen Reporting

### US-05: แจ้งพบสัตว์จรจัด/ปัญหา
- **As a** ประชาชนทั่วไป
- **I want** แจ้งพบสัตว์จรจัดหรือปัญหาผ่าน web app / LINE OA ภายใน 3 ขั้นตอน
- **So that** เจ้าหน้าที่รับทราบและดำเนินการได้ทันท่วงที
- **Priority**: High

**Acceptance Criteria (EARS)**:
1. WHEN ผู้ใช้เลือก "แจ้งเบาะแส" THE system SHALL แสดง flow 3 ขั้นตอน: เลือกประเภท → แนบรูป+ปักหมุด → ยืนยันส่ง ให้เสร็จภายใน 2 นาที
2. WHEN ผู้ใช้ส่งรายงานสำเร็จ THE system SHALL สร้างเลข tracking (RPT-YYYYMMDD-XXXX) และแจ้งกลับทันที
3. The system shall รองรับการแจ้งแบบ anonymous (ไม่ต้อง login) และแบบระบุตัวตน
4. WHEN ผู้ใช้เลือกประเภทรายงาน THE system SHALL มีตัวเลือก: พบตัวใหม่, บาดเจ็บ/ป่วย, ก้าวร้าว, ฝูงเพิ่มจำนวน, ถูกทารุณกรรม

**Dependencies**: -
**Source**: D1-4, FR-02

---

### US-06: ติดตามสถานะรายงาน
- **As a** ประชาชนที่แจ้งเบาะแส
- **I want** ติดตามสถานะรายงานของตัวเองได้
- **So that** รู้ว่ามีคนดำเนินการแล้วหรือยัง
- **Priority**: High

**Acceptance Criteria (EARS)**:
1. WHEN ผู้ใช้เปิดดูรายงานของตัวเอง THE system SHALL แสดง timeline สถานะ: รับเรื่อง → assign ทีม → กำลังดำเนินการ → เสร็จสิ้น
2. WHEN สถานะรายงานเปลี่ยน THE system SHALL แจ้งเตือนผู้แจ้งผ่าน LINE / push notification ภายใน 5 นาที
3. WHILE รายงานอยู่ในสถานะ "กำลังดำเนินการ" IF ไม่มี update ภายใน 48 ชั่วโมง THEN ระบบ escalate ไปยังหัวหน้าทีมอัตโนมัติ

**Dependencies**: US-05
**Source**: FR-02

---

### US-07: จัดการ case รายงาน (Workflow)
- **As a** เจ้าหน้าที่เทศบาล
- **I want** รับรายงาน assign ให้ทีม และติดตามจนเสร็จ
- **So that** ทุก case ได้รับการจัดการอย่างเป็นระบบ
- **Priority**: High

**Acceptance Criteria (EARS)**:
1. WHEN มีรายงานใหม่เข้าระบบ THE system SHALL จัดลำดับ priority ตามประเภท (ทารุณกรรม=Critical, บาดเจ็บ=High, ก้าวร้าว=High, อื่นๆ=Medium)
2. WHEN เจ้าหน้าที่ assign case ให้ทีม THE system SHALL แจ้งเตือนทีมที่ได้รับมอบหมายทันที
3. WHEN ทีมรายงานผล THE system SHALL บันทึกผลดำเนินการ + อัพเดทสถานะ + แจ้งผู้แจ้งอัตโนมัติ
4. The system shall แสดง SLA timer: ปกติ 72 ชม., เร่งด่วน 24 ชม., critical 4 ชม.

**Dependencies**: US-05
**Source**: D1-7, FR-02

---

### US-08: Gamification ผู้แจ้งเบาะแส
- **As a** ประชาชนที่แจ้งเบาะแส
- **I want** ได้รับคะแนนและ badge เมื่อช่วยแจ้งข้อมูล
- **So that** มีแรงจูงใจในการมีส่วนร่วมต่อเนื่อง
- **Priority**: Low

**Acceptance Criteria (EARS)**:
1. WHEN รายงานของผู้ใช้ได้รับการยืนยันว่าเป็นข้อมูลจริง THE system SHALL เพิ่มคะแนน 10 points ให้ผู้แจ้ง
2. WHEN ผู้ใช้สะสมครบตามเกณฑ์ THE system SHALL มอบ badge อัตโนมัติ (Bronze: 5 reports, Silver: 20, Gold: 50)
3. The system shall แสดง leaderboard ผู้ช่วยเหลือประจำเขต (top 10)

**Dependencies**: US-05, US-06
**Source**: FR-02

---

## Functional Area 3: Health & Medical Records

### US-09: บันทึก Medical Record
- **As a** สัตวแพทย์อาสา
- **I want** บันทึกข้อมูลการรักษา/ทำหมัน/วัคซีนของสัตว์แต่ละตัว
- **So that** มีประวัติสุขภาพครบถ้วนสำหรับการดูแลต่อเนื่อง
- **Priority**: High

**Acceptance Criteria (EARS)**:
1. WHEN สัตวแพทย์เลือกสัตว์และบันทึก medical record THE system SHALL บันทึกข้อมูล: ประเภทการรักษา, วันที่, หมอผู้ทำ, ยาที่ใช้, หมายเหตุ, รูปภาพ
2. WHEN สัตวแพทย์บันทึกการทำหมัน THE system SHALL อัพเดทสถานะสัตว์เป็น "ทำหมันแล้ว" + บันทึกวันที่ ear-tip
3. WHILE ไม่มีสัญญาณ internet IF สัตวแพทย์บันทึกข้อมูล THEN ระบบ SHALL เก็บไว้ใน local storage และ sync อัตโนมัติเมื่อ online

**Dependencies**: US-01
**Source**: D1-4, FR-03

---

### US-10: กำหนดการวัคซีน (Auto-remind)
- **As a** เจ้าหน้าที่เทศบาล
- **I want** ระบบแจ้งเตือนเมื่อถึงกำหนดวัคซีนครั้งถัดไป
- **So that** สัตว์ทุกตัวได้รับวัคซีนครบตามกำหนด
- **Priority**: Medium

**Acceptance Criteria (EARS)**:
1. WHEN สัตวแพทย์บันทึกวัคซีน THE system SHALL คำนวณวันนัดครั้งถัดไปอัตโนมัติตามชนิดวัคซีน (พิษสุนัขบ้า=1ปี, 5in1=1ปี)
2. WHEN ถึง 7 วันก่อนกำหนดนัด THE system SHALL แจ้งเตือนเจ้าหน้าที่รับผิดชอบพื้นที่
3. WHILE สัตว์ยังไม่ได้รับวัคซีนตามกำหนด IF เลยกำหนด 30 วัน THEN ระบบ SHALL เปลี่ยนสถานะเป็น "overdue" และ escalate

**Dependencies**: US-09
**Source**: FR-03

---

### US-11: TNR Campaign Management
- **As a** เจ้าหน้าที่เทศบาล
- **I want** วางแผนและติดตามผล TNR campaign ต่อพื้นที่
- **So that** ทำหมันสัตว์จรจัดได้ครอบคลุมและวัดผลได้
- **Priority**: High

**Acceptance Criteria (EARS)**:
1. WHEN เจ้าหน้าที่สร้าง campaign ใหม่ THE system SHALL กำหนดพื้นที่, วันที่, target จำนวนสัตว์, ทีมรับผิดชอบ, งบประมาณ
2. WHEN ทีมบันทึกผลจับ+ทำหมัน THE system SHALL อัพเดท actual vs target แบบ real-time บน dashboard
3. WHEN campaign เสร็จสิ้น THE system SHALL สรุปผล: จำนวนทำหมัน, ฉีดวัคซีน, สัตว์ป่วยที่พบ, งบที่ใช้จริง, สัตว์ที่ส่งต่อ adoption

**Dependencies**: US-09, US-01
**Source**: D1-7, FR-03

---

### US-12: สถิติสุขภาพสัตว์จรจัด
- **As a** เจ้าหน้าที่เทศบาล
- **I want** ดูสถิติอัตราทำหมัน/วัคซีนแยกตามเขต
- **So that** วางแผนจัดสรรทรัพยากรได้ตรงจุด
- **Priority**: Medium

**Acceptance Criteria (EARS)**:
1. WHEN เจ้าหน้าที่เปิดหน้าสถิติ THE system SHALL แสดง: อัตราทำหมันต่อเขต, จำนวนวัคซีนที่ฉีด, สัตว์ที่ overdue
2. The system shall รองรับการกรองตามช่วงเวลา (สัปดาห์, เดือน, ไตรมาส, ปี) และเขต
3. WHEN เจ้าหน้าที่กด export THE system SHALL สร้างรายงาน PDF/Excel ภายใน 10 วินาที

**Dependencies**: US-09, US-11
**Source**: FR-03

---

## Functional Area 4: Adoption System

### US-13: Animal Profile สำหรับรับเลี้ยง
- **As a** ผู้ต้องการรับเลี้ยง
- **I want** ดู profile สัตว์ที่พร้อมรับเลี้ยง พร้อมรายละเอียดครบ
- **So that** ตัดสินใจเลือกสัตว์ที่เหมาะกับตัวเองได้
- **Priority**: High

**Acceptance Criteria (EARS)**:
1. WHEN สัตว์มีสถานะ "พร้อมรับเลี้ยง" THE system SHALL แสดง adoption profile: รูปหลายมุม, อายุประมาณ, นิสัย, สุขภาพ, เหมาะกับสภาพแวดล้อมแบบไหน
2. WHEN ผู้ใช้กรองสัตว์ THE system SHALL รองรับเงื่อนไข: ประเภท, ขนาด, อายุ, นิสัย (เป็นมิตร/ขี้อาย/ร่าเริง), เหมาะกับเด็ก/สัตว์อื่น
3. The system shall แสดงสถานะชัดเจน: พร้อมรับเลี้ยง, กำลังอยู่ในกระบวนการ, ถูกจองแล้ว

**Dependencies**: US-01, US-09
**Source**: D1-4, FR-04

---

### US-14: ลงทะเบียนผู้รับเลี้ยง + Screening
- **As a** ผู้ต้องการรับเลี้ยง
- **I want** สมัครรับเลี้ยงพร้อมกรอกแบบสอบถาม screening ออนไลน์
- **So that** เข้าสู่กระบวนการรับเลี้ยงได้โดยไม่ต้องไปสถานที่
- **Priority**: High

**Acceptance Criteria (EARS)**:
1. WHEN ผู้ใช้กดสมัครรับเลี้ยง THE system SHALL แสดงแบบสอบถาม screening: ที่อยู่อาศัย, ประสบการณ์เลี้ยงสัตว์, เวลาดูแล, สมาชิกในบ้าน, สัตว์เลี้ยงปัจจุบัน
2. WHEN ผู้ใช้ส่งแบบสอบถามสำเร็จ THE system SHALL ประเมินเบื้องต้นอัตโนมัติและแจ้งผลภายใน 24 ชั่วโมง
3. IF screening ไม่ผ่าน THEN ระบบ SHALL แจ้งเหตุผลและแนะนำทางเลือก (เช่น foster แทน) ELSE ดำเนินการขั้นต่อไป

**Dependencies**: US-13
**Source**: D1-7, FR-04

---

### US-15: Matching + Adoption Process
- **As a** ผู้ต้องการรับเลี้ยง
- **I want** ระบบแนะนำสัตว์ที่เหมาะกับ lifestyle ของฉัน
- **So that** ได้สัตว์ที่เหมาะสมและลดโอกาสส่งคืน
- **Priority**: Medium

**Acceptance Criteria (EARS)**:
1. WHEN ผู้ใช้ผ่าน screening THE system SHALL แนะนำสัตว์ 3-5 ตัวที่เหมาะสมตาม lifestyle (ที่อยู่, เวลาว่าง, ประสบการณ์)
2. WHEN ผู้ใช้เลือกสัตว์ THE system SHALL สร้าง adoption flow: สนใจ → นัดพบ → ทดลองเลี้ยง (7 วัน) → ยืนยันรับเลี้ยง
3. WHILE อยู่ในขั้นทดลองเลี้ยง IF ผู้ใช้ต้องการส่งคืน THEN ระบบ SHALL บันทึกเหตุผลและคืนสัตว์สู่สถานะ "พร้อมรับเลี้ยง"

**Dependencies**: US-14
**Source**: FR-04

---

### US-16: Post-Adoption Follow-up
- **As a** เจ้าหน้าที่เทศบาล/NGO
- **I want** ติดตามผลหลังรับเลี้ยงอย่างเป็นระบบ
- **So that** มั่นใจว่าสัตว์ได้รับการดูแลที่ดีและลดอัตราการส่งคืน
- **Priority**: Medium

**Acceptance Criteria (EARS)**:
1. WHEN adoption ยืนยันสำเร็จ THE system SHALL สร้าง follow-up schedule อัตโนมัติ: 1 สัปดาห์, 1 เดือน, 3 เดือน
2. WHEN ถึงกำหนด follow-up THE system SHALL ส่ง notification ถึงผู้รับเลี้ยงให้รายงานสถานะ + แนบรูป
3. IF ผู้รับเลี้ยงไม่ตอบ follow-up 2 ครั้งติดต่อกัน THEN ระบบ SHALL แจ้งเจ้าหน้าที่ให้ติดต่อตรง

**Dependencies**: US-15
**Source**: D1-7, FR-04

---

## Functional Area 5: Community & Volunteer

### US-17: ลงทะเบียน Community Feeder + จุดให้อาหาร
- **As a** community feeder
- **I want** ลงทะเบียนตัวเองและจุดให้อาหารในแผนที่
- **So that** เจ้าหน้าที่รู้ว่ามีคนดูแลบริเวณไหนบ้าง
- **Priority**: Medium

**Acceptance Criteria (EARS)**:
1. WHEN ผู้ใช้ลงทะเบียนจุดให้อาหาร THE system SHALL บันทึก: พิกัด GPS, ช่วงเวลาให้อาหาร, จำนวนสัตว์โดยประมาณ, รูปถ่ายจุด
2. WHEN feeder check-in (กดยืนยันว่ามาให้อาหาร) THE system SHALL บันทึก timestamp + location + เพิ่มคะแนน 5 points
3. The system shall แสดงจุดให้อาหารบนแผนที่พร้อมสถานะ: active (check-in ภายใน 7 วัน), inactive (ไม่มี check-in เกิน 7 วัน)

**Dependencies**: -
**Source**: D1-4, FR-05

---

### US-18: ลงทะเบียนอาสาสมัคร + รับ Assignment
- **As a** อาสาสมัคร
- **I want** ลงทะเบียนพร้อมทักษะ และดูงานที่เปิดรับ
- **So that** ได้ช่วยงานที่เหมาะกับความสามารถและเวลาว่าง
- **Priority**: Medium

**Acceptance Criteria (EARS)**:
1. WHEN ผู้ใช้ลงทะเบียนอาสาสมัคร THE system SHALL บันทึก: ทักษะ (ขับรถ, จับสัตว์, ปฐมพยาบาล, foster), พื้นที่สะดวก, เวลาว่าง
2. WHEN มี assignment ใหม่ที่ match ทักษะ+พื้นที่ THE system SHALL แจ้งอาสาสมัครที่เหมาะสม
3. WHEN อาสาสมัครทำงานเสร็จ THE system SHALL บันทึกชั่วโมง + badge ตามสะสม (10ชม.=Starter, 50ชม.=Active, 200ชม.=Hero)

**Dependencies**: -
**Source**: D1-4, FR-05

---

### US-19: ระบบ Foster
- **As a** อาสาสมัคร
- **I want** รับดูแลสัตว์จรจัดชั่วคราวระหว่างรอ adoption
- **So that** สัตว์ได้รับการดูแลในบ้านแทนที่จะอยู่ข้างนอก
- **Priority**: Medium

**Acceptance Criteria (EARS)**:
1. WHEN อาสาสมัครสมัคร foster THE system SHALL ตรวจสอบคุณสมบัติ (มีพื้นที่, ประสบการณ์) และ match กับสัตว์ที่รอ
2. WHEN foster เริ่มดูแลสัตว์ THE system SHALL สร้าง foster period พร้อมกำหนด check-in รายสัปดาห์
3. WHEN สัตว์ได้ adopter หรือ foster ครบกำหนด THE system SHALL แจ้ง foster และจัดการส่งต่อ

**Dependencies**: US-18, US-13
**Source**: FR-05

---

### US-20: บริจาค + Sponsor
- **As a** ผู้มีจิตศรัทธา
- **I want** บริจาคเงิน/สิ่งของ หรือ sponsor สัตว์ตัวใดตัวหนึ่ง
- **So that** ช่วยสนับสนุนค่าใช้จ่ายในการดูแลสัตว์จรจัด
- **Priority**: Low

**Acceptance Criteria (EARS)**:
1. WHEN ผู้ใช้เลือก sponsor สัตว์ THE system SHALL แสดงข้อมูลสัตว์ + ค่าใช้จ่ายต่อเดือน (อาหาร, สุขภาพ) + ช่องทางบริจาค
2. WHEN ผู้บริจาค sponsor สัตว์สำเร็จ THE system SHALL ส่ง update รายเดือนเกี่ยวกับสัตว์ที่ sponsor (รูป, สถานะ)
3. The system shall บันทึกยอดบริจาครวมและแสดง transparency report (รายรับ-รายจ่าย)

**Dependencies**: US-01
**Source**: FR-05

---

## Functional Area 6: Map & Area Management

### US-21: แผนที่แสดงข้อมูลสัตว์จรจัด (Heatmap)
- **As a** เจ้าหน้าที่เทศบาล
- **I want** ดูแผนที่ heatmap แสดงความหนาแน่นสัตว์จรจัดแต่ละพื้นที่
- **So that** วางแผน TNR campaign ได้ตรงจุดที่ต้องการมากที่สุด
- **Priority**: High

**Acceptance Criteria (EARS)**:
1. WHILE จำนวนสัตว์ลงทะเบียนในพื้นที่ < 100 ตัว THE system SHALL แสดงเป็น individual markers พร้อม popup ข้อมูลย่อ
2. WHILE จำนวนสัตว์ลงทะเบียนในพื้นที่ >= 100 ตัว THE system SHALL render heatmap ภายใน 2 วินาที แสดงความหนาแน่นจาก GPS data
3. The system shall แสดง layers ที่เลือกเปิด/ปิดได้: สัตว์จรจัด, จุดให้อาหาร, shelter/คลินิก, พื้นที่ TNR campaign
4. WHEN ผู้ใช้ zoom เข้าไประดับเขต/แขวง THE system SHALL แสดง markers แต่ละตัวพร้อม popup ข้อมูลย่อ (ไม่ว่าจะอยู่ใน mode ไหน)

**Dependencies**: US-01, US-17
**Source**: D1-4, FR-06, Prototype discovery

---

### US-22: แบ่งโซนรับผิดชอบ + มอบหมายทีม
- **As a** เจ้าหน้าที่เทศบาล
- **I want** กำหนดโซนรับผิดชอบและ assign ทีมดูแลแต่ละโซน
- **So that** มีผู้รับผิดชอบชัดเจนทุกพื้นที่
- **Priority**: Medium

**Acceptance Criteria (EARS)**:
1. WHEN admin วาดขอบเขตโซนบนแผนที่ THE system SHALL บันทึก polygon area + ชื่อโซน + assign ทีมรับผิดชอบ
2. WHEN มี report ในโซนใดโซนหนึ่ง THE system SHALL auto-assign ไปยังทีมที่รับผิดชอบโซนนั้น
3. The system shall แสดง dashboard ต่อโซน: จำนวนสัตว์, cases open/closed, TNR progress, อัตราทำหมัน

**Dependencies**: US-21, US-07
**Source**: FR-06

---

## Functional Area 7: Admin & Operations

### US-23: Dashboard ภาพรวม
- **As a** เจ้าหน้าที่เทศบาล
- **I want** ดู dashboard ภาพรวมระบบทั้งหมดในหน้าเดียว
- **So that** เห็นสถานะทุกด้านและตัดสินใจได้เร็ว
- **Priority**: High

**Acceptance Criteria (EARS)**:
1. WHEN เจ้าหน้าที่เปิด dashboard THE system SHALL แสดงข้อมูลสรุป: จำนวนสัตว์ในระบบ, cases ทั้งหมด (open/in-progress/closed), TNR progress (%), adoption rate (%), งบใช้/คงเหลือ
2. The system shall โหลด dashboard ภายใน 3 วินาที พร้อมข้อมูล real-time (refresh ทุก 5 นาที)
3. WHEN เจ้าหน้าที่เลือกดูเฉพาะเขต THE system SHALL filter ข้อมูลทั้งหมดตามเขตที่เลือก
4. The system shall แสดง "Action Items" section ที่แนะนำสิ่งที่ต้องทำ เช่น cases เร่งด่วนที่ยัง unassigned, วัคซีน overdue, follow-up ที่ค้างอยู่

**Dependencies**: US-01, US-05, US-09, US-11
**Source**: D1-4, FR-07, Prototype discovery

---

### US-24: Assign Tasks + Track Completion
- **As a** เจ้าหน้าที่เทศบาล
- **I want** มอบหมายงานให้ทีม/อาสาสมัคร และติดตามจนเสร็จ
- **So that** งานทุกชิ้นมีผู้รับผิดชอบและเสร็จตามกำหนด
- **Priority**: Medium

**Acceptance Criteria (EARS)**:
1. WHEN เจ้าหน้าที่สร้าง task THE system SHALL กำหนด: ชื่องาน, ประเภท, deadline, ผู้รับผิดชอบ, priority
2. WHEN ผู้รับผิดชอบอัพเดทสถานะงาน THE system SHALL บันทึก progress + แจ้งผู้มอบหมาย
3. WHILE task ไม่เสร็จ IF เลย deadline THEN ระบบ SHALL เปลี่ยนสถานะเป็น "overdue" + แจ้งเตือน escalation

**Dependencies**: US-18
**Source**: FR-07

---

### US-25: Monthly Report + KPI Tracking
- **As a** เจ้าหน้าที่เทศบาล
- **I want** ระบบสร้างรายงานประจำเดือนอัตโนมัติ
- **So that** ใช้รายงานต่อผู้บริหารและวางนโยบายได้
- **Priority**: Medium

**Acceptance Criteria (EARS)**:
1. WHEN ถึงวันที่ 1 ของเดือน THE system SHALL สร้าง draft monthly report อัตโนมัติรวมข้อมูลเดือนก่อน
2. The system shall ติดตาม KPI: registered animals, sterilization rate, adoption rate, report resolution rate, volunteer hours, budget utilization
3. WHEN เจ้าหน้าที่กด export THE system SHALL สร้าง PDF report พร้อมกราฟ/chart ภายใน 15 วินาที

**Dependencies**: US-23
**Source**: FR-07

---

### US-26: User Management + RBAC
- **As a** admin ระบบ
- **I want** จัดการผู้ใช้และกำหนดสิทธิ์ตามบทบาท
- **So that** ผู้ใช้แต่ละคนเข้าถึงได้เฉพาะข้อมูลที่เกี่ยวข้อง
- **Priority**: High

**Acceptance Criteria (EARS)**:
1. The system shall รองรับ 7 roles: citizen, adopter, feeder, volunteer, vet, officer, ngo โดยแต่ละ role มีสิทธิ์ต่างกัน
2. WHEN admin สร้างผู้ใช้ใหม่ THE system SHALL กำหนด role + scope (เขตที่รับผิดชอบ) + ส่ง invitation
3. WHILE ผู้ใช้มี role "officer" IF เข้าดูข้อมูล THE system SHALL แสดงเฉพาะข้อมูลในเขตที่รับผิดชอบ

**Dependencies**: -
**Source**: D1-7, FR-07

---

## Cross-Cutting: Non-Functional Requirements

### US-27: PDPA Compliance + Data Privacy
- **As a** admin ระบบ
- **I want** ระบบปฏิบัติตาม PDPA ในทุกส่วนที่เกี่ยวข้องกับข้อมูลส่วนบุคคล
- **So that** ไม่ละเมิดกฎหมายและผู้ใช้เชื่อมั่นในระบบ
- **Priority**: High

**Acceptance Criteria (EARS)**:
1. WHEN ผู้ใช้ลงทะเบียน THE system SHALL แสดง consent form และบันทึกความยินยอมก่อนเก็บข้อมูลส่วนบุคคล
2. WHEN ผู้ใช้ร้องขอลบข้อมูล THE system SHALL ดำเนินการลบ/anonymize ข้อมูลส่วนบุคคลภายใน 30 วัน
3. The system shall เข้ารหัสข้อมูลส่วนบุคคล (ชื่อ, ที่อยู่, เบอร์โทร) ทั้ง at-rest (AES-256) และ in-transit (TLS 1.2+)
4. WHEN ผู้ใช้แจ้ง anonymous THE system SHALL ไม่บันทึกข้อมูลระบุตัวตนใดๆ

**Dependencies**: US-26
**Source**: D1-7, D1-9

---

### US-28: Performance + Scalability
- **As a** ผู้ใช้ทุกบทบาท
- **I want** ระบบตอบสนองเร็วและรองรับข้อมูลจำนวนมาก
- **So that** ใช้งานได้ลื่นไหลแม้มีผู้ใช้จำนวนมาก
- **Priority**: High

**Acceptance Criteria (EARS)**:
1. The system shall โหลดหน้าใดก็ตามภายใน 3 วินาที (P95) บน 4G mobile connection
2. The system shall render แผนที่ + heatmap ภายใน 2 วินาที
3. The system shall รองรับ 50,000+ registered animals โดย response time ไม่เกิน 500ms สำหรับ search/filter
4. The system shall รองรับ concurrent users 1,000 คนพร้อมกัน โดยไม่ degradation
5. The system shall ออกแบบให้ขยายจาก 5-10 เขตนำร่อง → ทั่ว กทม. (50 เขต) → ทั่วประเทศ (multi-tenant)

**Dependencies**: -
**Source**: D1-9, NFR

---

## Story Summary

| ID | Title | Area | Priority | Dependencies |
|----|-------|------|----------|--------------|
| US-01 | ลงทะเบียนสัตว์จรจัด | Animal Registry | High | - |
| US-02 | ตรวจสอบสัตว์ซ้ำ | Animal Registry | High | US-01 |
| US-03 | ค้นหาและดูข้อมูลสัตว์ | Animal Registry | High | US-01 |
| US-04 | อัพเดทข้อมูลสัตว์ | Animal Registry | Medium | US-01 |
| US-05 | แจ้งพบสัตว์จรจัด | Citizen Reporting | High | - |
| US-06 | ติดตามสถานะรายงาน | Citizen Reporting | High | US-05 |
| US-07 | จัดการ case (Workflow) | Citizen Reporting | High | US-05 |
| US-08 | Gamification | Citizen Reporting | Low | US-05, US-06 |
| US-09 | บันทึก Medical Record | Health & Medical | High | US-01 |
| US-10 | กำหนดการวัคซีน | Health & Medical | Medium | US-09 |
| US-11 | TNR Campaign Management | Health & Medical | High | US-09, US-01 |
| US-12 | สถิติสุขภาพ | Health & Medical | Medium | US-09, US-11 |
| US-13 | Animal Profile (Adoption) | Adoption | High | US-01, US-09 |
| US-14 | ลงทะเบียนผู้รับเลี้ยง + Screening | Adoption | High | US-13 |
| US-15 | Matching + Adoption Process | Adoption | Medium | US-14 |
| US-16 | Post-Adoption Follow-up | Adoption | Medium | US-15 |
| US-17 | Community Feeder | Community & Volunteer | Medium | - |
| US-18 | อาสาสมัคร + Assignment | Community & Volunteer | Medium | - |
| US-19 | ระบบ Foster | Community & Volunteer | Medium | US-18, US-13 |
| US-20 | บริจาค + Sponsor | Community & Volunteer | Low | US-01 |
| US-21 | Heatmap แผนที่ | Map & Area | High | US-01, US-17 |
| US-22 | แบ่งโซน + มอบหมายทีม | Map & Area | Medium | US-21, US-07 |
| US-23 | Dashboard ภาพรวม | Admin & Operations | High | US-01, US-05, US-09, US-11 |
| US-24 | Assign Tasks + Track | Admin & Operations | Medium | US-18 |
| US-25 | Monthly Report + KPI | Admin & Operations | Medium | US-23 |
| US-26 | User Management + RBAC | Admin & Operations | High | - |
| US-27 | PDPA Compliance | Cross-Cutting | High | US-26 |
| US-28 | Performance + Scalability | Cross-Cutting | High | - |

## Story-Persona Matrix

| Story | สมศรี (ประชาชน) | มินตรา (ผู้รับเลี้ยง) | ลุงสมชาย (feeder) | น้องเมย์ (อาสา) | หมอปาน (สัตวแพทย์) | คุณวิชัย (เจ้าหน้าที่) | คุณนภา (NGO) |
|-------|---|---|---|---|---|---|---|
| US-01 | — | — | — | Secondary | Secondary | Primary | — |
| US-02 | — | — | — | — | — | Primary | — |
| US-03 | Secondary | Secondary | — | Secondary | Secondary | Primary | Secondary |
| US-04 | — | — | — | Secondary | Primary | Primary | — |
| US-05 | Primary | — | Secondary | — | — | — | — |
| US-06 | Primary | — | Secondary | — | — | — | — |
| US-07 | — | — | — | — | — | Primary | — |
| US-08 | Primary | — | Secondary | — | — | — | — |
| US-09 | — | — | — | — | Primary | Secondary | — |
| US-10 | — | — | — | — | Secondary | Primary | — |
| US-11 | — | — | — | Secondary | Primary | Primary | — |
| US-12 | — | — | — | — | Secondary | Primary | Secondary |
| US-13 | — | Primary | — | — | — | — | Secondary |
| US-14 | — | Primary | — | — | — | — | — |
| US-15 | — | Primary | — | — | — | Secondary | Secondary |
| US-16 | — | Secondary | — | — | — | Primary | Primary |
| US-17 | — | — | Primary | — | — | Secondary | — |
| US-18 | — | — | — | Primary | — | Secondary | — |
| US-19 | — | — | — | Primary | — | Secondary | Secondary |
| US-20 | Secondary | Secondary | — | — | — | — | Primary |
| US-21 | — | — | — | — | — | Primary | — |
| US-22 | — | — | — | — | — | Primary | — |
| US-23 | — | — | — | — | — | Primary | Secondary |
| US-24 | — | — | — | Secondary | — | Primary | — |
| US-25 | — | — | — | — | — | Primary | Secondary |
| US-26 | — | — | — | — | — | Primary | — |
| US-27 | Primary | Primary | Primary | Primary | Primary | Primary | Primary |
| US-28 | Primary | Primary | Primary | Primary | Primary | Primary | Primary |

## Non-Functional Notes
- **PDPA**: ข้อมูลส่วนบุคคลต้อง encrypt ทั้ง at-rest และ in-transit, รองรับ right to erasure
- **Offline**: Field staff (สัตวแพทย์, อาสาสมัคร) ต้องทำงานได้แม้ไม่มี internet
- **Mobile-first**: UI ออกแบบสำหรับ mobile ก่อน responsive ไป desktop
- **Multi-tenant**: ขยายจากเขตนำร่อง → ทั่ว กทม. → ทั่วประเทศ
- **Availability**: uptime > 99.5%, กรณีเร่งด่วน process 24/7

## External References

| Source | Stories Derived | What was used |
|--------|----------------|---------------|
| requirements-th-stray-animal.md | US-01 to US-28 | Functional requirements FR-01 to FR-07, NFR, target users, success metrics |
