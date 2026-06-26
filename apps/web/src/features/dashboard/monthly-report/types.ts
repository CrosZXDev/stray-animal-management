/** Types for monthly report feature */

export interface MonthlyReportKpis {
  registeredAnimals: number;
  sterilizationRate: number;
  adoptionRate: number;
  resolutionRate: number;
  newReports: number;
  resolvedReports: number;
  activeVolunteers: number;
  donations: number;
}

export interface MonthlyReport {
  id: string;
  month: string; // "2024-01"
  generatedAt: string;
  kpis: MonthlyReportKpis;
  district?: string;
  pdfUrl?: string;
}
