'use client';

import { useState } from 'react';
import { useMonthlyReport } from './use-monthly-report';
import { MonthSelector } from './month-selector';
import { KpiCards } from './kpi-cards';
import { PdfExportButton } from './pdf-export-button';

/**
 * Main view component for the monthly report page.
 * Shows KPI cards, month selector, and PDF export button.
 */
export function MonthlyReportView() {
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonth());
  const { report, loading, error, refetch } = useMonthlyReport(selectedMonth);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            📊 รายงานประจำเดือน
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            สรุป KPI และผลดำเนินงานประจำเดือน
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
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
            <p className="mt-2 text-sm text-gray-500">กำลังโหลดรายงาน...</p>
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

      {/* Report content */}
      {report && !loading && (
        <>
          {/* Report info + PDF export */}
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600">
              <p>
                <span className="font-medium">สร้างเมื่อ:</span>{' '}
                {formatDate(report.generatedAt)}
              </p>
              {report.district && (
                <p className="mt-1">
                  <span className="font-medium">เขต:</span> {report.district}
                </p>
              )}
            </div>
            <PdfExportButton pdfUrl={report.pdfUrl} month={report.month} />
          </div>

          {/* KPI Cards */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              ตัวชี้วัดหลัก (KPIs)
            </h2>
            <KpiCards kpis={report.kpis} />
          </section>
        </>
      )}
    </div>
  );
}

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
