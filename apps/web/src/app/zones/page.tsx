import { ZoneManagement } from '../../features/map/zone-management';

export const metadata = {
  title: 'จัดการโซน | ระบบจัดการสัตว์จรจัด',
  description: 'จัดการโซนรับผิดชอบ วาดขอบเขตพื้นที่ มอบหมายทีม',
};

export default function ZonesPage() {
  return (
    <div className="-mx-4 -mt-6 sm:-mx-6 lg:-mx-8">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8 border-b bg-white">
        <div>
          <h1 className="text-lg font-bold text-gray-900">📍 จัดการโซน</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            วาดขอบเขตโซนบนแผนที่ มอบหมายทีมรับผิดชอบ
          </p>
        </div>
      </div>
      <div className="h-[calc(100vh-8rem)]">
        <ZoneManagement />
      </div>
    </div>
  );
}
