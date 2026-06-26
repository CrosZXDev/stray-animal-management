'use client';

interface MonthSelectorProps {
  value: string;
  onChange: (month: string) => void;
}

/**
 * Month/Year selector for monthly reports.
 * Generates options for the last 12 months.
 */
export function MonthSelector({ value, onChange }: MonthSelectorProps) {
  const months = generateMonthOptions(12);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="month-select" className="text-sm font-medium text-gray-700">
        เดือน:
      </label>
      <select
        id="month-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
      >
        {months.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function generateMonthOptions(count: number) {
  const options: { value: string; label: string }[] = [];
  const now = new Date();

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];

  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const value = `${year}-${month}`;
    const thaiYear = year + 543;
    const label = `${thaiMonths[date.getMonth()]} ${thaiYear}`;
    options.push({ value, label });
  }

  return options;
}
