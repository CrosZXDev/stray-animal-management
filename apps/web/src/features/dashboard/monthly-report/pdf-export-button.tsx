'use client';

import { useState } from 'react';

interface PdfExportButtonProps {
  pdfUrl?: string;
  month: string;
}

/**
 * Button to export/download the monthly report PDF.
 * Uses the pdfUrl from the backend-generated report.
 */
export function PdfExportButton({ pdfUrl, month }: PdfExportButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!pdfUrl) return;
    setDownloading(true);
    try {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `monthly-report-${month}.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={!pdfUrl || downloading}
      className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
      title={pdfUrl ? 'ดาวน์โหลดรายงาน PDF' : 'ไม่มีไฟล์ PDF'}
    >
      {downloading ? (
        <>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          กำลังดาวน์โหลด...
        </>
      ) : (
        <>
          📄 ดาวน์โหลด PDF
        </>
      )}
    </button>
  );
}
