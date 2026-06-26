'use client';

import { useState } from 'react';
import { api } from '../../lib/api';

export function RegisterAnimalForm() {
  const [form, setForm] = useState({
    type: 'DOG',
    color: '',
    size: 'MEDIUM',
    gender: 'UNKNOWN',
    personality: '',
    markings: '',
    district: '',
    latitude: 0,
    longitude: 0,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm((f) => ({
            ...f,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }));
        },
        () => setError('ไม่สามารถเข้าถึงตำแหน่งได้'),
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post<any>('/animals', form);
      if (res.success) {
        setSuccess(`ลงทะเบียนสำเร็จ! ID: ${res.data.animalId}`);
        setForm({ type: 'DOG', color: '', size: 'MEDIUM', gender: 'UNKNOWN', personality: '', markings: '', district: '', latitude: 0, longitude: 0 });
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
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 border border-green-200">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          ❌ {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">ประเภท</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
          >
            <option value="DOG">สุนัข</option>
            <option value="CAT">แมว</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">เพศ</label>
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
          >
            <option value="MALE">ผู้</option>
            <option value="FEMALE">เมีย</option>
            <option value="UNKNOWN">ไม่ทราบ</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">สี/ลักษณะ *</label>
          <input
            type="text"
            required
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            placeholder="เช่น น้ำตาล, ขาว-ดำ"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">ขนาด</label>
          <select
            value={form.size}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
          >
            <option value="SMALL">เล็ก</option>
            <option value="MEDIUM">กลาง</option>
            <option value="LARGE">ใหญ่</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">เขต *</label>
        <input
          type="text"
          required
          value={form.district}
          onChange={(e) => setForm({ ...form, district: e.target.value })}
          placeholder="เช่น วัฒนา, จตุจักร"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">นิสัย/ลักษณะเด่น</label>
        <textarea
          value={form.personality}
          onChange={(e) => setForm({ ...form, personality: e.target.value })}
          rows={2}
          placeholder="เช่น เป็นมิตร, ขี้กลัว, มีแผลที่หู"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">พิกัด GPS</label>
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={detectLocation}
            className="rounded-md bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
          >
            📍 ตำแหน่งปัจจุบัน
          </button>
          {form.latitude !== 0 && (
            <span className="text-xs text-gray-500">
              {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
            </span>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !form.color || !form.district}
        className="w-full rounded-md bg-orange-600 px-4 py-2 text-white font-medium hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
      >
        {loading ? 'กำลังบันทึก...' : '📝 ลงทะเบียนสัตว์จรจัด'}
      </button>
    </form>
  );
}
