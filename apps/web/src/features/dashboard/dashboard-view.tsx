'use client';

import { useState } from 'react';
import { useDashboardData } from './use-dashboard-data';
import { StatsCards } from './stats-cards';
import { ActionItems } from './action-items';
import { TrendCharts } from './trend-charts';
import { DistrictFilter } from './district-filter';

export function DashboardView() {
  const [district, setDistrict] = useState('');
  const { data, loading, error, refetch } = useDashboardData(district || undefined);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            แดชบอร์ดภาพรวม
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            สรุปข้อมูลระบบจัดการสัตว์จรจัด
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DistrictFilter value={district} onChange={setDistrict} />
          <button
            onClick={refetch}
            className="rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
            title="รีเฟรช"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
            <p className="mt-2 text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-2xl">❌</p>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button
            onClick={refetch}
            className="mt-3 rounded-md bg-red-100 px-4 py-2 text-sm text-red-700 hover:bg-red-200 transition"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {/* Dashboard content */}
      {data && !loading && (
        <>
          {/* Stats Cards */}
          <StatsCards stats={data.stats} />

          {/* Two-column layout: Action Items + Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Action Items */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-800">
                ⚡ รายการที่ต้องดำเนินการ
              </h2>
              <ActionItems actionItems={data.actionItems} />
            </div>

            {/* Trend Charts */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-800">
                📊 แนวโน้มข้อมูล
              </h2>
              <TrendCharts trends={data.trends} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
