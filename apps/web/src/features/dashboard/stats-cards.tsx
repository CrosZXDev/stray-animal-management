'use client';

import type { DashboardStats } from './types';

interface StatsCardsProps {
  stats: DashboardStats;
}

interface StatCardItem {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  sublabel?: string;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards: StatCardItem[] = [
    {
      label: 'สัตว์ลงทะเบียนทั้งหมด',
      value: stats.totalAnimals.toLocaleString(),
      icon: '🐾',
      color: 'bg-blue-50 border-blue-200 text-blue-700',
      sublabel: `🐕 ${stats.totalDogs.toLocaleString()} | 🐈 ${stats.totalCats.toLocaleString()}`,
    },
    {
      label: 'อัตราทำหมัน',
      value: `${stats.sterilizationRate}%`,
      icon: '✂️',
      color: 'bg-green-50 border-green-200 text-green-700',
    },
    {
      label: 'อัตรา Adoption',
      value: `${stats.adoptionRate}%`,
      icon: '🏠',
      color: 'bg-purple-50 border-purple-200 text-purple-700',
    },
    {
      label: 'อัตราแก้ไขรายงาน',
      value: `${stats.reportResolutionRate}%`,
      icon: '✅',
      color: 'bg-orange-50 border-orange-200 text-orange-700',
    },
    {
      label: 'อาสาสมัคร Active',
      value: stats.activeVolunteers.toLocaleString(),
      icon: '👥',
      color: 'bg-teal-50 border-teal-200 text-teal-700',
    },
    {
      label: 'จุดให้อาหาร',
      value: stats.feedingStations.toLocaleString(),
      icon: '🍽️',
      color: 'bg-amber-50 border-amber-200 text-amber-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border p-4 ${card.color} transition hover:shadow-md`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">{card.icon}</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{card.value}</p>
          <p className="text-sm font-medium opacity-80">{card.label}</p>
          {card.sublabel && (
            <p className="mt-1 text-xs opacity-70">{card.sublabel}</p>
          )}
        </div>
      ))}
    </div>
  );
}
