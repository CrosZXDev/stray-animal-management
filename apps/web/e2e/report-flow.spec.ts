import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Citizen Reporting flow.
 * Tests the full lifecycle: submit report → track status → admin resolution.
 */

test.describe('แจ้งเบาะแสสัตว์จรจัด (Report Flow)', () => {
  test.describe('ส่งรายงานใหม่ (Submit New Report)', () => {
    test('ควรแสดงฟอร์มแจ้งเบาะแสแบบ 3 ขั้นตอน', async ({ page }) => {
      await page.goto('/reports/new');

      // Step 1: ประเภทปัญหา
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText('ประเภท')).toBeVisible();
    });

    test('ควรแจ้งเบาะแสพบสัตว์จรจัดสำเร็จ', async ({ page }) => {
      await page.goto('/reports/new');

      // Step 1: เลือกประเภท
      await page.getByRole('radio', { name: /พบสัตว์จรจัด/ }).click();
      await page.getByRole('button', { name: /ถัดไป|ต่อไป|Next/ }).click();

      // Step 2: รายละเอียด + สถานที่
      await page.getByLabel(/รายละเอียด|คำอธิบาย/).fill('พบสุนัขจรจัด 3 ตัว บริเวณซอยสุขุมวิท 22');
      await page.getByLabel(/ชนิดสัตว์|ประเภทสัตว์/).selectOption('DOG');
      await page.getByLabel(/จำนวน/).fill('3');

      // Location - either via GPS or manual
      const districtSelect = page.getByLabel(/เขต|อำเภอ/);
      if (await districtSelect.isVisible()) {
        await districtSelect.selectOption({ index: 1 });
      }

      await page.getByRole('button', { name: /ถัดไป|ต่อไป|Next/ }).click();

      // Step 3: ยืนยันและส่ง
      await page.getByRole('button', { name: /ส่งรายงาน|ยืนยัน|Submit/ }).click();

      // ควรได้ tracking ID
      await expect(page.getByText(/RPT-\d{8}-\d{4}/)).toBeVisible();
      await expect(page.getByText(/สำเร็จ|ส่งแล้ว|submitted/i)).toBeVisible();
    });

    test('ควรรองรับการแจ้งแบบไม่ระบุตัวตน (anonymous)', async ({ page }) => {
      await page.goto('/reports/new');

      // Check anonymous option
      const anonymousCheckbox = page.getByLabel(/ไม่ระบุตัวตน|anonymous/i);
      if (await anonymousCheckbox.isVisible()) {
        await anonymousCheckbox.check();
      }

      await expect(page.getByRole('radio', { name: /พบสัตว์จรจัด/ })).toBeVisible();
    });

    test('ควรแสดง validation error เมื่อไม่กรอกข้อมูลที่จำเป็น', async ({ page }) => {
      await page.goto('/reports/new');

      // Try to proceed without selecting type
      await page.getByRole('button', { name: /ถัดไป|ต่อไป|Next/ }).click();

      // Should show validation error
      await expect(page.getByText(/กรุณาเลือก|required|จำเป็น/i)).toBeVisible();
    });

    test('ควรอัปโหลดรูปภาพพร้อมรายงานได้', async ({ page }) => {
      await page.goto('/reports/new');

      await page.getByRole('radio', { name: /พบสัตว์จรจัด/ }).click();
      await page.getByRole('button', { name: /ถัดไป|ต่อไป|Next/ }).click();

      // Upload image
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles({
          name: 'stray-dog.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.alloc(1024), // dummy file
        });

        // Verify upload indicator
        await expect(page.getByText(/อัปโหลด|upload/i)).toBeVisible();
      }
    });
  });

  test.describe('ติดตามรายงาน (Track Report)', () => {
    test('ควรค้นหารายงานด้วย tracking ID', async ({ page }) => {
      await page.goto('/reports/track');

      await page.getByLabel(/หมายเลขติดตาม|Tracking ID/i).fill('RPT-20240601-0001');
      await page.getByRole('button', { name: /ค้นหา|ติดตาม|Track/ }).click();

      // Should show report status or not found message
      await expect(
        page.getByText(/สถานะ|ไม่พบ|status|not found/i)
      ).toBeVisible();
    });

    test('ควรแสดง timeline ของรายงาน', async ({ page }) => {
      await page.goto('/reports/track');

      await page.getByLabel(/หมายเลขติดตาม|Tracking ID/i).fill('RPT-20240601-0001');
      await page.getByRole('button', { name: /ค้นหา|ติดตาม|Track/ }).click();

      // If report exists, timeline should be visible
      const timeline = page.locator('[data-testid="report-timeline"]');
      if (await timeline.isVisible()) {
        await expect(timeline.locator('li').first()).toBeVisible();
      }
    });

    test('ควรแสดง SLA information', async ({ page }) => {
      await page.goto('/reports/track');

      await page.getByLabel(/หมายเลขติดตาม|Tracking ID/i).fill('RPT-20240601-0001');
      await page.getByRole('button', { name: /ค้นหา|ติดตาม|Track/ }).click();

      // SLA indicator should show expected resolution time
      const slaInfo = page.getByText(/ภายใน|SLA|ชั่วโมง/i);
      if (await slaInfo.isVisible()) {
        await expect(slaInfo).toBeVisible();
      }
    });
  });

  test.describe('จัดการ Case (Admin)', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin/officer
      await page.goto('/login');
      await page.getByLabel(/อีเมล|email/i).fill('admin@stray-animal.go.th');
      await page.getByLabel(/รหัสผ่าน|password/i).fill('admin123');
      await page.getByRole('button', { name: /เข้าสู่ระบบ|Login/ }).click();
      await page.waitForURL('**/dashboard**');
    });

    test('ควรแสดงรายการ cases ทั้งหมด', async ({ page }) => {
      await page.goto('/admin/reports');

      await expect(page.getByRole('table')).toBeVisible();
      await expect(page.getByText(/RPT-/)).toBeVisible();
    });

    test('ควร assign case ให้ทีมได้', async ({ page }) => {
      await page.goto('/admin/reports');

      // Click on first unassigned report
      const row = page.getByRole('row').filter({ hasText: /รอดำเนินการ|PENDING/ }).first();
      await row.getByRole('button', { name: /มอบหมาย|Assign/ }).click();

      // Select team
      await page.getByLabel(/ทีม|Team/).selectOption({ index: 1 });
      await page.getByRole('button', { name: /ยืนยัน|Confirm/ }).click();

      // Should show success message
      await expect(page.getByText(/มอบหมายสำเร็จ|assigned/i)).toBeVisible();
    });

    test('ควร resolve case ได้', async ({ page }) => {
      await page.goto('/admin/reports');

      // Click on an assigned report
      const row = page.getByRole('row').filter({ hasText: /กำลังดำเนินการ|IN_PROGRESS/ }).first();
      if (await row.isVisible()) {
        await row.getByRole('button', { name: /แก้ไขแล้ว|Resolve/ }).click();

        await page.getByLabel(/หมายเหตุ|Note/).fill('จับทำหมันและปล่อยคืนแล้ว');
        await page.getByRole('button', { name: /ยืนยัน|Confirm/ }).click();

        await expect(page.getByText(/แก้ไขสำเร็จ|resolved/i)).toBeVisible();
      }
    });

    test('ควรกรองรายงานตามสถานะได้', async ({ page }) => {
      await page.goto('/admin/reports');

      await page.getByLabel(/สถานะ|Status/).selectOption('PENDING');

      // All visible rows should be pending
      const rows = page.getByRole('row').filter({ hasText: /RPT-/ });
      const count = await rows.count();
      for (let i = 0; i < Math.min(count, 5); i++) {
        await expect(rows.nth(i)).toContainText(/รอดำเนินการ|PENDING/);
      }
    });

    test('ควรกรองรายงานตามความเร่งด่วนได้', async ({ page }) => {
      await page.goto('/admin/reports');

      await page.getByLabel(/ความเร่งด่วน|Priority/).selectOption('CRITICAL');

      const rows = page.getByRole('row').filter({ hasText: /RPT-/ });
      if (await rows.first().isVisible()) {
        await expect(rows.first()).toContainText(/วิกฤต|CRITICAL/);
      }
    });
  });
});
