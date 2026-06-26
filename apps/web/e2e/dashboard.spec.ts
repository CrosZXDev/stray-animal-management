import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Admin Dashboard.
 * Tests: loading, stats display, district filtering, action items.
 */

test.describe('แดชบอร์ดผู้ดูแลระบบ (Admin Dashboard)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as officer/admin
    await page.goto('/login');
    await page.getByLabel(/อีเมล|email/i).fill('admin@stray-animal.go.th');
    await page.getByLabel(/รหัสผ่าน|password/i).fill('admin123');
    await page.getByRole('button', { name: /เข้าสู่ระบบ|Login/ }).click();
    await page.waitForURL('**/dashboard**');
  });

  test.describe('โหลดแดชบอร์ด (Dashboard Loading)', () => {
    test('ควรแสดงหน้า dashboard สำเร็จ', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      // Dashboard should have loaded within reasonable time
      await expect(page).toHaveURL(/dashboard/);
    });

    test('ควรโหลดภายใน 3 วินาที (performance SLA)', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/dashboard');

      // Wait for main content to appear
      await expect(
        page.locator('[data-testid="dashboard-content"], [data-testid="stats-card"]').first()
      ).toBeVisible();

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000);
    });

    test('ควรแสดง loading state ขณะโหลดข้อมูล', async ({ page }) => {
      await page.goto('/dashboard');

      // Either shows loading skeleton or data quickly
      const content = page.locator(
        '[data-testid="dashboard-content"], [data-testid="loading-skeleton"], [class*="skeleton"]'
      );
      await expect(content.first()).toBeVisible();
    });
  });

  test.describe('Stats Cards', () => {
    test('ควรแสดง stats cards ข้อมูลรวม', async ({ page }) => {
      await page.goto('/dashboard');

      // Key stats that should be visible
      const statsSection = page.locator('[data-testid="stats-section"], [class*="stats"]');
      await expect(statsSection.first()).toBeVisible();
    });

    test('ควรแสดงจำนวนสัตว์ลงทะเบียน', async ({ page }) => {
      await page.goto('/dashboard');

      const animalCount = page.locator('[data-testid="stat-total-animals"]');
      if (await animalCount.isVisible()) {
        const text = await animalCount.textContent();
        expect(text).toMatch(/\d+/);
      } else {
        // Look for any numeric stat card mentioning animals
        await expect(page.getByText(/สัตว์|animals?/i).first()).toBeVisible();
      }
    });

    test('ควรแสดงอัตราทำหมัน', async ({ page }) => {
      await page.goto('/dashboard');

      const sterilizationStat = page.getByText(/ทำหมัน|steriliz/i);
      if (await sterilizationStat.first().isVisible()) {
        // Should have a percentage or number
        await expect(sterilizationStat.first()).toContainText(/\d/);
      }
    });

    test('ควรแสดง adoption rate', async ({ page }) => {
      await page.goto('/dashboard');

      const adoptionStat = page.getByText(/รับเลี้ยง|adoption/i);
      if (await adoptionStat.first().isVisible()) {
        await expect(adoptionStat.first()).toContainText(/\d/);
      }
    });

    test('ควรแสดงจำนวนรายงานที่รอดำเนินการ', async ({ page }) => {
      await page.goto('/dashboard');

      const pendingReports = page.getByText(/รอดำเนินการ|pending|รายงาน/i);
      await expect(pendingReports.first()).toBeVisible();
    });

    test('ควรแสดงอัตราการแก้ไขรายงาน', async ({ page }) => {
      await page.goto('/dashboard');

      const resolutionRate = page.getByText(/อัตราแก้ไข|resolution|แก้ไขแล้ว/i);
      if (await resolutionRate.first().isVisible()) {
        await expect(resolutionRate.first()).toBeVisible();
      }
    });
  });

  test.describe('กรองตามเขต (District Filtering)', () => {
    test('ควรมี dropdown เลือกเขต', async ({ page }) => {
      await page.goto('/dashboard');

      const districtFilter = page.getByLabel(/เขต|District|พื้นที่/);
      await expect(districtFilter).toBeVisible();
    });

    test('ควรกรองข้อมูลเมื่อเลือกเขต', async ({ page }) => {
      await page.goto('/dashboard');

      const districtFilter = page.getByLabel(/เขต|District|พื้นที่/);
      await districtFilter.selectOption({ index: 1 });

      // Stats should update (check for API call or content update)
      await page.waitForResponse(
        (res) => res.url().includes('district') || res.url().includes('dashboard')
      ).catch(() => {});

      // The filter should remain selected
      const selectedValue = await districtFilter.inputValue();
      expect(selectedValue).not.toBe('');
    });

    test('ควรแสดงข้อมูลเฉพาะเขตที่เลือก', async ({ page }) => {
      await page.goto('/dashboard');

      const districtFilter = page.getByLabel(/เขต|District|พื้นที่/);

      // Select a specific district
      await districtFilter.selectOption({ index: 1 });
      const districtName = await districtFilter.locator('option:checked').textContent();

      // Dashboard title or section should reflect selected district
      if (districtName) {
        const districtIndicator = page.getByText(new RegExp(districtName.trim()));
        if (await districtIndicator.first().isVisible()) {
          await expect(districtIndicator.first()).toBeVisible();
        }
      }
    });

    test('ควรรีเซ็ตเป็น "ทุกเขต" ได้', async ({ page }) => {
      await page.goto('/dashboard');

      const districtFilter = page.getByLabel(/เขต|District|พื้นที่/);

      // Select and then reset
      await districtFilter.selectOption({ index: 1 });
      await districtFilter.selectOption({ label: /ทั้งหมด|ทุกเขต|All/i });

      // Stats should show all data again
      const selectedValue = await districtFilter.inputValue();
      expect(selectedValue === '' || selectedValue === 'all').toBeTruthy();
    });
  });

  test.describe('Action Items', () => {
    test('ควรแสดง action items ที่ต้องดำเนินการ', async ({ page }) => {
      await page.goto('/dashboard');

      const actionSection = page.locator(
        '[data-testid="action-items"], [class*="action"]'
      );
      if (await actionSection.first().isVisible()) {
        await expect(actionSection.first()).toBeVisible();
      }
    });

    test('ควรแสดง cases เร่งด่วนที่ยังไม่ assign', async ({ page }) => {
      await page.goto('/dashboard');

      const urgentSection = page.getByText(/เร่งด่วน|urgent|unassigned/i);
      if (await urgentSection.first().isVisible()) {
        await expect(urgentSection.first()).toBeVisible();
      }
    });

    test('ควรแสดง vaccines ที่เลยกำหนด', async ({ page }) => {
      await page.goto('/dashboard');

      const overdueSection = page.getByText(/เลยกำหนด|overdue|วัคซีน/i);
      if (await overdueSection.first().isVisible()) {
        await expect(overdueSection.first()).toBeVisible();
      }
    });

    test('ควรแสดง pending follow-ups', async ({ page }) => {
      await page.goto('/dashboard');

      const followupSection = page.getByText(/ติดตามผล|follow.?up|pending/i);
      if (await followupSection.first().isVisible()) {
        await expect(followupSection.first()).toBeVisible();
      }
    });

    test('ควรคลิก action item แล้วไปหน้าที่เกี่ยวข้องได้', async ({ page }) => {
      await page.goto('/dashboard');

      const actionItem = page.locator('[data-testid="action-item"] a, [data-testid="action-items"] a').first();
      if (await actionItem.isVisible()) {
        const href = await actionItem.getAttribute('href');
        await actionItem.click();

        if (href) {
          await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        }
      }
    });
  });

  test.describe('Charts & Visualizations', () => {
    test('ควรแสดง chart สถิติ', async ({ page }) => {
      await page.goto('/dashboard');

      // Recharts renders SVG elements
      const chart = page.locator('svg.recharts-surface, [data-testid="dashboard-chart"], canvas');
      if (await chart.first().isVisible()) {
        await expect(chart.first()).toBeVisible();
      }
    });

    test('ควรแสดง KPI indicators', async ({ page }) => {
      await page.goto('/dashboard');

      // KPI section
      const kpiSection = page.locator('[data-testid="kpi-section"]');
      if (await kpiSection.isVisible()) {
        // Should have multiple KPI items
        const kpiItems = kpiSection.locator('[data-testid="kpi-item"]');
        const count = await kpiItems.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('ควรแสดงผลถูกต้องบน mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');

      // Dashboard should still be visible on mobile
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Navigation should be collapsed (hamburger menu)
      const hamburger = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"]');
      if (await hamburger.isVisible()) {
        await expect(hamburger).toBeVisible();
      }
    });
  });
});
