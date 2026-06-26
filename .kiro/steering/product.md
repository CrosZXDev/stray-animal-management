---
inclusion: always
---

# Product Context

## Summary
ระบบจัดการสัตว์จรจัด (สุนัข/แมว) สำหรับกรุงเทพมหานครและเทศบาล ครอบคลุมตั้งแต่ลงทะเบียน ติดตามสุขภาพ ทำหมัน ฉีดวัคซีน adoption และ community engagement
กลุ่มผู้ใช้: ประชาชนทั่วไป, ผู้ต้องการรับเลี้ยง, community feeder, อาสาสมัคร, สัตวแพทย์อาสา, เจ้าหน้าที่เทศบาล/กทม., NGO/มูลนิธิ
ประเภท: Greenfield | Scope: new

## Overview
กรุงเทพมหานครและเทศบาลมีปัญหาสัตว์จรจัดจำนวนมาก ส่งผลต่อสุขอนามัย ความปลอดภัย และสวัสดิภาพสัตว์ ระบบนี้เป็น digital platform สำหรับบริหารจัดการสัตว์จรจัดอย่างเป็นระบบ เปิดให้ประชาชนมีส่วนร่วมในการแจ้งเบาะแส ดูแล และรับเลี้ยง โดยใช้แนวทาง TNR (Trap, Neuter, Return) ร่วมกับ Adoption เพื่อลดจำนวนสัตว์จรจัดอย่างมีมนุษยธรรม

## Problem Statement
- ไม่มีฐานข้อมูลกลาง ไม่รู้จำนวนและที่อยู่ที่แท้จริงของสัตว์จรจัด
- การทำหมัน/ฉีดวัคซีนไม่ทั่วถึง เพราะไม่รู้ว่าตัวไหนทำแล้ว/ยังไม่ทำ
- ประชาชนไม่มีช่องทางแจ้งปัญหาที่สะดวกและติดตามผลได้
- ขั้นตอน adoption ยุ่งยาก ไม่มี platform กลาง
- ไม่มีระบบติดตามหลัง adoption
- งบประมาณจำกัด ต้องจัดสรรทรัพยากรอย่างมีประสิทธิภาพ
- ขาดข้อมูลสำหรับวางนโยบาย

## Target Users
- **ประชาชนทั่วไป**: แจ้งพบสัตว์จรจัด/ปัญหา ต้องการแจ้งง่ายและติดตามผลได้
- **ผู้ต้องการรับเลี้ยง**: หาสัตว์มาเลี้ยง ดู profile สัตว์ สมัครรับเลี้ยงง่าย
- **Community feeder**: ดูแลสัตว์จรจัดในพื้นที่ ลงทะเบียนจุดดูแล report สถานะ
- **อาสาสมัคร**: ช่วยจับ/ขนส่ง/foster รับ assignment บันทึกงาน
- **สัตวแพทย์อาสา**: ทำหมัน/ฉีดวัคซีน/รักษา ดู schedule บันทึก medical record
- **เจ้าหน้าที่เทศบาล/กทม.**: บริหารจัดการ dashboard reports จัดสรรทรัพยากร
- **NGO/มูลนิธิ**: สนับสนุนการดำเนินงาน ข้อมูล ประสานงาน adoption

## Key Features
- **Animal Registry**: ฐานข้อมูลสัตว์จรจัด รูปถ่าย ลักษณะ พิกัด สถานะ ประวัติสุขภาพ duplicate detection
- **Citizen Reporting**: แจ้งพบสัตว์จรจัด/ปัญหา พร้อมรูป+พิกัด workflow ติดตามสถานะ gamification
- **Health & Medical Records**: บันทึกทำหมัน วัคซีน การรักษา TNR campaign management
- **Adoption System**: profile matching screening follow-up post-adoption
- **Community & Volunteer**: feeder อาสาสมัคร foster บริจาค sponsor
- **Map & Area Management**: heatmap โซนรับผิดชอบ TNR area จุดให้อาหาร shelter
- **Admin & Operations**: dashboard workflow reporting KPI budget

## Domain Language
| Term | Definition | Example |
|------|-----------|---------|
| TNR | Trap, Neuter, Return — จับ ทำหมัน ปล่อยคืน | TNR Campaign เขตบางกะปิ |
| Ear-tip | ตัดปลายหูเป็นสัญลักษณ์ว่าทำหมันแล้ว | สัตว์ที่ ear-tip แล้วไม่ต้องจับซ้ำ |
| Community feeder | ผู้ดูแลให้อาหารสัตว์จรจัดในพื้นที่ | จุดให้อาหารหน้าตลาด |
| Foster | รับดูแลชั่วคราวระหว่างรอ adoption | foster สุนัข 2 สัปดาห์ |
| Screening | กระบวนการคัดกรองผู้รับเลี้ยง | แบบสอบถาม + สัมภาษณ์ |
| Heatmap | แผนที่แสดงความหนาแน่นสัตว์จรจัด | heatmap เขตวัฒนา |

## Success Criteria
| Metric | Target |
|--------|--------|
| สัตว์ลงทะเบียน (ปีแรก) | > 10,000 ตัว |
| อัตราทำหมัน (พื้นที่นำร่อง) | > 70% |
| Adoption success rate | > 80% |
| รายงานจากประชาชนที่แก้ไขแล้ว | > 85% ภายใน 72 ชม. |
| อาสาสมัครที่ active | > 500 คน |
| จุดให้อาหารลงทะเบียน | > 200 จุด |
| ประชากรสัตว์จรจัดลดลง (ปีที่ 2) | > 15% |
| Post-adoption follow-up completion | > 90% |

## Constraints & Assumptions
### Constraints
- เริ่มนำร่อง 5-10 เขตใน กทม. ก่อนขยาย
- ต้อง PDPA compliant
- Mobile-first, ภาษาไทย
- รองรับ LINE OA integration
- Performance: page load < 3s, map rendering < 2s

### Assumptions
- ใช้ภาพถ่ายเป็นหลักในการระบุตัวตนสัตว์
- มีสัตวแพทย์อาสาหรือคลินิกพันธมิตร
- เทศบาล/กทม. เป็นผู้ดูแลระบบหลัก
- สัตว์ที่ทำหมันแล้วจะถูก ear-tip

## Project Type
- Type: Greenfield
- Scope: New product
