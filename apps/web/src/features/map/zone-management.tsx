'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useZoneManagement } from './use-zone-management';
import { ZoneForm } from './zone-form';
import { ZoneList } from './zone-list';

// Dynamic import for Leaflet map (client-only, no SSR)
const ZoneDrawMap = dynamic(
  () => import('./zone-draw-map').then((mod) => ({ default: mod.ZoneDrawMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-gray-500">กำลังโหลดแผนที่...</p>
        </div>
      </div>
    ),
  }
);

export function ZoneManagement() {
  const {
    zones,
    zoneStats,
    loading,
    error,
    createZone,
    fetchZoneStats,
    refreshZones,
  } = useZoneManagement();

  const [drawnPolygon, setDrawnPolygon] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  const handlePolygonDrawn = useCallback((geoJson: string) => {
    setDrawnPolygon(geoJson);
  }, []);

  const handleClearPolygon = useCallback(() => {
    setDrawnPolygon('');
  }, []);

  const handleCreateZone = useCallback(
    async (payload: Parameters<typeof createZone>[0]) => {
      const success = await createZone(payload);
      if (success) {
        await refreshZones();
      }
      return success;
    },
    [createZone, refreshZones]
  );

  return (
    <div className="flex flex-col lg:flex-row h-full gap-0 lg:gap-4">
      {/* Map area */}
      <div className="flex-1 h-[50vh] lg:h-full min-h-[300px]">
        <ZoneDrawMap
          zones={zones}
          onPolygonDrawn={handlePolygonDrawn}
          selectedZoneId={selectedZoneId}
        />
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 xl:w-96 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-200 bg-white overflow-y-auto">
        {/* Tab toggle (mobile) */}
        <div className="flex border-b border-gray-200 lg:hidden">
          <button
            onClick={() => setShowForm(true)}
            className={`flex-1 px-4 py-2.5 text-xs font-medium ${
              showForm
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
          >
            สร้างโซน
          </button>
          <button
            onClick={() => setShowForm(false)}
            className={`flex-1 px-4 py-2.5 text-xs font-medium ${
              !showForm
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
          >
            รายการโซน ({zones.length})
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Error message */}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
              <p className="text-xs text-red-700">❌ {error}</p>
            </div>
          )}

          {/* Form section - visible on desktop always, mobile when tab active */}
          <div className={`${showForm ? 'block' : 'hidden'} lg:block`}>
            <ZoneForm
              drawnPolygon={drawnPolygon}
              onSubmit={handleCreateZone}
              onClearPolygon={handleClearPolygon}
            />
          </div>

          {/* Divider (desktop) */}
          <div className="hidden lg:block border-t border-gray-200" />

          {/* Zone list - visible on desktop always, mobile when tab active */}
          <div className={`${!showForm ? 'block' : 'hidden'} lg:block`}>
            <ZoneList
              zones={zones}
              zoneStats={zoneStats}
              selectedZoneId={selectedZoneId}
              onSelectZone={setSelectedZoneId}
              onFetchStats={fetchZoneStats}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
