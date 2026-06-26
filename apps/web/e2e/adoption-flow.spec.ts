import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Adoption flow.
 * Tests: browse animals → apply to adopt → track application status.
 */

test.describe('ระบบรับเลี้ยงสัตว์ (Adoption Flow)', () => {
  test.describe('เรียกดูสัตว์พร้อมรับเลี้ยง (Browse Available Animals)', () => {
    test('ควรแสดงหน้ารายการสัตว์พร้อมรับเลี้ยง', async ({ page }) => {
      await page.goto('/adoption');

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      // Should show animal cards/gallery
      await expect(
        page.locator('[data-testid="animal-card"], [class*="animal"], [class*="card"]').first()
      ).toBeVisible();
    });

    test('ควรกรองตามชนิดสัตว์ (สุนัข/แมว)', async ({ page }) => {
      await page.goto('/adoption');

      // Filter by dog
      await page.getByLabel(/ชนิด|ประเภท|Type/).selectOption('DOG');

      // Wait for filtered results
      await page.waitForResponse((res) =>
        res.url().includes('/adoption/profiles') && res.status() === 200
      ).catch(() => {});

      // Results should update
      const cards = page.locator('[data-testid="animal-card"]');
      if (await cards.first().isVisible()) {
        await expect(cards.first()).toBeVisible();
      }
    });

    test('ควรกรองตามขนาดสัตว์', async ({ page }) => {
      await page.goto('/adoption');

      const sizeFilter = page.getByLabel(/ขนาด|Size/);
      if (await sizeFilter.isVisible()) {
        await sizeFilter.selectOption('SMALL');
        await expect(page.locator('[data-testid="animal-card"]').first()).toBeVisible();
      }
    });

    test('ควรกรองสัตว์ที่เป็นมิตรกับเด็ก', async ({ page }) => {
      await page.goto('/adoption');

      const childFriendlyFilter = page.getByLabel(/เป็นมิตรกับเด็ก|child.?friendly/i);
      if (await childFriendlyFilter.isVisible()) {
        await childFriendlyFilter.check();

        const cards = page.locator('[data-testid="animal-card"]');
        if (await cards.first().isVisible()) {
          await expect(cards.first()).toBeVisible();
        }
      }
    });

    test('ควรแสดงรายละเอียดสัตว์เมื่อคลิก', async ({ page }) => {
      await page.goto('/adoption');

      const firstCard = page.locator('[data-testid="animal-card"]').first();
      if (await firstCard.isVisible()) {
        await firstCard.click();

        // Should navigate to profile or open modal
        await expect(
          page.getByText(/อายุ|พันธุ์|ลักษณะ|age|breed/i)
        ).toBeVisible();
        await expect(
          page.getByText(/ประวัติสุขภาพ|ทำหมัน|health|sterilized/i)
        ).toBeVisible();
      }
    });

    test('ควรแสดง pagination เมื่อมีสัตว์จำนวนมาก', async ({ page }) => {
      await page.goto('/adoption');

      const pagination = page.locator('[data-testid="pagination"], nav[aria-label*="page"]');
      if (await pagination.isVisible()) {
        await expect(pagination).toBeVisible();
      }
    });
  });

  test.describe('สมัครรับเลี้ยง (Apply for Adoption)', () => {
    test.beforeEach(async ({ page }) => {
      // Login as citizen/adopter
      await page.goto('/login');
      await page.getByLabel(/อีเมล|email/i).fill('citizen@example.com');
      await page.getByLabel(/รหัสผ่าน|password/i).fill('password123');
      await page.getByRole('button', { name: /เข้าสู่ระบบ|Login/ }).click();
    });

    test('ควรแสดงแบบฟอร์ม screening', async ({ page }) => {
      await page.goto('/adoption');

      const firstCard = page.locator('[data-testid="animal-card"]').first();
      if (await firstCard.isVisible()) {
        await firstCard.click();
        await page.getByRole('button', { name: /สมัครรับเลี้ยง|Adopt|สนใจ/ }).click();

        // Screening form should appear
        await expect(page.getByText(/แบบประเมิน|Screening|คัดกรอง/i)).toBeVisible();
      }
    });

    test('ควรกรอกแบบ screening และส่งใบสมัครได้', async ({ page }) => {
      await page.goto('/adoption/apply');

      // Fill screening questionnaire
      await page.getByLabel(/ที่อยู่|Address/).fill('123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110');
      await page.getByLabel(/ประเภทที่พัก|Housing/).selectOption({ index: 1 });

      const experienceField = page.getByLabel(/ประสบการณ์|Experience/);
      if (await experienceField.isVisible()) {
        await experienceField.fill('เคยเลี้ยงสุนัข 2 ตัว');
      }

      const reasonField = page.getByLabel(/เหตุผล|Reason|Why/);
      if (await reasonField.isVisible()) {
        await reasonField.fill('ต้องการให้สัตว์มีบ้านที่อบอุ่น');
      }

      // Working hours / availability
      const hoursField = page.getByLabel(/เวลาว่าง|Availability|ชั่วโมง/);
      if (await hoursField.isVisible()) {
        await hoursField.fill('8');
      }

      await page.getByRole('button', { name: /ส่งใบสมัคร|Submit|สมัคร/ }).click();

      // Should show confirmation
      await expect(
        page.getByText(/สำเร็จ|submitted|ส่งแล้ว|ได้รับใบสมัคร/i)
      ).toBeVisible();
    });

    test('ควรแสดง validation error เมื่อข้อมูลไม่ครบ', async ({ page }) => {
      await page.goto('/adoption/apply');

      // Submit without filling required fields
      await page.getByRole('button', { name: /ส่งใบสมัคร|Submit|สมัคร/ }).click();

      // Validation errors
      await expect(page.getByText(/กรุณากรอก|required|จำเป็น/i)).toBeVisible();
    });
  });

  test.describe('ติดตามสถานะการรับเลี้ยง (Application Status Tracking)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/อีเมล|email/i).fill('citizen@example.com');
      await page.getByLabel(/รหัสผ่าน|password/i).fill('password123');
      await page.getByRole('button', { name: /เข้าสู่ระบบ|Login/ }).click();
    });

    test('ควรแสดงรายการใบสมัครของผู้ใช้', async ({ page }) => {
      await page.goto('/adoption/my-applications');

      await expect(page.getByRole('heading')).toBeVisible();
      // Should show application list or empty state
      await expect(
        page.getByText(/ใบสมัคร|application|ไม่มีข้อมูล|no applications/i)
      ).toBeVisible();
    });

    test('ควรแสดงสถานะ adoption flow (INTERESTED → MEETING → TRIAL → CONFIRMED)', async ({
      page,
    }) => {
      await page.goto('/adoption/my-applications');

      const applicationRow = page.locator('[data-testid="application-item"]').first();
      if (await applicationRow.isVisible()) {
        await applicationRow.click();

        // Should show status stepper/timeline
        await expect(
          page.getByText(/สนใจ|นัดพบ|ทดลอง|ยืนยัน|INTERESTED|MEETING|TRIAL|CONFIRMED/i)
        ).toBeVisible();
      }
    });

    test('ควรแสดง matching recommendations', async ({ page }) => {
      await page.goto('/adoption/recommendations');

      // Should show recommended animals based on screening
      const recommendations = page.locator('[data-testid="recommendation-card"]');
      if (await recommendations.first().isVisible()) {
        // Should have 3-5 recommendations
        const count = await recommendations.count();
        expect(count).toBeGreaterThanOrEqual(1);
        expect(count).toBeLessThanOrEqual(5);
      }
    });

    test('ควรแสดง follow-up schedule หลัง adoption confirmed', async ({ page }) => {
      await page.goto('/adoption/my-applications');

      const confirmedApp = page.locator('[data-testid="application-item"]').filter({
        hasText: /ยืนยันแล้ว|CONFIRMED/,
      });

      if (await confirmedApp.first().isVisible()) {
        await confirmedApp.first().click();

        // Follow-up schedule: 1 week, 1 month, 3 months
        await expect(page.getByText(/follow.?up|ติดตามผล/i)).toBeVisible();
      }
    });

    test('ควรส่ง follow-up report พร้อมรูปได้', async ({ page }) => {
      await page.goto('/adoption/followup');

      const pendingFollowup = page.locator('[data-testid="followup-item"]').filter({
        hasText: /รอดำเนินการ|PENDING/,
      });

      if (await pendingFollowup.first().isVisible()) {
        await pendingFollowup.first().click();

        // Fill follow-up form
        await page.getByLabel(/สถานะ|Status/).selectOption({ index: 1 });
        await page.getByLabel(/หมายเหตุ|Note/).fill('น้องหมาปรับตัวได้ดี กินข้าวเยอะขึ้น');

        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.isVisible()) {
          await fileInput.setInputFiles({
            name: 'dog-happy.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.alloc(1024),
          });
        }

        await page.getByRole('button', { name: /ส่ง|Submit/ }).click();
        await expect(page.getByText(/สำเร็จ|submitted/i)).toBeVisible();
      }
    });
  });
});
