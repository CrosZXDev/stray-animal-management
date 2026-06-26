import { describe, it, expect } from 'vitest';
import {
  NotificationTemplatesService,
  renderTemplate,
  interpolate,
  TEMPLATES,
  TemplateVariables,
} from '../notification-templates.service';

describe('NotificationTemplatesService', () => {
  const service = new NotificationTemplatesService();

  // ─── interpolate utility ─────────────────────────────────────────────────

  describe('interpolate', () => {
    it('should replace a single variable', () => {
      const result = interpolate('Hello {{name}}', { name: 'World' });
      expect(result).toBe('Hello World');
    });

    it('should replace multiple variables', () => {
      const result = interpolate('{{a}} and {{b}}', { a: 'X', b: 'Y' });
      expect(result).toBe('X and Y');
    });

    it('should handle numeric values', () => {
      const result = interpolate('Count: {{count}}', { count: 42 });
      expect(result).toBe('Count: 42');
    });

    it('should leave unmatched placeholders unchanged (graceful missing variables)', () => {
      const result = interpolate('{{found}} and {{missing}}', { found: 'yes' });
      expect(result).toBe('yes and {{missing}}');
    });

    it('should handle empty variables object gracefully', () => {
      const result = interpolate('No {{vars}} here', {});
      expect(result).toBe('No {{vars}} here');
    });

    it('should handle string with no placeholders', () => {
      const result = interpolate('Plain text', { unused: 'value' });
      expect(result).toBe('Plain text');
    });

    it('should handle empty string', () => {
      const result = interpolate('', { key: 'val' });
      expect(result).toBe('');
    });

    it('should replace repeated occurrences of the same variable', () => {
      const result = interpolate('{{x}} then {{x}}', { x: 'hi' });
      expect(result).toBe('hi then hi');
    });
  });

  // ─── Text message templates ──────────────────────────────────────────────

  describe('renderTemplate — text messages', () => {
    it('should render report_submitted with trackingId and description', () => {
      const msg = renderTemplate('report_submitted', {
        trackingId: 'RPT-001',
        description: 'สุนัขจรจัดก้าวร้าว',
      });

      expect(msg.type).toBe('text');
      if (msg.type === 'text') {
        expect(msg.text).toContain('✅');
        expect(msg.text).toContain('รับแจ้งเรียบร้อย');
        expect(msg.text).toContain('RPT-001');
        expect(msg.text).toContain('สุนัขจรจัดก้าวร้าว');
      }
    });

    it('should render report_assigned with trackingId and assignedTeam', () => {
      const msg = renderTemplate('report_assigned', {
        trackingId: 'RPT-002',
        assignedTeam: 'ทีมสัตวแพทย์เขตบางกะปิ',
      });

      expect(msg.type).toBe('text');
      if (msg.type === 'text') {
        expect(msg.text).toContain('RPT-002');
        expect(msg.text).toContain('ทีมสัตวแพทย์เขตบางกะปิ');
        expect(msg.text).toContain('มอบหมาย');
      }
    });

    it('should render report_resolved with trackingId and resolution', () => {
      const msg = renderTemplate('report_resolved', {
        trackingId: 'RPT-003',
        resolution: 'จับสุนัขทำหมันและปล่อยคืนแล้ว',
      });

      expect(msg.type).toBe('text');
      if (msg.type === 'text') {
        expect(msg.text).toContain('🎉');
        expect(msg.text).toContain('RPT-003');
        expect(msg.text).toContain('จับสุนัขทำหมันและปล่อยคืนแล้ว');
        expect(msg.text).toContain('แก้ไขแล้ว');
      }
    });

    it('should render adoption_applied with animalName and applicationId', () => {
      const msg = renderTemplate('adoption_applied', {
        animalName: 'น้องหมาจร',
        applicationId: 'ADP-100',
      });

      expect(msg.type).toBe('text');
      if (msg.type === 'text') {
        expect(msg.text).toContain('📋');
        expect(msg.text).toContain('น้องหมาจร');
        expect(msg.text).toContain('ADP-100');
        expect(msg.text).toContain('รับเลี้ยง');
      }
    });

    it('should render adoption_rejected with animalName and reason', () => {
      const msg = renderTemplate('adoption_rejected', {
        animalName: 'น้องแมว',
        reason: 'ที่พักไม่เหมาะสม',
      });

      expect(msg.type).toBe('text');
      if (msg.type === 'text') {
        expect(msg.text).toContain('น้องแมว');
        expect(msg.text).toContain('ที่พักไม่เหมาะสม');
        expect(msg.text).toContain('ไม่ผ่าน');
      }
    });

    it('should render followup_reminder with animalName and scheduledDate', () => {
      const msg = renderTemplate('followup_reminder', {
        animalName: 'มิกกี้',
        scheduledDate: '2024-04-15',
      });

      expect(msg.type).toBe('text');
      if (msg.type === 'text') {
        expect(msg.text).toContain('📝');
        expect(msg.text).toContain('มิกกี้');
        expect(msg.text).toContain('2024-04-15');
        expect(msg.text).toContain('ติดตามผล');
      }
    });
  });

  // ─── Flex message templates ──────────────────────────────────────────────

  describe('renderTemplate — flex messages', () => {
    it('should render adoption_approved as flex message with animalName and meetingDate', () => {
      const msg = renderTemplate('adoption_approved', {
        animalName: 'น้องโกลเด้น',
        meetingDate: '20 เม.ย. 2567',
      });

      expect(msg.type).toBe('flex');
      if (msg.type === 'flex') {
        expect(msg.altText).toContain('น้องโกลเด้น');
        expect(msg.altText).toContain('อนุมัติ');
        expect(msg.contents.type).toBe('bubble');
      }
    });

    it('should render vaccine_reminder as flex message with all variables', () => {
      const msg = renderTemplate('vaccine_reminder', {
        animalName: 'ลูกหมี',
        animalId: 'ANM-042',
        vaccineType: 'พิษสุนัขบ้า',
        dueDate: '2024-03-20',
      });

      expect(msg.type).toBe('flex');
      if (msg.type === 'flex') {
        expect(msg.altText).toContain('ลูกหมี');
        expect(msg.altText).toContain('ANM-042');
        expect(msg.altText).toContain('วัคซีน');
        expect(msg.contents.type).toBe('bubble');
      }
    });

    it('should render volunteer_assignment as flex message with taskTitle, location, deadline', () => {
      const msg = renderTemplate('volunteer_assignment', {
        taskTitle: 'จับสุนัขทำหมัน',
        location: 'ซอยลาดพร้าว 15',
        deadline: '2024-04-01',
      });

      expect(msg.type).toBe('flex');
      if (msg.type === 'flex') {
        expect(msg.altText).toContain('จับสุนัขทำหมัน');
        expect(msg.altText).toContain('มอบหมายงานอาสา');
        expect(msg.contents.type).toBe('bubble');
      }
    });

    it('should render campaign_announcement as flex message with campaignName, district, date', () => {
      const msg = renderTemplate('campaign_announcement', {
        campaignName: 'TNR เขตบางกะปิ',
        district: 'บางกะปิ',
        date: '15 เม.ย. 2567',
      });

      expect(msg.type).toBe('flex');
      if (msg.type === 'flex') {
        expect(msg.altText).toContain('TNR เขตบางกะปิ');
        expect(msg.altText).toContain('บางกะปิ');
        expect(msg.contents.type).toBe('bubble');
      }
    });
  });

  // ─── Variable interpolation correctness ──────────────────────────────────

  describe('variable interpolation correctness', () => {
    it('should interpolate all provided variables into text templates', () => {
      const msg = service.reportSubmitted({
        trackingId: 'TRK-XYZ',
        description: 'แมวจรจัดป่วย',
      });

      if (msg.type === 'text') {
        expect(msg.text).not.toContain('{{trackingId}}');
        expect(msg.text).not.toContain('{{description}}');
        expect(msg.text).toContain('TRK-XYZ');
        expect(msg.text).toContain('แมวจรจัดป่วย');
      }
    });

    it('should interpolate variables in flex altText', () => {
      const msg = service.vaccineReminder({
        animalName: 'บัดดี้',
        animalId: 'ANM-099',
        vaccineType: '5-in-1',
        dueDate: '2024-06-01',
      });

      if (msg.type === 'flex') {
        expect(msg.altText).not.toContain('{{animalName}}');
        expect(msg.altText).not.toContain('{{animalId}}');
        expect(msg.altText).toContain('บัดดี้');
        expect(msg.altText).toContain('ANM-099');
      }
    });

    it('should handle special characters in variable values', () => {
      const msg = service.reportSubmitted({
        trackingId: 'RPT-001',
        description: 'สุนัข "บางแก้ว" & แมว (3 ตัว)',
      });

      if (msg.type === 'text') {
        expect(msg.text).toContain('สุนัข "บางแก้ว" & แมว (3 ตัว)');
      }
    });
  });

  // ─── Missing variables handled gracefully ────────────────────────────────

  describe('missing variables handling', () => {
    it('should leave placeholders intact when variables are missing in text templates', () => {
      const msg = renderTemplate('report_submitted', { trackingId: 'RPT-001' });

      if (msg.type === 'text') {
        expect(msg.text).toContain('RPT-001');
        expect(msg.text).toContain('{{description}}');
      }
    });

    it('should leave placeholders intact in flex altText when variables are missing', () => {
      const msg = renderTemplate('vaccine_reminder', { animalName: 'บัดดี้' });

      if (msg.type === 'flex') {
        expect(msg.altText).toContain('บัดดี้');
        expect(msg.altText).toContain('{{animalId}}');
      }
    });

    it('should not throw when called with empty variables', () => {
      expect(() => renderTemplate('report_submitted', {})).not.toThrow();
      expect(() => renderTemplate('adoption_approved', {})).not.toThrow();
    });
  });

  // ─── Error handling ──────────────────────────────────────────────────────

  describe('error handling', () => {
    it('should throw when template key does not exist', () => {
      expect(() => renderTemplate('nonexistent_key', {})).toThrow(
        'Notification template not found: nonexistent_key',
      );
    });

    it('should throw a descriptive error message', () => {
      expect(() => renderTemplate('invalid_template_xyz', {})).toThrow(
        /Notification template not found/,
      );
    });
  });

  // ─── Service convenience methods ─────────────────────────────────────────

  describe('service convenience methods', () => {
    it('reportSubmitted returns valid text message', () => {
      const msg = service.reportSubmitted({ trackingId: 'T-1', description: 'desc' });
      expect(msg.type).toBe('text');
    });

    it('reportAssigned returns valid text message', () => {
      const msg = service.reportAssigned({ trackingId: 'T-1', assignedTeam: 'ทีม A' });
      expect(msg.type).toBe('text');
    });

    it('reportResolved returns valid text message', () => {
      const msg = service.reportResolved({ trackingId: 'T-1', resolution: 'เรียบร้อย' });
      expect(msg.type).toBe('text');
    });

    it('adoptionApplied returns valid text message', () => {
      const msg = service.adoptionApplied({ animalName: 'น้องหมา', applicationId: 'A-1' });
      expect(msg.type).toBe('text');
    });

    it('adoptionApproved returns valid flex message', () => {
      const msg = service.adoptionApproved({ animalName: 'น้องหมา', meetingDate: '1 ม.ค.' });
      expect(msg.type).toBe('flex');
    });

    it('adoptionRejected returns valid text message', () => {
      const msg = service.adoptionRejected({ animalName: 'น้องแมว', reason: 'ไม่ผ่าน' });
      expect(msg.type).toBe('text');
    });

    it('vaccineReminder returns valid flex message', () => {
      const msg = service.vaccineReminder({
        animalName: 'X', animalId: 'ID-1', vaccineType: 'rabies', dueDate: '2024-01-01',
      });
      expect(msg.type).toBe('flex');
    });

    it('followupReminder returns valid text message', () => {
      const msg = service.followupReminder({ animalName: 'X', scheduledDate: '2024-01-01' });
      expect(msg.type).toBe('text');
    });

    it('volunteerAssignment returns valid flex message', () => {
      const msg = service.volunteerAssignment({ taskTitle: 'T', location: 'L', deadline: 'D' });
      expect(msg.type).toBe('flex');
    });

    it('campaignAnnouncement returns valid flex message', () => {
      const msg = service.campaignAnnouncement({ campaignName: 'C', district: 'D', date: '2024' });
      expect(msg.type).toBe('flex');
    });
  });

  // ─── Service utility methods ─────────────────────────────────────────────

  describe('service utility methods', () => {
    it('hasTemplate should return true for existing templates', () => {
      expect(service.hasTemplate('report_submitted')).toBe(true);
      expect(service.hasTemplate('adoption_approved')).toBe(true);
      expect(service.hasTemplate('volunteer_assignment')).toBe(true);
    });

    it('hasTemplate should return false for non-existing templates', () => {
      expect(service.hasTemplate('nonexistent')).toBe(false);
    });

    it('getTemplateKeys should return all required template keys', () => {
      const keys = service.getTemplateKeys();
      expect(keys).toContain('report_submitted');
      expect(keys).toContain('report_assigned');
      expect(keys).toContain('report_resolved');
      expect(keys).toContain('adoption_applied');
      expect(keys).toContain('adoption_approved');
      expect(keys).toContain('adoption_rejected');
      expect(keys).toContain('vaccine_reminder');
      expect(keys).toContain('followup_reminder');
      expect(keys).toContain('volunteer_assignment');
      expect(keys).toContain('campaign_announcement');
    });

    it('render method should produce the same result as renderTemplate', () => {
      const vars = { trackingId: 'TEST-1', description: 'test' };
      const fromService = service.render('report_submitted', vars);
      const fromFn = renderTemplate('report_submitted', vars);
      expect(fromService).toEqual(fromFn);
    });
  });

  // ─── All templates produce valid LineMessage ─────────────────────────────

  describe('all templates produce valid LineMessage objects', () => {
    const sampleVariables: Record<string, TemplateVariables> = {
      report_submitted: { trackingId: 'RPT-X', description: 'รายละเอียด' },
      report_assigned: { trackingId: 'RPT-X', assignedTeam: 'ทีม A' },
      report_resolved: { trackingId: 'RPT-X', resolution: 'แก้ไขแล้ว' },
      adoption_applied: { animalName: 'ทดสอบ', applicationId: 'ADP-X' },
      adoption_approved: { animalName: 'ทดสอบ', meetingDate: '2024-01-01' },
      adoption_rejected: { animalName: 'ทดสอบ', reason: 'เหตุผล' },
      vaccine_reminder: { animalName: 'ทดสอบ', animalId: 'ANM-X', vaccineType: 'ทดสอบ', dueDate: '2024-01-01' },
      followup_reminder: { animalName: 'ทดสอบ', scheduledDate: '2024-01-01' },
      volunteer_assignment: { taskTitle: 'ทดสอบ', location: 'ทดสอบ', deadline: '2024-01-01' },
      campaign_announcement: { campaignName: 'ทดสอบ', district: 'ทดสอบ', date: '2024-01-01' },
    };

    const templateKeys = Object.keys(TEMPLATES);

    templateKeys.forEach((key) => {
      it(`template "${key}" should produce a valid LineMessage`, () => {
        const vars = sampleVariables[key] || {};
        const msg = renderTemplate(key, vars);

        expect(msg).toBeDefined();
        expect(['text', 'flex']).toContain(msg.type);

        if (msg.type === 'text') {
          expect(typeof msg.text).toBe('string');
          expect(msg.text.length).toBeGreaterThan(0);
        }
        if (msg.type === 'flex') {
          expect(typeof msg.altText).toBe('string');
          expect(msg.altText.length).toBeGreaterThan(0);
          expect(msg.contents).toBeDefined();
          expect(msg.contents.type).toBe('bubble');
        }
      });
    });
  });
});
