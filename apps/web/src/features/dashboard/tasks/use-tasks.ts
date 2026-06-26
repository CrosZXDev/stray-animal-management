'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import type { Task, TaskStatus, CreateTaskPayload, UpdateTaskPayload } from './types';

interface UseTasksResult {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (payload: CreateTaskPayload) => Promise<boolean>;
  updateTaskStatus: (taskId: string, payload: UpdateTaskPayload) => Promise<boolean>;
  refetch: () => void;
}

export function useTasks(statusFilter?: TaskStatus): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get<Task[]>(`/tasks${params}`);
      if (res.success && res.data) {
        setTasks(res.data);
      } else {
        setError(res.error?.message || 'ไม่สามารถโหลดรายการงานได้');
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อ server ได้');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(async (payload: CreateTaskPayload): Promise<boolean> => {
    try {
      const res = await api.post<Task>('/tasks', payload);
      if (res.success) {
        await fetchTasks();
        return true;
      }
      setError(res.error?.message || 'ไม่สามารถสร้างงานได้');
      return false;
    } catch {
      setError('ไม่สามารถเชื่อมต่อ server ได้');
      return false;
    }
  }, [fetchTasks]);

  const updateTaskStatus = useCallback(async (taskId: string, payload: UpdateTaskPayload): Promise<boolean> => {
    try {
      const res = await api.patch<Task>(`/tasks/${taskId}`, payload);
      if (res.success) {
        await fetchTasks();
        return true;
      }
      setError(res.error?.message || 'ไม่สามารถอัปเดตสถานะได้');
      return false;
    } catch {
      setError('ไม่สามารถเชื่อมต่อ server ได้');
      return false;
    }
  }, [fetchTasks]);

  return { tasks, loading, error, createTask, updateTaskStatus, refetch: fetchTasks };
}
