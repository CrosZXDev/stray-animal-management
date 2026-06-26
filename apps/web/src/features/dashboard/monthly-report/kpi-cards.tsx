'use client';

import type { MonthlyReportKpis } from './types';

interface KpiCardsProps {
  kpis: MonthlyReportKpis;
}

interface KpiCardItem {
  label: string;
  value: string;
  icon: string;
  color: string;
}

export function KpiCards({ kpis }: KpiCardsProps) {
  const cards: KpiCardItem[] = [
    {
      label: 'สัตว์ลงทะเบียน',
      value: kpis.registeredAnimals.toLocaleString(),
      icon: '🐾',
      color: 'bg-blue-50 border-blue-200 text-blue-700',
    },
    {
      label: 'อัตราทำหมัน',
      value: `${kpis.sterilizationRate}%`,
      icon: '✂️',
      color: 'bg-green-50 border-green-200 text-green-700',
    },
    {
      label: 'อัตรา Adoption',
      value: `${kpis.adoptionRate}%`,
      icon: '🏠',
      color: 'bg-purple-50 border-purple-200 text-purple-700',
    },
    {
      label: 'อัตราแก้ไขเคส',
      value: `${kpis.resolutionRate}%`,
      icon: '✅',
      color: 'bg-orange-50 border-orange-200 text-orange-700',
    },
    {
      label: 'รายงานใหม่',
      value: kpis.newReports.toLocaleString(),
      icon: '📋',
      color: 'bg-red-50 border-red-200 text-red-700',
    },
    {
      label: 'รายงานแก้ไขแล้ว',
      value: kpis.resolvedReports.toLocaleString(),
      icon: '📝',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    },
    {
      label: 'อาสาสมัคร Active',
      value: kpis.activeVolunteers.toLocaleString(),
      icon: '👥',
      color: 'bg-teal-50 border-teal-200 text-teal-700',
    },
    {
      label: 'เงินบริจาค (บาท)',
      value: kpis.donations.toLocaleString(),
      icon: '💰',
      color: 'bg-amber-50 border-amber-200 text-amber-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border p-4 ${card.color} transition hover:shadow-md`}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{card.icon}</span>
            <p className="text-sm font-medium opacity-80">{card.label}</p>
          </div>
          <p className="mt-2 text-2xl font-bold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
