'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import type { Zone, ZoneStats, CreateZonePayload } from './types';

interface UseZoneManagementReturn {
  zones: Zone[];
  zoneStats: Record<string, ZoneStats>;
  loading: boolean;
  error: string | null;
  createZone: (payload: CreateZonePayload) => Promise<boolean>;
  fetchZoneStats: (zoneId: string) => Promise<void>;
  refreshZones: () => Promise<void>;
}

export function useZoneManagement(): UseZoneManagementReturn {
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneStats, setZoneStats] = useState<Record<string, ZoneStats>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Zone[]>('/zones');
      if (response.success && response.data) {
        setZones(response.data);
      } else {
        setError(response.error?.message || 'ไม่สามารถโหลดข้อมูลโซนได้');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  }, []);

  const createZone = useCallback(async (payload: CreateZonePayload): Promise<boolean> => {
    setError(null);
    try {
      const response = await api.post<Zone>('/zones', payload);
      if (response.success && response.data) {
        setZones((prev) => [...prev, response.data!]);
        return true;
      } else {
        setError(response.error?.message || 'ไม่สามารถสร้างโซนได้');
        return false;
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการสร้างโซน');
      return false;
    }
  }, []);

  const fetchZoneStats = useCallback(async (zoneId: string) => {
    try {
      const response = await api.get<ZoneStats>(`/zones/${zoneId}/stats`);
      if (response.success && response.data) {
        setZoneStats((prev) => ({ ...prev, [zoneId]: response.data! }));
      }
    } catch {
      // Stats are non-critical, silently fail
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  return {
    zones,
    zoneStats,
    loading,
    error,
    createZone,
    fetchZoneStats,
    refreshZones: fetchZones,
  };
}
