'use client';

import { useState } from 'react';
import { api } from '../../lib/api';

const reportTypes = [
  { value: 'NEW_SIGHTING', label: 'พบตัวใหม่', emoji: '👀' },
  { value: 'INJURED', label: 'บาดเจ็บ/ป่วย', emoji: '🩹' },
  { value: 'AGGRESSIVE', label: 'ก้าวร้าว', emoji: '⚠️' },
  { value: 'GROWING_PACK', label: 'ฝูงเพิ่มจำนวน', emoji: '📈' },
  { value: 'ABUSE', label: 'ถูกทารุณกรรม', emoji: '🚨' },
];

export function ReportForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    type: '',
    description: '',
    latitude: 0,
    longitude: 0,
    district: '',
    urgent: false,
    photoUrls: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude })),
        () => setError('ไม่สามารถเข้าถึงตำแหน่งได้ กรุณาเปิด GPS'),
      );
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<any>('/reports', form);
      if (res.success) {
        setTrackingId(res.data.trackingId);
        setStep(4); // success
      } else {
        setError(res.error?.message || 'เกิดข้อผิดพลาด');
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อ server ได้');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Success
  if (step === 4 && trackingId) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">ส่งรายงานสำเร็จ!</h2>
        <p className="text-gray-600 mb-4">เลข tracking สำหรับติดตามผล:</p>
        <div className="inline-block bg-orange-50 border border-orange-200 rounded-lg px-6 py-3 font-mono text-lg text-orange-700">
          {trackingId}
        </div>
        <div className="mt-6 space-x-3">
          <a href={`/reports/track?id=${trackingId}`} className="text-sm text-orange-600 hover:underline">
            ติดตามสถานะ →
          </a>
          <button onClick={() => { setStep(1); setTrackingId(null); setForm({ type: '', description: '', latitude: 0, longitude: 0, district: '', urgent: false, photoUrls: [] }); }}
            className="text-sm text-gray-500 hover:underline">
            แจ้งเรื่องใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${step >= s ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {s}
            </div>
            {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-orange-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200 mb-4">
          ❌ {error}
        </div>
      )}

      {/* Step 1: Select type */}
      {step === 1 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-3">ขั้นตอนที่ 1: เลือกประเภทปัญหา</h3>
          <div className="grid grid-cols-1 gap-2">
            {reportTypes.map((t) => (
              <button key={t.value}
                onClick={() => { setForm({ ...form, type: t.value }); setStep(2); }}
                className="flex items-center gap-3 rounded-lg border p-3 text-left hover:border-orange-400 hover:bg-orange-50 transition">
                <span className="text-2xl">{t.emoji}</span>
                <span className="font-medium text-gray-900">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Details + location */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">ขั้นตอนที่ 2: รายละเอียดและพิกัด</h3>
          <div>
            <label className="block text-sm text-gray-700 mb-1">อธิบายสิ่งที่พบ *</label>
            <textarea value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} placeholder="อธิบายรายละเอียด..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">เขต *</label>
            <input type="text" value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              placeholder="เช่น วัฒนา, จตุจักร"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={detectLocation}
              className="rounded-md bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200">📍 ปักหมุดตำแหน่ง</button>
            <button type="button" className="rounded-md bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200">📷 แนบรูป</button>
            {form.latitude !== 0 && <span className="text-xs text-green-600 self-center">✓ ได้พิกัดแล้ว</span>}
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.urgent}
              onChange={(e) => setForm({ ...form, urgent: e.target.checked })}
              className="rounded border-gray-300 text-orange-600" />
            <span className="text-sm text-red-600 font-medium">เร่งด่วน (บาดเจ็บรุนแรง/อันตราย)</span>
          </label>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="px-4 py-2 rounded-md border text-sm">← ย้อนกลับ</button>
            <button onClick={() => setStep(3)} disabled={!form.description || !form.district}
              className="flex-1 px-4 py-2 rounded-md bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:bg-gray-300 transition">
              ถัดไป →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">ขั้นตอนที่ 3: ยืนยันส่งรายงาน</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div><span className="text-gray-500">ประเภท:</span> {reportTypes.find(t => t.value === form.type)?.label}</div>
            <div><span className="text-gray-500">รายละเอียด:</span> {form.description}</div>
            <div><span className="text-gray-500">เขต:</span> {form.district}</div>
            {form.urgent && <div className="text-red-600 font-medium">⚡ เร่งด่วน</div>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="px-4 py-2 rounded-md border text-sm">← แก้ไข</button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 px-4 py-2 rounded-md bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:bg-gray-300 transition">
              {loading ? 'กำลังส่ง...' : '✓ ยืนยันส่งรายงาน'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
