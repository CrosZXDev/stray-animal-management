import { MonthlyReportView } from '../../../features/dashboard/monthly-report';

export const metadata = {
  title: 'รายงานประจำเดือน | ระบบจัดการสัตว์จรจัด',
  description: 'สรุป KPI และผลดำเนินงานประจำเดือน พร้อมดาวน์โหลด PDF',
};

export default function MonthlyReportPage() {
  return <MonthlyReportView />;
}
