'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface Animal {
  id: string;
  animalId: string;
  type: string;
  name: string | null;
  color: string;
  size: string;
  gender: string;
  district: string;
  status: string;
  neutered: boolean;
  vaccinated: boolean;
  personality: string | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  STRAY: { label: 'จรจัด', color: 'bg-gray-100 text-gray-700' },
  AWAITING_NEUTER: { label: 'รอทำหมัน', color: 'bg-yellow-100 text-yellow-700' },
  ADOPTABLE: { label: 'พร้อมรับเลี้ยง', color: 'bg-green-100 text-green-700' },
  IN_PROCESS: { label: 'อยู่ในกระบวนการ', color: 'bg-blue-100 text-blue-700' },
  ADOPTED: { label: 'ถูกรับเลี้ยงแล้ว', color: 'bg-purple-100 text-purple-700' },
  FOSTERING: { label: 'กำลัง foster', color: 'bg-indigo-100 text-indigo-700' },
};

export function AnimalList() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', district: '', status: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchAnimals();
  }, [filters, page]);

  const fetchAnimals = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.district) params.set('district', filters.district);
    if (filters.status) params.set('status', filters.status);
    params.set('page', String(page));
    params.set('limit', '20');

    const res = await api.get<any>(`/animals?${params}`);
    if (res.success && res.data) {
      // API returns { data: Animal[], meta: {...} } inside the response envelope
      const responseData = res.data;
      if (Array.isArray(responseData)) {
        setAnimals(responseData);
        setTotal(res.meta?.total || responseData.length);
      } else if (responseData.data && Array.isArray(responseData.data)) {
        setAnimals(responseData.data);
        setTotal(responseData.meta?.total || res.meta?.total || 0);
      } else {
        setAnimals([]);
        setTotal(0);
      }
    }
    setLoading(false);
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filters.type}
          onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}
          className="rounded-md border-gray-300 text-sm"
        >
          <option value="">ทุกประเภท</option>
          <option value="DOG">🐕 สุนัข</option>
          <option value="CAT">🐈 แมว</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
          className="rounded-md border-gray-300 text-sm"
        >
          <option value="">ทุกสถานะ</option>
          <option value="STRAY">จรจัด</option>
          <option value="ADOPTABLE">พร้อมรับเลี้ยง</option>
          <option value="AWAITING_NEUTER">รอทำหมัน</option>
          <option value="ADOPTED">ถูกรับเลี้ยงแล้ว</option>
        </select>
        <input
          type="text"
          value={filters.district}
          onChange={(e) => { setFilters({ ...filters, district: e.target.value }); setPage(1); }}
          placeholder="เขต..."
          className="rounded-md border-gray-300 text-sm w-32"
        />
        <span className="text-sm text-gray-500 self-center">
          พบ {total} ตัว
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
      ) : animals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">ไม่พบสัตว์ตรงเงื่อนไข</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {animals.map((animal) => (
            <a
              key={animal.id}
              href={`/animals/${animal.id}`}
              className="block rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">
                  {animal.type === 'DOG' ? '🐕' : '🐈'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {animal.name || 'ไม่ทราบชื่อ'}
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      {animal.animalId}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-0.5">
                    {animal.color} | {animal.size === 'SMALL' ? 'เล็ก' : animal.size === 'MEDIUM' ? 'กลาง' : 'ใหญ่'} | 📍 {animal.district}
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusLabels[animal.status]?.color || 'bg-gray-100'}`}>
                      {statusLabels[animal.status]?.label || animal.status}
                    </span>
                    {animal.neutered && <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-600">ทำหมันแล้ว</span>}
                    {animal.vaccinated && <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600">วัคซีนแล้ว</span>}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded border text-sm disabled:opacity-50"
          >
            ← ก่อนหน้า
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            หน้า {page} / {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-3 py-1 rounded border text-sm disabled:opacity-50"
          >
            ถัดไป →
          </button>
        </div>
      )}
    </div>
  );
}
