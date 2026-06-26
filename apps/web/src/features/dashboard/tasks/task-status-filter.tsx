'use client';

import type { TaskStatus } from './types';
import { STATUS_LABELS } from './types';

interface TaskStatusFilterProps {
  value: TaskStatus | '';
  onChange: (status: TaskStatus | '') => void;
  taskCounts?: Record<TaskStatus, number>;
}

const FILTER_OPTIONS: { value: TaskStatus | ''; label: string; icon: string }[] = [
  { value: '', label: 'ทั้งหมด', icon: '📋' },
  { value: 'PENDING', label: STATUS_LABELS.PENDING, icon: '⏳' },
  { value: 'IN_PROGRESS', label: STATUS_LABELS.IN_PROGRESS, icon: '🔄' },
  { value: 'OVERDUE', label: STATUS_LABELS.OVERDUE, icon: '⚠️' },
  { value: 'COMPLETED', label: STATUS_LABELS.COMPLETED, icon: '✅' },
];

export function TaskStatusFilter({ value, onChange, taskCounts }: TaskStatusFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((option) => {
        const isActive = value === option.value;
        const count = option.value && taskCounts ? taskCounts[option.value] : undefined;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
            {count !== undefined && (
              <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-xs ${
                isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
