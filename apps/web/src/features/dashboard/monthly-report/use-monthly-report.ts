'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import type { MonthlyReport } from './types';

interface UseMonthlyReportResult {
  report: MonthlyReport | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMonthlyReport(month: string): UseMonthlyReportResult {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!month) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<MonthlyReport>(
        `/reports/monthly?month=${encodeURIComponent(month)}`
      );
      if (res.success && res.data) {
        setReport(res.data);
      } else {
        setError(res.error?.message || 'ไม่สามารถโหลดรายงานได้');
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อ server ได้');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { report, loading, error, refetch: fetchReport };
}
