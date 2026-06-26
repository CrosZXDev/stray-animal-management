# Personas

## Summary
- **User Types**: 7 personas
- **Key Roles**: สมศรี (ประชาชน), มินตรา (ผู้รับเลี้ยง), ลุงสมชาย (community feeder), น้องเมย์ (อาสาสมัคร), หมอปาน (สัตวแพทย์อาสา), คุณวิชัย (เจ้าหน้าที่เทศบาล), คุณนภา (NGO)
- **Design Implications**: RBAC, Mobile-first, LINE OA integration, Offline capability สำหรับ field staff, PDPA compliance

## Overview
ระบบนี้รองรับผู้ใช้ 7 กลุ่มที่มีบทบาทและความต้องการแตกต่างกัน ตั้งแต่ประชาชนทั่วไปที่แจ้งเบาะแส ไปจนถึงเจ้าหน้าที่บริหารจัดการระบบทั้งหมด

---

## สมศรี — ประชาชนผู้แจ้งเบาะแส

**Role**: ประชาชนทั่วไปที่พบเห็นสัตว์จรจัดในพื้นที่

**Goals**:
- แจ้งพบสัตว์จรจัดที่มีปัญหา (บาดเจ็บ, ก้าวร้าว, ฝูงเพิ่ม) ได้สะดวกรวดเร็ว
- ติดตามผลการดำเนินการหลังแจ้ง

**Pain Points**:
- ไม่รู้จะแจ้งที่ไหน โทรไปก็ไม่มีคนรับ
- แจ้งแล้วไม่รู้ว่าใครมาจัดการหรือยัง
- กลัวสุนัขจรจัดก้าวร้าวในซอย ไม่รู้จะทำอย่างไร

**User Journey**: เปิด LINE OA / Web App → ถ่ายรูป + ปักหมุด → เลือกประเภทปัญหา → ส่ง → ได้เลข tracking → รับแจ้งผลเมื่อดำเนินการเสร็จ

**Implications**: UI ต้องง่ายมาก 3 ขั้นตอนจบ, รองรับ LINE OA, ไม่ต้อง login ก็แจ้งได้ (anonymous), แจ้งเตือนผ่าน push notification

---

## มินตรา — ผู้ต้องการรับเลี้ยง

**Role**: คนรักสัตว์ที่ต้องการรับเลี้ยงสุนัข/แมวจรจัด

**Goals**:
- หาสัตว์ที่เหมาะกับ lifestyle ของตัวเอง
- ขั้นตอนสมัครรับเลี้ยงไม่ยุ่งยาก

**Pain Points**:
- ไม่รู้จะไปรับเลี้ยงจากที่ไหน
- กลัวว่าสัตว์จะมีปัญหาสุขภาพที่ไม่รู้มาก่อน
- ขั้นตอนเอกสารยุ่งยาก

**User Journey**: เข้า app → browse สัตว์ที่พร้อมรับเลี้ยง → กรอง (ขนาด, นิสัย, อายุ) → ดู profile ละเอียด → สมัคร screening → นัดพบ → ทดลองเลี้ยง → ยืนยัน

**Implications**: UI แสดง profile สัตว์ชัดเจน (รูปหลายมุม, ประวัติสุขภาพ, นิสัย), matching algorithm, กระบวนการ screening ออนไลน์, follow-up notification

---

## ลุงสมชาย — Community Feeder

**Role**: ผู้ดูแลให้อาหารสัตว์จรจัดในพื้นที่ประจำ

**Goals**:
- ลงทะเบียนจุดให้อาหารของตัวเอง
- รายงานสถานะสัตว์ในพื้นที่ (เพิ่ม/ลด, ป่วย, หายไป)

**Pain Points**:
- ไม่มีใครรับรู้สิ่งที่ทำ
- สัตว์ป่วยก็ไม่รู้จะแจ้งใครให้มาช่วย
- บางทีมีคนมาทิ้งสัตว์เพิ่มในจุดที่ดูแล

**User Journey**: ลงทะเบียนตัวเอง + จุดให้อาหาร → check-in เมื่อมาให้อาหาร → รายงานสถานะสัตว์ → ได้คะแนน/badge → แจ้งปัญหาเร่งด่วนได้เลย

**Implications**: Gamification (คะแนน, badge), check-in ง่าย 1 tap, รายงานด่วนต้องเร็ว, GPS tracking จุดให้อาหาร

---

