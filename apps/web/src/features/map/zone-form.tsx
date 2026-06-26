'use client';

import { useState } from 'react';
import type { CreateZonePayload } from './types';

// Bangkok districts
const DISTRICTS = [
  'บางกะปิ', 'บางขุนเทียน', 'บางคอแหลม', 'บางแค', 'บางซื่อ',
  'บางนา', 'บางพลัด', 'บางรัก', 'บึงกุ่ม', 'จตุจักร',
  'จอมทอง', 'ดินแดง', 'ดอนเมือง', 'ดุสิต', 'ห้วยขวาง',
  'หนองจอก', 'หนองแขม', 'หลักสี่', 'คลองเตย', 'คลองสาน',
  'คลองสามวา', 'คันนายาว', 'ลาดกระบัง', 'ลาดพร้าว', 'มีนบุรี',
  'หนองจอก', 'ปทุมวัน', 'พญาไท', 'พระโขนง', 'พระนคร',
  'ป้อมปราบฯ', 'ประเวศ', 'ราชเทวี', 'ราษฎร์บูรณะ', 'สาทร',
  'สวนหลวง', 'สะพานสูง', 'สายไหม', 'ตลิ่งชัน', 'ทวีวัฒนา',
  'ธนบุรี', 'ทุ่งครุ', 'วังทองหลาง', 'วัฒนา', 'ยานนาวา',
].sort();

interface ZoneFormProps {
  drawnPolygon: string;
  onSubmit: (payload: CreateZonePayload) => Promise<boolean>;
  onClearPolygon: () => void;
}

export function ZoneForm({ drawnPolygon, onSubmit, onClearPolygon }: ZoneFormProps) {
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [assignedTeam, setAssignedTeam] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const isFormValid = name.trim() && district && assignedTeam.trim() && drawnPolygon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setSubmitting(true);
    setSuccessMessage('');

    const success = await onSubmit({
      name: name.trim(),
      district,
      boundary: drawnPolygon,
      assignedTeam: assignedTeam.trim(),
    });

    setSubmitting(false);

    if (success) {
      setSuccessMessage('สร้างโซนสำเร็จ');
      setName('');
      setDistrict('');
      setAssignedTeam('');
      onClearPolygon();
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">สร้างโซนใหม่</h3>

      {/* Polygon status */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${drawnPolygon ? 'bg-green-500' : 'bg-gray-300'}`}
        />
        <span className="text-xs text-gray-600">
          {drawnPolygon ? '✅ วาดขอบเขตโซนแล้ว' : '⏳ กรุณาวาดขอบเขตบนแผนที่'}
        </span>
      </div>

      {/* Zone name */}
      <div>
        <label htmlFor="zone-name" className="block text-xs font-medium text-gray-700 mb-1">
          ชื่อโซน
        </label>
        <input
          id="zone-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="เช่น โซน TNR บางกะปิ เหนือ"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* District */}
      <div>
        <label htmlFor="zone-district" className="block text-xs font-medium text-gray-700 mb-1">
          เขต
        </label>
        <select
          id="zone-district"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="">เลือกเขต</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Assigned team */}
      <div>
        <label htmlFor="zone-team" className="block text-xs font-medium text-gray-700 mb-1">
          ทีมรับผิดชอบ
        </label>
        <input
          id="zone-team"
          type="text"
          value={assignedTeam}
          onChange={(e) => setAssignedTeam(e.target.value)}
          placeholder="เช่น ทีม TNR เขตบางกะปิ"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2">
          <p className="text-xs text-green-700">✅ {successMessage}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!isFormValid || submitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? 'กำลังสร้าง...' : 'สร้างโซน'}
      </button>
    </form>
  );
}
