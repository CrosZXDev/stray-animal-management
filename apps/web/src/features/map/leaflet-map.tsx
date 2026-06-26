'use client';

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { HeatmapData, AnimalMarker, MapLayers, LayerVisibility, MapBounds } from './types';

// Fix Leaflet default marker icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LeafletMapProps {
  heatmapData: HeatmapData | null;
  markers: AnimalMarker[];
  layers: MapLayers | null;
  useHeatmap: boolean;
  layerVisibility: LayerVisibility;
  onBoundsChange: (bounds: MapBounds) => void;
}

// Custom marker icons
const MARKER_ICONS = {
  DOG: L.divIcon({
    className: 'custom-marker',
    html: '<div class="flex items-center justify-center w-8 h-8 bg-orange-500 rounded-full border-2 border-white shadow text-sm">🐕</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }),
  CAT: L.divIcon({
    className: 'custom-marker',
    html: '<div class="flex items-center justify-center w-8 h-8 bg-amber-500 rounded-full border-2 border-white shadow text-sm">🐈</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }),
  FEEDING: L.divIcon({
    className: 'custom-marker',
    html: '<div class="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow text-sm">🍽️</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }),
  SHELTER: L.divIcon({
    className: 'custom-marker',
    html: '<div class="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow text-sm">🏠</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }),
};

const STATUS_LABELS: Record<string, string> = {
  STRAY: 'จรจัด',
  AWAITING_NEUTER: 'รอทำหมัน',
  ADOPTABLE: 'พร้อมรับเลี้ยง',
  IN_PROCESS: 'อยู่ในกระบวนการ',
  ADOPTED: 'ถูกรับเลี้ยงแล้ว',
};

// Bangkok center coordinates
const BANGKOK_CENTER: [number, number] = [13.7563, 100.5018];
const DEFAULT_ZOOM = 12;

export function LeafletMap({
  heatmapData,
  markers,
  layers,
  useHeatmap,
  layerVisibility,
  onBoundsChange,
}: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const heatLayerRef = useRef<any>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const feedingLayerRef = useRef<L.LayerGroup | null>(null);
  const shelterLayerRef = useRef<L.LayerGroup | null>(null);
  const tnrLayerRef = useRef<L.LayerGroup | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Get bounds from map
  const getBoundsFromMap = useCallback((map: L.Map): MapBounds => {
    const bounds = map.getBounds();
    return {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: BANGKOK_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
    });

    // Add zoom control to bottom-left
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Create layer groups
    markerLayerRef.current = L.layerGroup().addTo(map);
    feedingLayerRef.current = L.layerGroup().addTo(map);
    shelterLayerRef.current = L.layerGroup().addTo(map);
    tnrLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    // Initial bounds fetch
    onBoundsChange(getBoundsFromMap(map));

    // Listen for map movements with debounce
    const handleMoveEnd = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (mapRef.current) {
          onBoundsChange(getBoundsFromMap(mapRef.current));
        }
      }, 300);
    };

    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleMoveEnd);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleMoveEnd);
      map.remove();
      mapRef.current = null;
    };
  }, [onBoundsChange, getBoundsFromMap]);

  // Update heatmap layer
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing heatmap
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (useHeatmap && heatmapData && layerVisibility.animals) {
      // Import leaflet.heat dynamically
      import('leaflet.heat').then(() => {
        if (!mapRef.current || !heatmapData) return;
        const heatPoints: [number, number, number][] = heatmapData.points.map((p) => [
          p.lat,
          p.lng,
          p.intensity,
        ]);
        heatLayerRef.current = (L as any).heatLayer(heatPoints, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          gradient: { 0.2: '#ffffb2', 0.4: '#fecc5c', 0.6: '#fd8d3c', 0.8: '#f03b20', 1.0: '#bd0026' },
        }).addTo(mapRef.current);
      });
    }
  }, [useHeatmap, heatmapData, layerVisibility.animals]);

  // Update animal markers
  useEffect(() => {
    if (!markerLayerRef.current) return;
    markerLayerRef.current.clearLayers();

    if (!useHeatmap && layerVisibility.animals) {
      markers.forEach((animal) => {
        if (!animal.latitude || !animal.longitude) return;
        const icon = animal.type === 'DOG' ? MARKER_ICONS.DOG : MARKER_ICONS.CAT;
        const marker = L.marker([animal.latitude, animal.longitude], { icon });
        marker.bindPopup(`
          <div class="text-sm">
            <div class="font-semibold">${animal.type === 'DOG' ? '🐕' : '🐈'} ${animal.name || 'ไม่ทราบชื่อ'}</div>
            <div class="text-gray-500 text-xs">${animal.animalId}</div>
            <div class="mt-1">สี: ${animal.color}</div>
            <div>สถานะ: ${STATUS_LABELS[animal.status] || animal.status}</div>
            <div>📍 ${animal.district}</div>
            <a href="/animals/${animal.id}" class="text-orange-600 text-xs mt-1 inline-block hover:underline">ดูรายละเอียด →</a>
          </div>
        `);
        markerLayerRef.current!.addLayer(marker);
      });
    }
  }, [markers, useHeatmap, layerVisibility.animals]);

  // Update feeding station markers
  useEffect(() => {
    if (!feedingLayerRef.current) return;
    feedingLayerRef.current.clearLayers();

    if (layerVisibility.feedingStations && layers?.feedingStations) {
      layers.feedingStations.forEach((station) => {
        if (!station.latitude || !station.longitude) return;
        const marker = L.marker([station.latitude, station.longitude], {
          icon: MARKER_ICONS.FEEDING,
        });
        marker.bindPopup(`
          <div class="text-sm">
            <div class="font-semibold">🍽️ จุดให้อาหาร</div>
            <div>📍 ${station.district}</div>
            <div>เวลา: ${station.feedingTime}</div>
            <div class="${station.isActive ? 'text-green-600' : 'text-red-600'}">
              ${station.isActive ? '● Active' : '○ Inactive'}
            </div>
          </div>
        `);
        feedingLayerRef.current!.addLayer(marker);
      });
    }
  }, [layers, layerVisibility.feedingStations]);

  // Update shelter markers
  useEffect(() => {
    if (!shelterLayerRef.current) return;
    shelterLayerRef.current.clearLayers();

    if (layerVisibility.shelters && layers?.shelters) {
      // Shelters are a placeholder for now - will be populated when shelter model is ready
    }
  }, [layers, layerVisibility.shelters]);

  // Update TNR area polygons (from zones)
  useEffect(() => {
    if (!tnrLayerRef.current) return;
    tnrLayerRef.current.clearLayers();

    if (layerVisibility.tnrAreas && layers?.zones) {
      layers.zones.forEach((zone) => {
        if (!zone.boundary) return;
        try {
          const geoJson = JSON.parse(zone.boundary);
          const polygon = L.geoJSON(geoJson, {
            style: {
              color: '#7c3aed',
              weight: 2,
              fillColor: '#7c3aed',
              fillOpacity: 0.1,
            },
          });
          polygon.bindPopup(`
            <div class="text-sm">
              <div class="font-semibold">✂️ ${zone.name}</div>
              <div>📍 ${zone.district}</div>
            </div>
          `);
          tnrLayerRef.current!.addLayer(polygon);
        } catch {
          // Skip invalid boundary data
        }
      });
    }
  }, [layers, layerVisibility.tnrAreas]);

  return (
    <div
      ref={mapContainerRef}
      className="h-full w-full"
      aria-label="แผนที่สัตว์จรจัด"
    />
  );
}
