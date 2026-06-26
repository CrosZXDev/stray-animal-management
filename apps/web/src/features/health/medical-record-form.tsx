'use client';

import { useState } from 'react';
import { api } from '../../lib/api';

const medicalTypes = [
  { value: 'VACCINATION', label: 'ฉีดวัคซีน', emoji: '💉' },
  { value: 'STERILIZATION', label: 'ทำหมัน', emoji: '✂️' },
  { value: 'TREATMENT', label: 'รักษา', emoji: '🩺' },
  { value: 'CHECKUP', label: 'ตรวจสุขภาพ', emoji: '🔍' },
  { value: 'EMERGENCY', label: 'ฉุกเฉิน', emoji: '🚨' },
];

export function MedicalRecordForm({ animalId }: { animalId: string }) {
  const [form, setForm] = useState({
    type: 'VACCINATION',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    medications: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<any>(`/animals/${animalId}/medical-records`, {
        ...form,
        date: new Date(form.date).toISOString(),
      });
      if (res.success) {
        setSuccess(true);
        setForm({ type: 'VACCINATION', date: new Date().toISOString().slice(0, 10), description: '', medications: '', notes: '' });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(res.error?.message || 'เกิดข้อผิดพลาด');
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อ server ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 border border-green-200">✅ บันทึกสำเร็จ</div>}
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">❌ {error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทการรักษา</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm">
            {medicalTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด *</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2} required placeholder="อธิบายการรักษา/ดำเนินการ..."
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ยาที่ใช้</label>
        <input type="text" value={form.medications} onChange={(e) => setForm({ ...form, medications: e.target.value })}
          placeholder="เช่น Ivermectin, Rabies vaccine"
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm" />
      </div>

      <button type="submit" disabled={loading || !form.description}
        className="w-full rounded-md bg-orange-600 px-4 py-2 text-white text-sm font-medium hover:bg-orange-700 disabled:bg-gray-300 transition">
        {loading ? 'กำลังบันทึก...' : '💾 บันทึก Medical Record'}
      </button>
    </form>
  );
}
