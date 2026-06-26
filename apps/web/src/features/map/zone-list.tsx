'use client';

import { useEffect } from 'react';
import type { Zone, ZoneStats } from './types';

interface ZoneListProps {
  zones: Zone[];
  zoneStats: Record<string, ZoneStats>;
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string | null) => void;
  onFetchStats: (zoneId: string) => void;
  loading: boolean;
}

export function ZoneList({
  zones,
  zoneStats,
  selectedZoneId,
  onSelectZone,
  onFetchStats,
  loading,
}: ZoneListProps) {
  // Fetch stats for selected zone
  useEffect(() => {
    if (selectedZoneId) {
      onFetchStats(selectedZoneId);
    }
  }, [selectedZoneId, onFetchStats]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-3xl mb-2">📍</div>
        <p className="text-sm text-gray-500">ยังไม่มีโซน</p>
        <p className="text-xs text-gray-400 mt-1">วาดขอบเขตบนแผนที่เพื่อสร้างโซนใหม่</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-900">
        โซนทั้งหมด ({zones.length})
      </h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {zones.map((zone) => {
          const isSelected = zone.id === selectedZoneId;
          const stats = zoneStats[zone.id];

          return (
            <button
              key={zone.id}
              onClick={() => onSelectZone(isSelected ? null : zone.id)}
              className={`w-full text-left rounded-lg border p-3 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {zone.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    📍 {zone.district}
                  </p>
                  {zone.assignedTeam && (
                    <p className="text-xs text-gray-500">
                      👥 {zone.assignedTeam}
                    </p>
                  )}
                </div>
                <div className={`w-2 h-2 rounded-full mt-1.5 ${isSelected ? 'bg-blue-500' : 'bg-gray-300'}`} />
              </div>

              {/* Stats when selected */}
              {isSelected && stats && (
                <div className="mt-3 pt-3 border-t border-blue-200 grid grid-cols-2 gap-2">
                  <StatItem label="สัตว์ทั้งหมด" value={stats.totalAnimals} />
                  <StatItem label="ทำหมันแล้ว" value={stats.neutered} color="green" />
                  <StatItem label="ฉีดวัคซีนแล้ว" value={stats.vaccinated} color="blue" />
                  <StatItem label="รายงานรอดำเนินการ" value={stats.pendingReports} color="amber" />
                </div>
              )}

              {isSelected && !stats && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="animate-pulse grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-8 bg-blue-100 rounded" />
                    ))}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  color = 'gray',
}: {
  label: string;
  value: number;
  color?: 'gray' | 'green' | 'blue' | 'amber';
}) {
  const colorMap = {
    gray: 'text-gray-900',
    green: 'text-green-700',
    blue: 'text-blue-700',
    amber: 'text-amber-700',
  };

  return (
    <div className="bg-white rounded px-2 py-1.5">
      <p className={`text-sm font-semibold ${colorMap[color]}`}>{value}</p>
      <p className="text-[10px] text-gray-500 leading-tight">{label}</p>
    </div>
  );
}
