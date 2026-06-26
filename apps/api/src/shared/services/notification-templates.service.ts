import { Injectable } from '@nestjs/common';
import { LineMessage, LineFlexContainer } from './line.service';

/**
 * Template variable map — key-value pairs for interpolation
 */
export type TemplateVariables = Record<string, string | number>;

/**
 * Template definition — either text or flex format
 */
export interface NotificationTemplate {
  key: string;
  type: 'text' | 'flex';
  /** For text: the message string with {{variable}} placeholders */
  textTemplate?: string;
  /** For flex: a function that builds the flex container from variables */
  flexBuilder?: (variables: TemplateVariables) => LineFlexContainer;
  /** Alt text template for flex messages (with {{variable}} placeholders) */
  altTextTemplate?: string;
}

/**
 * Interpolate variables into a template string.
 * Replaces all {{variableName}} occurrences with the corresponding value.
 * Missing variables are left as {{variableName}} placeholders.
 */
export function interpolate(template: string, variables: TemplateVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

// ─── Template Definitions ────────────────────────────────────────────────────

export const TEMPLATES: Record<string, NotificationTemplate> = {
  // ── Report Status Templates ──────────────────────────────────────────────

  report_submitted: {
    key: 'report_submitted',
    type: 'text',
    textTemplate:
      '✅ รับแจ้งเรียบร้อยค่ะ\n' +
      'หมายเลขติดตาม: {{trackingId}}\n' +
      'รายละเอียด: {{description}}\n\n' +
      'เราจะดำเนินการตรวจสอบและแจ้งความคืบหน้าให้ทราบค่ะ',
  },

  report_assigned: {
    key: 'report_assigned',
    type: 'text',
    textTemplate:
      '👤 เรื่องที่แจ้งหมายเลข {{trackingId}} ได้รับมอบหมายให้ทีมดูแลแล้วค่ะ\n' +
      'ทีมรับผิดชอบ: {{assignedTeam}}\n\n' +
      'จะแจ้งความคืบหน้าให้ทราบอีกครั้งค่ะ',
  },

  report_resolved: {
    key: 'report_resolved',
    type: 'text',
    textTemplate:
      '🎉 เรื่องที่แจ้งได้รับการแก้ไขแล้วค่ะ\n' +
      'หมายเลข: {{trackingId}}\n' +
      'ผลการดำเนินการ: {{resolution}}\n\n' +
      'ขอบคุณที่แจ้งเบาะแสค่ะ 🙏',
  },

  // ── Adoption Templates ───────────────────────────────────────────────────

  adoption_applied: {
    key: 'adoption_applied',
    type: 'text',
    textTemplate:
      '📋 ได้รับใบสมัครรับเลี้ยง {{animalName}} เรียบร้อยแล้วค่ะ\n' +
      'หมายเลขใบสมัคร: {{applicationId}}\n\n' +
      'กรุณารอการตรวจสอบภายใน 3-5 วันทำการค่ะ',
  },

  adoption_approved: {
    key: 'adoption_approved',
    type: 'flex',
    altTextTemplate: '🏠 ยินดีด้วยค่ะ! การสมัครรับเลี้ยง {{animalName}} ได้รับการอนุมัติแล้ว',
    flexBuilder: (variables) => ({
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🏠 อนุมัติการรับเลี้ยง',
            weight: 'bold',
            size: 'lg',
            color: '#1DB446',
          },
          {
            type: 'separator',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            contents: [
              {
                type: 'text',
                text: 'ยินดีด้วยค่ะ! 🎊',
                size: 'md',
                wrap: true,
              },
              {
                type: 'text',
                text: `การสมัครรับเลี้ยง "${interpolate('{{animalName}}', variables)}" ได้รับการอนุมัติแล้ว`,
                size: 'md',
                wrap: true,
                margin: 'md',
              },
              {
                type: 'text',
                text: `📅 นัดพบน้อง: ${interpolate('{{meetingDate}}', variables)}`,
                size: 'md',
                margin: 'md',
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'กรุณามาตามวันนัดหมายเพื่อรับน้องค่ะ',
            size: 'xs',
            color: '#AAAAAA',
            wrap: true,
          },
        ],
      },
    }),
  },

  adoption_rejected: {
    key: 'adoption_rejected',
    type: 'text',
    textTemplate:
      '📋 แจ้งผลการสมัครรับเลี้ยง {{animalName}}\n\n' +
      'ขออภัยค่ะ ใบสมัครไม่ผ่านการพิจารณาในครั้งนี้\n' +
      'เหตุผล: {{reason}}\n\n' +
      'สามารถสมัครใหม่ได้ในอนาคตค่ะ 🙏',
  },

  // ── Vaccine Reminder Templates ───────────────────────────────────────────

  vaccine_reminder: {
    key: 'vaccine_reminder',
    type: 'flex',
    altTextTemplate: '💉 แจ้งเตือน: {{animalName}} ({{animalId}}) ถึงกำหนดฉีดวัคซีน {{vaccineType}}',
    flexBuilder: (variables) => ({
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '💉 แจ้งเตือนวัคซีน',
            weight: 'bold',
            size: 'lg',
            color: '#E85D04',
          },
          {
            type: 'separator',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            contents: [
              {
                type: 'text',
                text: `สัตว์: ${interpolate('{{animalName}}', variables)}`,
                size: 'md',
              },
              {
                type: 'text',
                text: `รหัส: ${interpolate('{{animalId}}', variables)}`,
                size: 'sm',
                color: '#888888',
                margin: 'sm',
              },
              {
                type: 'text',
                text: `ชนิดวัคซีน: ${interpolate('{{vaccineType}}', variables)}`,
                size: 'md',
                margin: 'sm',
              },
              {
                type: 'text',
                text: `กำหนดฉีด: ${interpolate('{{dueDate}}', variables)}`,
                size: 'md',
                margin: 'sm',
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'กรุณาดำเนินการตามกำหนดค่ะ',
            size: 'xs',
            color: '#AAAAAA',
            wrap: true,
          },
        ],
      },
    }),
  },

  // ── Follow-up Reminder Templates ─────────────────────────────────────────

  followup_reminder: {
    key: 'followup_reminder',
    type: 'text',
    textTemplate:
      '📝 แจ้งเตือน: ถึงกำหนดติดตามผลหลังรับเลี้ยง\n' +
      'สัตว์: {{animalName}}\n' +
      'วันที่นัด: {{scheduledDate}}\n\n' +
      'กรุณาอัปเดตสถานะน้องในระบบค่ะ 🐾',
  },

  // ── Volunteer Assignment Templates ───────────────────────────────────────

  volunteer_assignment: {
    key: 'volunteer_assignment',
    type: 'flex',
    altTextTemplate: '🙋 มอบหมายงานอาสา: {{taskTitle}}',
    flexBuilder: (variables) => ({
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🙋 งานอาสาสมัคร',
            weight: 'bold',
            size: 'lg',
            color: '#5B21B6',
          },
          {
            type: 'separator',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            contents: [
              {
                type: 'text',
                text: `งาน: ${interpolate('{{taskTitle}}', variables)}`,
                size: 'md',
                wrap: true,
              },
              {
                type: 'text',
                text: `📍 สถานที่: ${interpolate('{{location}}', variables)}`,
                size: 'md',
                margin: 'sm',
                wrap: true,
              },
              {
                type: 'text',
                text: `⏰ กำหนดส่ง: ${interpolate('{{deadline}}', variables)}`,
                size: 'md',
                margin: 'sm',
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'กรุณายืนยันการรับงานในระบบค่ะ',
            size: 'xs',
            color: '#AAAAAA',
            wrap: true,
          },
        ],
      },
    }),
  },

  // ── Campaign Announcement Templates ──────────────────────────────────────

  campaign_announcement: {
    key: 'campaign_announcement',
    type: 'flex',
    altTextTemplate: '📢 ประกาศกิจกรรม: {{campaignName}} — {{district}}',
    flexBuilder: (variables) => ({
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📢 ประกาศกิจกรรม',
            weight: 'bold',
            size: 'lg',
            color: '#0891B2',
          },
          {
            type: 'separator',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            contents: [
              {
                type: 'text',
                text: interpolate('{{campaignName}}', variables),
                size: 'lg',
                weight: 'bold',
                wrap: true,
              },
              {
                type: 'text',
                text: `📍 เขต: ${interpolate('{{district}}', variables)}`,
                size: 'md',
                margin: 'md',
              },
              {
                type: 'text',
                text: `📅 วันที่: ${interpolate('{{date}}', variables)}`,
                size: 'md',
                margin: 'sm',
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'สนใจร่วมกิจกรรม สมัครได้ในระบบค่ะ',
            size: 'xs',
            color: '#AAAAAA',
            wrap: true,
          },
        ],
      },
    }),
  },
};

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class NotificationTemplatesService {
  /**
   * Render a notification template by key into a LineMessage.
   * @param templateKey - The template identifier (e.g., 'report_submitted')
   * @param variables - Key-value pairs for variable interpolation
   * @returns A LineMessage ready to be sent via LineService
   * @throws Error if template key is not found
   */
  render(templateKey: string, variables: TemplateVariables = {}): LineMessage {
    return renderTemplate(templateKey, variables);
  }

  // ── Convenience methods per template ────────────────────────────────────

  reportSubmitted(variables: { trackingId: string; description: string }): LineMessage {
    return renderTemplate('report_submitted', variables);
  }

  reportAssigned(variables: { trackingId: string; assignedTeam: string }): LineMessage {
    return renderTemplate('report_assigned', variables);
  }

  reportResolved(variables: { trackingId: string; resolution: string }): LineMessage {
    return renderTemplate('report_resolved', variables);
  }

  adoptionApplied(variables: { animalName: string; applicationId: string }): LineMessage {
    return renderTemplate('adoption_applied', variables);
  }

  adoptionApproved(variables: { animalName: string; meetingDate: string }): LineMessage {
    return renderTemplate('adoption_approved', variables);
  }

  adoptionRejected(variables: { animalName: string; reason: string }): LineMessage {
    return renderTemplate('adoption_rejected', variables);
  }

  vaccineReminder(variables: { animalName: string; animalId: string; vaccineType: string; dueDate: string }): LineMessage {
    return renderTemplate('vaccine_reminder', variables);
  }

  followupReminder(variables: { animalName: string; scheduledDate: string }): LineMessage {
    return renderTemplate('followup_reminder', variables);
  }

  volunteerAssignment(variables: { taskTitle: string; location: string; deadline: string }): LineMessage {
    return renderTemplate('volunteer_assignment', variables);
  }

  campaignAnnouncement(variables: { campaignName: string; district: string; date: string }): LineMessage {
    return renderTemplate('campaign_announcement', variables);
  }

  /**
   * Check if a template key exists
   */
  hasTemplate(templateKey: string): boolean {
    return templateKey in TEMPLATES;
  }

  /**
   * Get all available template keys
   */
  getTemplateKeys(): string[] {
    return Object.keys(TEMPLATES);
  }
}

/**
 * Pure function to render a template into a LineMessage.
 * Can be used without DI for testing or utility purposes.
 */
export function renderTemplate(templateKey: string, variables: TemplateVariables = {}): LineMessage {
  const template = TEMPLATES[templateKey];

  if (!template) {
    throw new Error(`Notification template not found: ${templateKey}`);
  }

  if (template.type === 'text') {
    if (!template.textTemplate) {
      throw new Error(`Text template missing for key: ${templateKey}`);
    }
    return {
      type: 'text',
      text: interpolate(template.textTemplate, variables),
    };
  }

  // Flex message
  if (!template.flexBuilder || !template.altTextTemplate) {
    throw new Error(`Flex template incomplete for key: ${templateKey}`);
  }

  return {
    type: 'flex',
    altText: interpolate(template.altTextTemplate, variables),
    contents: template.flexBuilder(variables),
  };
}
