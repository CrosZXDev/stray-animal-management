'use client';

import type { ActionItems as ActionItemsType } from './types';

interface ActionItemsProps {
  actionItems: ActionItemsType;
}

const reportTypeLabels: Record<string, string> = {
  NEW_SIGHTING: 'พบตัวใหม่',
  INJURED: 'บาดเจ็บ/ป่วย',
  AGGRESSIVE: 'ก้าวร้าว',
  GROWING_PACK: 'ฝูงเพิ่มจำนวน',
  ABUSE: 'ถูกทารุณกรรม',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
}

function daysOverdue(dateStr: string): number {
  const now = new Date();
  const due = new Date(dateStr);
  return Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
}

export function ActionItems({ actionItems }: ActionItemsProps) {
  const { unassignedUrgentCases, overdueVaccines, pendingFollowups } = actionItems;

  const totalItems =
    unassignedUrgentCases.length + overdueVaccines.length + pendingFollowups.length;

  if (totalItems === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-2xl">🎉</p>
        <p className="mt-2 text-sm font-medium text-green-700">
          ไม่มีรายการที่ต้องดำเนินการ
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Urgent Cases */}
      {unassignedUrgentCases.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <span>🚨</span>
            เคสเร่งด่วนที่ยังไม่มอบหมาย ({unassignedUrgentCases.length})
          </h3>
          <ul className="mt-3 space-y-2">
            {unassignedUrgentCases.slice(0, 5).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-500">
                    {item.trackingId}
                  </span>
                  <span className="text-gray-700">
                    {reportTypeLabels[item.type] || item.type}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(item.createdAt)}
                </span>
              </li>
            ))}
            {unassignedUrgentCases.length > 5 && (
              <li className="text-center text-xs text-red-600">
                +{unassignedUrgentCases.length - 5} รายการเพิ่มเติม
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Overdue Vaccines */}
      {overdueVaccines.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <span>💉</span>
            วัคซีนเลยกำหนด ({overdueVaccines.length})
          </h3>
          <ul className="mt-3 space-y-2">
            {overdueVaccines.slice(0, 5).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <span className="text-xs text-red-600 font-medium">
                  เลย {daysOverdue(item.dueDate)} วัน
                </span>
              </li>
            ))}
            {overdueVaccines.length > 5 && (
              <li className="text-center text-xs text-amber-600">
                +{overdueVaccines.length - 5} รายการเพิ่มเติม
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Pending Follow-ups */}
      {pendingFollowups.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-700">
            <span>📋</span>
            ติดตามหลัง Adoption ({pendingFollowups.length})
          </h3>
          <ul className="mt-3 space-y-2">
            {pendingFollowups.slice(0, 5).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-500">
                    {item.adoptionId.slice(0, 8)}
                  </span>
                </div>
                <span className="text-xs text-blue-600">
                  กำหนด {formatDate(item.scheduledDate)}
                </span>
              </li>
            ))}
            {pendingFollowups.length > 5 && (
              <li className="text-center text-xs text-blue-600">
                +{pendingFollowups.length - 5} รายการเพิ่มเติม
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
