'use client';

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import type { Zone } from './types';

// Fix Leaflet default marker icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Bangkok center coordinates
const BANGKOK_CENTER: [number, number] = [13.7563, 100.5018];
const DEFAULT_ZOOM = 12;

// Zone colors for different zones
const ZONE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
];

interface ZoneDrawMapProps {
  zones: Zone[];
  onPolygonDrawn: (geoJson: string) => void;
  selectedZoneId?: string | null;
}

export function ZoneDrawMap({ zones, onPolygonDrawn, selectedZoneId }: ZoneDrawMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const drawLayerRef = useRef<L.FeatureGroup | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: BANGKOK_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Feature group for drawn items
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawLayerRef.current = drawnItems;

    // Layer group for existing zones
    const zonesLayer = L.layerGroup().addTo(map);
    zonesLayerRef.current = zonesLayer;

    // Add draw control
    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1483b',
            message: '<strong>ไม่สามารถวาดรูปหลายเหลี่ยมที่ตัดกันเองได้</strong>',
          },
          shapeOptions: {
            color: '#3b82f6',
            weight: 3,
            fillOpacity: 0.2,
          },
        },
        polyline: false,
        circle: false,
        rectangle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    // Handle polygon creation
    map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      // Clear previous drawn polygon
      drawnItems.clearLayers();
      drawnItems.addLayer(layer);

      // Convert to GeoJSON
      const geoJson = layer.toGeoJSON();
      onPolygonDrawn(JSON.stringify(geoJson.geometry));
    });

    // Handle polygon deletion
    map.on(L.Draw.Event.DELETED, () => {
      onPolygonDrawn('');
    });

    // Handle polygon edit
    map.on(L.Draw.Event.EDITED, (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        const geoJson = layer.toGeoJSON();
        onPolygonDrawn(JSON.stringify(geoJson.geometry));
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update existing zones display
  useEffect(() => {
    if (!zonesLayerRef.current || !mapRef.current) return;
    zonesLayerRef.current.clearLayers();

    zones.forEach((zone, index) => {
      if (!zone.boundary) return;
      try {
        const geoJson = JSON.parse(zone.boundary);
        const color = ZONE_COLORS[index % ZONE_COLORS.length];
        const isSelected = zone.id === selectedZoneId;

        const polygon = L.geoJSON(geoJson, {
          style: {
            color: isSelected ? '#1d4ed8' : color,
            weight: isSelected ? 3 : 2,
            fillColor: color,
            fillOpacity: isSelected ? 0.3 : 0.1,
            dashArray: isSelected ? '' : '5, 5',
          },
        });

        polygon.bindPopup(`
          <div class="text-sm">
            <div class="font-semibold">${zone.name}</div>
            <div class="text-gray-500">📍 ${zone.district}</div>
            ${zone.assignedTeam ? `<div>👥 ทีม: ${zone.assignedTeam}</div>` : ''}
          </div>
        `);

        zonesLayerRef.current!.addLayer(polygon);

        // Fly to selected zone
        if (isSelected) {
          const bounds = polygon.getBounds();
          mapRef.current!.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch {
        // Skip invalid boundary data
      }
    });
  }, [zones, selectedZoneId]);

  // Clear drawn polygon helper (exposed via callback pattern)
  const clearDrawnPolygon = useCallback(() => {
    if (drawLayerRef.current) {
      drawLayerRef.current.clearLayers();
    }
  }, []);

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapContainerRef}
        className="h-full w-full rounded-lg"
        aria-label="แผนที่จัดการโซน - วาดรูปหลายเหลี่ยมเพื่อสร้างโซนใหม่"
      />
      {/* Draw instructions overlay */}
      <div className="absolute top-2 left-2 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm pointer-events-none">
        <p className="text-xs text-gray-600">
          ✏️ คลิกปุ่มรูปหลายเหลี่ยมด้านขวาบนเพื่อวาดโซนใหม่
        </p>
      </div>
    </div>
  );
}
