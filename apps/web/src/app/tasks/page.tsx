import { TaskManagementView } from '../../features/dashboard/tasks';

export const metadata = {
  title: 'จัดการงาน | ระบบจัดการสัตว์จรจัด',
  description: 'สร้าง มอบหมาย และติดตามงานของเจ้าหน้าที่',
};

export default function TasksPage() {
  return <TaskManagementView />;
}
