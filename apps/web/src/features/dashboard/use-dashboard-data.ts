'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import type { DashboardOverview } from './types';

interface UseDashboardDataResult {
  data: DashboardOverview | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardData(district?: string): UseDashboardDataResult {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const path = district
        ? `/dashboard/overview?district=${encodeURIComponent(district)}`
        : '/dashboard/overview';
      const res = await api.get<DashboardOverview>(path);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error?.message || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อ server ได้');
    } finally {
      setLoading(false);
    }
  }, [district]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
