'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { LayerToggle } from './layer-toggle';
import { useMapData } from './use-map-data';
import type { LayerVisibility, MapBounds } from './types';

// Dynamically import the Leaflet map to avoid SSR issues
const LeafletMap = dynamic(() => import('./leaflet-map').then((m) => m.LeafletMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="mb-2 text-2xl">🗺️</div>
        <p className="text-sm text-gray-500">กำลังโหลดแผนที่...</p>
      </div>
    </div>
  ),
});

export function MapView() {
  const { heatmapData, markers, layers, loading, useHeatmap, onBoundsChange } = useMapData();

  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    animals: true,
    feedingStations: true,
    shelters: true,
    tnrAreas: true,
  });

  const handleBoundsChange = useCallback(
    (bounds: MapBounds) => {
      onBoundsChange(bounds);
    },
    [onBoundsChange],
  );

  return (
    <div className="relative h-full w-full">
      <LeafletMap
        heatmapData={heatmapData}
        markers={markers}
        layers={layers}
        useHeatmap={useHeatmap}
        layerVisibility={layerVisibility}
        onBoundsChange={handleBoundsChange}
      />

      {/* Layer Toggle Control */}
      <LayerToggle layers={layerVisibility} onChange={setLayerVisibility} />

      {/* Loading indicator */}
      {loading && (
        <div className="absolute bottom-4 left-4 z-[1000] rounded-lg bg-white/90 px-3 py-2 text-sm text-gray-600 shadow">
          ⏳ กำลังโหลดข้อมูล...
        </div>
      )}

      {/* Mode indicator */}
      <div className="absolute bottom-4 right-4 z-[1000] rounded-lg bg-white/90 px-3 py-2 text-xs text-gray-500 shadow">
        {useHeatmap ? '🔥 โหมด Heatmap' : '📍 โหมด Markers'}
        {heatmapData && ` (${heatmapData.total} ตัว)`}
      </div>
    </div>
  );
}
