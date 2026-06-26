'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DashboardTrends } from './types';

interface TrendChartsProps {
  trends: DashboardTrends;
}

interface MergedTrendPoint {
  month: string;
  registrations: number;
  adoptions: number;
  sterilizations: number;
}

function mergeTrends(trends: DashboardTrends): MergedTrendPoint[] {
  const monthMap = new Map<string, MergedTrendPoint>();

  for (const point of trends.monthlyRegistrations) {
    const existing = monthMap.get(point.month) || {
      month: point.month,
      registrations: 0,
      adoptions: 0,
      sterilizations: 0,
    };
    existing.registrations = point.count;
    monthMap.set(point.month, existing);
  }

  for (const point of trends.monthlyAdoptions) {
    const existing = monthMap.get(point.month) || {
      month: point.month,
      registrations: 0,
      adoptions: 0,
      sterilizations: 0,
    };
    existing.adoptions = point.count;
    monthMap.set(point.month, existing);
  }

  for (const point of trends.monthlySterilizations) {
    const existing = monthMap.get(point.month) || {
      month: point.month,
      registrations: 0,
      adoptions: 0,
      sterilizations: 0,
    };
    existing.sterilizations = point.count;
    monthMap.set(point.month, existing);
  }

  return Array.from(monthMap.values()).sort((a, b) =>
    a.month.localeCompare(b.month),
  );
}

function formatMonth(month: string): string {
  const date = new Date(month + '-01');
  return date.toLocaleDateString('th-TH', { month: 'short' });
}

export function TrendCharts({ trends }: TrendChartsProps) {
  const data = mergeTrends(trends);

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-500">ยังไม่มีข้อมูลแนวโน้ม</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        📈 แนวโน้มรายเดือน
      </h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={(label) => `เดือน: ${formatMonth(label as string)}`}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  registrations: 'ลงทะเบียน',
                  adoptions: 'Adoption',
                  sterilizations: 'ทำหมัน',
                };
                return [value, labels[name] || name];
              }}
            />
            <Legend
              formatter={(value: string) => {
                const labels: Record<string, string> = {
                  registrations: 'ลงทะเบียนใหม่',
                  adoptions: 'Adoption',
                  sterilizations: 'ทำหมัน',
                };
                return labels[value] || value;
              }}
            />
            <Line
              type="monotone"
              dataKey="registrations"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="adoptions"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="sterilizations"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
