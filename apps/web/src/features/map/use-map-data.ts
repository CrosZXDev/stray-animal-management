'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../lib/api';
import type { MapBounds, HeatmapData, AnimalMarker, MapLayers } from './types';

const HEATMAP_THRESHOLD = 100;

export function useMapData() {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [markers, setMarkers] = useState<AnimalMarker[]>([]);
  const [layers, setLayers] = useState<MapLayers | null>(null);
  const [loading, setLoading] = useState(false);
  const [useHeatmap, setUseHeatmap] = useState(false);
  const boundsRef = useRef<MapBounds | null>(null);

  const fetchHeatmap = useCallback(async (bounds: MapBounds) => {
    const params = new URLSearchParams({
      north: String(bounds.north),
      south: String(bounds.south),
      east: String(bounds.east),
      west: String(bounds.west),
    });
    const res = await api.get<HeatmapData>(`/map/heatmap?${params}`);
    if (res.success && res.data) {
      setHeatmapData(res.data);
      return res.data;
    }
    return null;
  }, []);

  const fetchMarkers = useCallback(async (bounds: MapBounds) => {
    const params = new URLSearchParams({
      north: String(bounds.north),
      south: String(bounds.south),
      east: String(bounds.east),
      west: String(bounds.west),
    });
    const res = await api.get<AnimalMarker[]>(`/map/markers?${params}`);
    if (res.success && res.data) {
      setMarkers(res.data);
    }
  }, []);

  const fetchLayers = useCallback(async () => {
    const res = await api.get<MapLayers>('/map/layers');
    if (res.success && res.data) {
      setLayers(res.data);
    }
  }, []);

  const onBoundsChange = useCallback(async (bounds: MapBounds) => {
    boundsRef.current = bounds;
    setLoading(true);
    try {
      // First check total count via heatmap endpoint
      const heatmap = await fetchHeatmap(bounds);
      if (heatmap) {
        const shouldUseHeatmap = heatmap.total >= HEATMAP_THRESHOLD;
        setUseHeatmap(shouldUseHeatmap);

        // If under threshold, fetch individual markers
        if (!shouldUseHeatmap) {
          await fetchMarkers(bounds);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [fetchHeatmap, fetchMarkers]);

  // Load layers once on mount
  useEffect(() => {
    fetchLayers();
  }, [fetchLayers]);

  return {
    heatmapData,
    markers,
    layers,
    loading,
    useHeatmap,
    onBoundsChange,
  };
}
