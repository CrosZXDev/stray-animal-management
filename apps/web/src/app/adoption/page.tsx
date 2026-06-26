'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface AdoptionProfile {
  id: string;
  animalId: string;
  type: string;
  name: string | null;
  color: string;
  size: string;
  gender: string;
  personality: string | null;
  district: string;
  neutered: boolean;
  vaccinated: boolean;
  photo: string | null;
  suitableFor: string | null;
  matchScore?: number;
  reasons?: string[];
}

export default function AdoptionPage() {
  const [profiles, setProfiles] = useState<AdoptionProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', size: '' });

  useEffect(() => { loadProfiles(); }, [filter]);

  const loadProfiles = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.type) params.set('type', filter.type);
    if (filter.size) params.set('size', filter.size);
    const res = await api.get<any>(`/adoption/profiles?${params}`);
    if (res.success) setProfiles(res.data || []);
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">🏠 รับเลี้ยงสัตว์</h1>
      <p className="text-gray-600 mb-6">เลือกสัตว์ที่เหมาะกับคุณ — ทุกตัวทำหมันและฉีดวัคซีนแล้ว</p>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilter({ ...filter, type: '' })}
          className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition ${!filter.type ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
          ทั้งหมด
        </button>
        <button onClick={() => setFilter({ ...filter, type: 'DOG' })}
          className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition ${filter.type === 'DOG' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
          🐕 สุนัข
        </button>
        <button onClick={() => setFilter({ ...filter, type: 'CAT' })}
          className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition ${filter.type === 'CAT' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
          🐈 แมว
        </button>
        <select value={filter.size} onChange={(e) => setFilter({ ...filter, size: e.target.value })}
          className="rounded-lg border-gray-300 text-sm">
          <option value="">ทุกขนาด</option>
          <option value="SMALL">เล็ก</option>
          <option value="MEDIUM">กลาง</option>
          <option value="LARGE">ใหญ่</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">ไม่มีสัตว์ตรงเงื่อนไข</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {profiles.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-orange-50 p-8 text-center">
                <span className="text-6xl">{p.type === 'DOG' ? '🐕' : '🐈'}</span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900">{p.name || 'ไม่ทราบชื่อ'}</h3>
                <div className="text-sm text-gray-600 mt-1">
                  {p.type === 'DOG' ? 'สุนัข' : 'แมว'} | {p.color} | {p.size === 'SMALL' ? 'เล็ก' : p.size === 'MEDIUM' ? 'กลาง' : 'ใหญ่'} | {p.gender === 'MALE' ? 'ผู้' : p.gender === 'FEMALE' ? 'เมีย' : '-'}
                </div>
                <div className="text-sm text-gray-600 mt-1">📍 {p.district}</div>
                {p.personality && (
                  <div className="mt-2 text-sm"><span className="font-medium">นิสัย:</span> {p.personality}</div>
                )}
                {p.suitableFor && (
                  <div className="mt-1 text-xs text-gray-500">เหมาะกับ: {p.suitableFor}</div>
                )}
                <div className="mt-3 flex gap-1.5 flex-wrap">
                  {p.neutered && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">✓ ทำหมัน</span>}
                  {p.vaccinated && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">✓ วัคซีน</span>}
                </div>
                <a href={`/adoption/apply?animalId=${p.id}`}
                  className="mt-4 block w-full text-center rounded-lg bg-orange-600 py-2 text-sm text-white font-medium hover:bg-orange-700 transition">
                  ❤️ สนใจรับเลี้ยง
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