## น้องเมย์ — อาสาสมัคร

**Role**: คนรุ่นใหม่ที่อยากช่วยเหลือสัตว์จรจัดในเวลาว่าง

**Goals**:
- รับงานอาสาสมัครที่เหมาะกับเวลาว่างและทักษะ
- บันทึกชั่วโมงทำงาน เก็บ portfolio

**Pain Points**:
- ไม่รู้จะไปช่วยที่ไหน ทำอะไรได้บ้าง
- อยากมี certificate/ใบรับรอง

**User Journey**: ลงทะเบียน + ระบุทักษะ (ขับรถ, จับสัตว์, foster) → ดู assignments ที่เปิดอยู่ → รับงาน → ทำงาน + บันทึก → ได้ชั่วโมง + badge → ขอ certificate

**Implications**: Assignment matching ตามทักษะ+พื้นที่+เวลาว่าง, บันทึกชั่วโมงง่าย, gamification, certificate PDF export

---

## หมอปาน — สัตวแพทย์อาสา

**Role**: สัตวแพทย์ที่อาสาทำหมัน/ฉีดวัคซีน/รักษาสัตว์จรจัด

**Goals**:
- ดู schedule งาน TNR campaign / วัคซีน
- บันทึก medical record ได้ง่ายในพื้นที่ (field)

**Pain Points**:
- บันทึกบนกระดาษ ข้อมูลหาย
- ไม่รู้ว่าสัตว์ตัวนี้เคยทำหมัน/ฉีดวัคซีนอะไรมาแล้ว
- Internet ไม่ดีในพื้นที่ที่ไปทำงาน

**User Journey**: ดู calendar TNR → เตรียมอุปกรณ์ → ไปพื้นที่ → สแกน/ค้นหาสัตว์ → บันทึก medical record → sync เมื่อมี internet

**Implications**: Offline capability (บันทึก + sync ทีหลัง), UI บันทึกเร็ว (preset templates), ดูประวัติสัตว์แต่ละตัวทันที, calendar/schedule view

---

## คุณวิชัย — เจ้าหน้าที่เทศบาล/กทม.

**Role**: เจ้าหน้าที่รับผิดชอบงานสัตว์จรจัดในเขต

**Goals**:
- บริหารจัดการ case ที่ประชาชนแจ้ง assign ให้ทีม
- ดู dashboard ภาพรวม วางแผนทรัพยากร

**Pain Points**:
- ไม่รู้ว่ามีสัตว์จรจัดกี่ตัวในเขต
- ไม่มีข้อมูลวัดผลว่าทำหมันไปกี่ตัวแล้ว
- จัดการ case ด้วย excel/กระดาษ

**User Journey**: เปิด dashboard → ดูภาพรวม (จำนวน, cases, TNR progress) → assign cases ให้ทีม → track progress → สรุปรายงานประจำเดือน → export

**Implications**: Dashboard real-time, case management workflow, assign/track/resolve, report generation, data export, role-based access (ดูได้เฉพาะเขตตัวเอง)

---

## คุณนภา — ผู้ประสานงาน NGO/มูลนิธิ

**Role**: เจ้าหน้าที่มูลนิธิช่วยเหลือสัตว์ที่ร่วมงานกับเทศบาล

**Goals**:
- เข้าถึงข้อมูลสัตว์เพื่อประสานงาน adoption
- รับ referral cases จากเทศบาล

**Pain Points**:
- ได้ข้อมูลช้า ต้องโทรถามทีละเคส
- ไม่รู้ว่าสัตว์ตัวไหนพร้อม adopt

**User Journey**: Login → ดู list สัตว์ที่พร้อมรับเลี้ยง → ประสานหา adopter → ส่ง referral → ติดตามผล adoption

**Implications**: API access / shared view กับเทศบาล, referral workflow, adoption progress tracking, ข้อมูล limited ตาม PDPA (ไม่เห็นข้อมูลส่วนบุคคลผู้รับเลี้ยง)

---

## Design Implications

- **Architecture**: RBAC 7 roles, multi-tenant (per เขต), offline sync สำหรับ field staff
- **UI/UX**: Mobile-first, LINE OA integration, 3-step reporting, Thai language, gamification elements
- **Data & Privacy**: PDPA compliant, anonymous reporting option, ข้อมูลส่วนบุคคลผู้รับเลี้ยงจำกัดการเข้าถึง, data access scoped by area/role
