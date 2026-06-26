import { DashboardView } from '../../features/dashboard';

export const metadata = {
  title: 'แดชบอร์ด | ระบบจัดการสัตว์จรจัด',
  description: 'ภาพรวมข้อมูลสัตว์จรจัด สถิติ และรายการที่ต้องดำเนินการ',
};

export default function DashboardPage() {
  return <DashboardView />;
}
