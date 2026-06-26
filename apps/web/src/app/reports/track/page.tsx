'use client';

import { useState } from 'react';
import { api } from '../../../lib/api';

const statusSteps = [
  { key: 'RECEIVED', label: 'รับเรื่องแล้ว', emoji: '📥' },
  { key: 'ASSIGNED', label: 'มอบหมายทีม', emoji: '👤' },
  { key: 'IN_PROGRESS', label: 'กำลังดำเนินการ', emoji: '🔧' },
  { key: 'RESOLVED', label: 'เสร็จสิ้น', emoji: '✅' },
];

export default function TrackReportPage() {
  const [trackingId, setTrackingId] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!trackingId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<any>(`/reports/${trackingId}`);
      if (res.success) {
        setReport(res.data);
      } else {
        setError('ไม่พบรายงานนี้ กรุณาตรวจสอบเลข tracking');
        setReport(null);
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อ server ได้');
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status: string) => {
    const idx = statusSteps.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">🔍 ติดตามสถานะรายงาน</h1>
      <p className="text-gray-600 mb-6">กรอกเลข tracking ที่ได้รับตอนแจ้งเบาะแส</p>

      <div className="flex gap-2 max-w-md mb-8">
        <input
          type="text"
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
          placeholder="RPT-YYYYMMDD-XXXX"
          className="flex-1 rounded-md border-gray-300 font-mono text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
        />
        <button onClick={handleSearch} disabled={loading || !trackingId}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm text-white font-medium hover:bg-orange-700 disabled:bg-gray-300 transition">
          {loading ? '...' : 'ค้นหา'}
        </button>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200 mb-4">❌ {error}</div>}

      {report && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-sm text-gray-500">{report.trackingId}</span>
            {report.urgent && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">เร่งด่วน</span>}
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-1 mb-6">
            {statusSteps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-1 flex-1">
                <div className={`flex flex-col items-center flex-1 ${i <= getStepIndex(report.status) ? 'text-orange-600' : 'text-gray-300'}`}>
                  <span className="text-xl">{s.emoji}</span>
                  <span className="text-xs mt-1 text-center">{s.label}</span>
                </div>
                {i < statusSteps.length - 1 && (
                  <div className={`h-0.5 flex-1 ${i < getStepIndex(report.status) ? 'bg-orange-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2 text-sm text-gray-700">
            <div><span className="text-gray-500">ประเภท:</span> {report.type}</div>
            <div><span className="text-gray-500">รายละเอียด:</span> {report.description}</div>
            <div><span className="text-gray-500">เขต:</span> {report.district}</div>
            <div><span className="text-gray-500">แจ้งเมื่อ:</span> {new Date(report.createdAt).toLocaleString('th-TH')}</div>
          </div>
        </div>
      )}
    </div>
  );
}
