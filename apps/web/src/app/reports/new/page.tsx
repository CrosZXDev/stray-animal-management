import { ReportForm } from '../../../features/reports/report-form';

export default function NewReportPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">📢 แจ้งเบาะแสสัตว์จรจัด</h1>
      <p className="text-gray-600 mb-6">แจ้งพบสัตว์จรจัดหรือปัญหา ภายใน 3 ขั้นตอน — ไม่ต้องเข้าสู่ระบบก็แจ้งได้</p>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <ReportForm />
      </div>
    </div>
  );
}
