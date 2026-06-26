'use client';

import { useState } from 'react';
import type { CreateTaskPayload, TaskPriority } from './types';
import { PRIORITY_LABELS } from './types';

interface TaskFormProps {
  onSubmit: (payload: CreateTaskPayload) => Promise<boolean>;
}

export function TaskForm({ onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedTo.trim() || !deadline) return;

    setSubmitting(true);
    setSuccessMessage('');

    const payload: CreateTaskPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      assignedTo: assignedTo.trim(),
      deadline: new Date(deadline).toISOString(),
      priority,
    };

    const success = await onSubmit(payload);
    if (success) {
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setDeadline('');
      setPriority('MEDIUM');
      setSuccessMessage('สร้างงานสำเร็จ');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
    setSubmitting(false);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-800">➕ สร้างงานใหม่</h3>

      {successMessage && (
        <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2">
          <p className="text-xs text-green-700">✅ {successMessage}</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="task-title" className="block text-xs font-medium text-gray-700 mb-1">
          ชื่องาน <span className="text-red-500">*</span>
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="เช่น จับสุนัขจรจัดเขตบางกะปิ"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="task-description" className="block text-xs font-medium text-gray-700 mb-1">
          รายละเอียด
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="รายละเอียดเพิ่มเติม..."
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
        />
      </div>

      {/* Assigned To */}
      <div>
        <label htmlFor="task-assigned" className="block text-xs font-medium text-gray-700 mb-1">
          มอบหมายให้ <span className="text-red-500">*</span>
        </label>
        <input
          id="task-assigned"
          type="text"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          placeholder="ชื่อผู้รับผิดชอบ หรือ ID"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          required
        />
      </div>

      {/* Deadline */}
      <div>
        <label htmlFor="task-deadline" className="block text-xs font-medium text-gray-700 mb-1">
          กำหนดส่ง <span className="text-red-500">*</span>
        </label>
        <input
          id="task-deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          min={today}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          required
        />
      </div>

      {/* Priority */}
      <div>
        <label htmlFor="task-priority" className="block text-xs font-medium text-gray-700 mb-1">
          ระดับความสำคัญ
        </label>
        <select
          id="task-priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          {(Object.entries(PRIORITY_LABELS) as [TaskPriority, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || !title.trim() || !assignedTo.trim() || !deadline}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {submitting ? 'กำลังสร้าง...' : 'สร้างงาน'}
      </button>
    </form>
  );
}
