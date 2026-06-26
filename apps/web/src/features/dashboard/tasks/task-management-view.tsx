'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTasks } from './use-tasks';
import { TaskForm } from './task-form';
import { TaskList } from './task-list';
import { TaskStatusFilter } from './task-status-filter';
import type { TaskStatus } from './types';

export function TaskManagementView() {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [showForm, setShowForm] = useState(true);

  const { tasks, loading, error, createTask, updateTaskStatus, refetch } = useTasks(
    statusFilter || undefined
  );

  const handleAccept = useCallback(
    (taskId: string) => {
      updateTaskStatus(taskId, { status: 'IN_PROGRESS' });
    },
    [updateTaskStatus]
  );

  const handleComplete = useCallback(
    (taskId: string) => {
      updateTaskStatus(taskId, { status: 'COMPLETED' });
    },
    [updateTaskStatus]
  );

  // Count tasks per status (from unfiltered perspective, show all counts)
  const taskCounts = useMemo(() => {
    const counts: Record<TaskStatus, number> = {
      PENDING: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      OVERDUE: 0,
    };
    tasks.forEach((task) => {
      counts[task.status]++;
    });
    return counts;
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📝 จัดการงาน</h1>
          <p className="mt-1 text-sm text-gray-500">
            สร้าง มอบหมาย และติดตามงานของทีม
          </p>
        </div>
        <button
          onClick={refetch}
          className="self-start rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
          title="รีเฟรช"
        >
          🔄 รีเฟรช
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">❌ {error}</p>
          <button
            onClick={refetch}
            className="mt-2 rounded-md bg-red-100 px-3 py-1.5 text-xs text-red-700 hover:bg-red-200 transition"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {/* Mobile tab toggle */}
      <div className="flex border-b border-gray-200 lg:hidden">
        <button
          onClick={() => setShowForm(true)}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition ${
            showForm
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500'
          }`}
        >
          สร้างงาน
        </button>
        <button
          onClick={() => setShowForm(false)}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition ${
            !showForm
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500'
          }`}
        >
          รายการงาน ({tasks.length})
        </button>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form sidebar */}
        <div className={`lg:col-span-1 ${showForm ? 'block' : 'hidden'} lg:block`}>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <TaskForm onSubmit={createTask} />
          </div>
        </div>

        {/* Task list */}
        <div className={`lg:col-span-2 ${!showForm ? 'block' : 'hidden'} lg:block`}>
          <div className="space-y-4">
            {/* Status filter */}
            <TaskStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              taskCounts={!statusFilter ? taskCounts : undefined}
            />

            {/* Task list */}
            <TaskList
              tasks={tasks}
              loading={loading}
              onAccept={handleAccept}
              onComplete={handleComplete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
