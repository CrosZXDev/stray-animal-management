'use client';

import type { Task, TaskStatus } from './types';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  PRIORITY_COLORS,
  STATUS_COLORS,
} from './types';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  onAccept: (taskId: string) => void;
  onComplete: (taskId: string) => void;
}

function isOverdue(deadline: string, status: TaskStatus): boolean {
  if (status === 'COMPLETED') return false;
  return new Date(deadline) < new Date();
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function daysUntilDeadline(deadline: string): number {
  const diff = new Date(deadline).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function TaskList({ tasks, loading, onAccept, onComplete }: TaskListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="mt-2 text-xs text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-3xl mb-2">📋</p>
        <p className="text-sm text-gray-500">ไม่มีรายการงาน</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const overdue = isOverdue(task.deadline, task.status);
        const daysLeft = daysUntilDeadline(task.deadline);

        return (
          <div
            key={task.id}
            className={`rounded-lg border p-4 transition ${
              overdue
                ? 'border-red-300 bg-red-50 ring-1 ring-red-200'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-medium text-gray-900 flex-1">
                {overdue && <span className="text-red-500 mr-1">⚠️</span>}
                {task.title}
              </h4>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                {PRIORITY_LABELS[task.priority]}
              </span>
            </div>

            {/* Description */}
            {task.description && (
              <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Meta info */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span>👤 {task.assignedTo}</span>
              <span className="text-gray-300">|</span>
              <span className={overdue ? 'text-red-600 font-medium' : ''}>
                📅 {formatDate(task.deadline)}
                {overdue
                  ? ` (เกิน ${Math.abs(daysLeft)} วัน)`
                  : daysLeft <= 3 && task.status !== 'COMPLETED'
                    ? ` (อีก ${daysLeft} วัน)`
                    : ''
                }
              </span>
            </div>

            {/* Status + Actions */}
            <div className="mt-3 flex items-center justify-between">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[task.status]}`}>
                {STATUS_LABELS[task.status]}
              </span>

              <div className="flex gap-2">
                {task.status === 'PENDING' && (
                  <button
                    onClick={() => onAccept(task.id)}
                    className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
                  >
                    รับงาน
                  </button>
                )}
                {(task.status === 'IN_PROGRESS' || task.status === 'OVERDUE') && (
                  <button
                    onClick={() => onComplete(task.id)}
                    className="rounded-md bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition"
                  >
                    เสร็จสิ้น
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
