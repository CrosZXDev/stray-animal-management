export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  deadline: string; // ISO date
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assignedTo: string;
  deadline: string;
  priority: TaskPriority;
}

export interface UpdateTaskPayload {
  status?: TaskStatus;
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'ต่ำ',
  MEDIUM: 'ปานกลาง',
  HIGH: 'สูง',
  CRITICAL: 'วิกฤต',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'รอดำเนินการ',
  IN_PROGRESS: 'กำลังดำเนินการ',
  COMPLETED: 'เสร็จสิ้น',
  OVERDUE: 'เกินกำหนด',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
};
