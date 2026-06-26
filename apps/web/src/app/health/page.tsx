'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export default function HealthPage() {
  const [stats, setStats] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [statsRes, campaignsRes, scheduleRes] = await Promise.all([
      api.get<any>('/stats/health'),
      api.get<any>('/campaigns'),
      api.get<any>('/vaccines/schedule'),
    ]);
    if (statsRes.success) setStats(statsRes.data);
    if (campaignsRes.success) setCampaigns(campaignsRes.data || []);
    if (scheduleRes.success) setSchedule(scheduleRes.data || []);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">🏥 สุขภาพและการแพทย์</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.total}</div>
            <div className="text-xs text-gray-600">บันทึกทั้งหมด</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.sterilizations}</div>
            <div className="text-xs text-gray-600">ทำหมันแล้ว</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.vaccinations}</div>
            <div className="text-xs text-gray-600">ฉีดวัคซีนแล้ว</div>
          </div>
        </div>
      )}

      {/* Vaccine Schedule */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h2 className="font-bold text-gray-700 mb-3">💉 วัคซีนที่ใกล้ถึงกำหนด</h2>
        {schedule.length === 0 ? (
          <p className="text-sm text-gray-500">ไม่มีวัคซีนที่ใกล้ถึงกำหนด</p>
        ) : (
          <div className="space-y-2">
            {schedule.slice(0, 10).map((v: any) => (
              <div key={v.id} className="flex justify-between items-center border-b pb-2">
                <div className="text-sm">
                  <span className="font-medium">{v.vaccineType}</span>
                  <span className="text-gray-500 ml-2">สัตว์: {v.animalId?.slice(0, 8)}...</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${v.isOverdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {v.isOverdue ? `เลยกำหนด ${Math.abs(v.daysUntilDue)} วัน` : `อีก ${v.daysUntilDue} วัน`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Campaigns */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-gray-700">🎯 TNR Campaigns</h2>
          <a href="/health/campaigns/new" className="text-sm text-orange-600 hover:underline">+ สร้าง Campaign</a>
        </div>
        {campaigns.length === 0 ? (
          <p className="text-sm text-gray-500">ยังไม่มี campaign</p>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c: any) => (
              <div key={c.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{c.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${c.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : c.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                    {c.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{c.district}</div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>ทำหมัน {c.actualCount}/{c.targetCount}</span>
                    <span>{c.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-600 h-2 rounded-full transition-all" style={{ width: `${c.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
