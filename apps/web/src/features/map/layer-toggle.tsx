'use client';

import { Switch } from '@headlessui/react';
import type { LayerVisibility } from './types';

interface LayerToggleProps {
  layers: LayerVisibility;
  onChange: (layers: LayerVisibility) => void;
}

const LAYER_CONFIG = [
  { key: 'animals' as const, label: 'สัตว์จรจัด', icon: '🐾', color: 'bg-orange-500' },
  { key: 'feedingStations' as const, label: 'จุดให้อาหาร', icon: '🍽️', color: 'bg-green-500' },
  { key: 'shelters' as const, label: 'ที่พักพิง', icon: '🏠', color: 'bg-blue-500' },
  { key: 'tnrAreas' as const, label: 'พื้นที่ TNR', icon: '✂️', color: 'bg-purple-500' },
] as const;

export function LayerToggle({ layers, onChange }: LayerToggleProps) {
  const handleToggle = (key: keyof LayerVisibility) => {
    onChange({ ...layers, [key]: !layers[key] });
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] rounded-lg bg-white p-3 shadow-lg">
      <h3 className="mb-2 text-sm font-semibold text-gray-700">ชั้นข้อมูล</h3>
      <div className="space-y-2">
        {LAYER_CONFIG.map(({ key, label, icon, color }) => (
          <div key={key} className="flex items-center gap-2">
            <Switch
              checked={layers[key]}
              onChange={() => handleToggle(key)}
              className={`${
                layers[key] ? color : 'bg-gray-200'
              } relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2`}
            >
              <span className="sr-only">{label}</span>
              <span
                className={`${
                  layers[key] ? 'translate-x-4' : 'translate-x-0'
                } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </Switch>
            <span className="text-sm text-gray-600">
              {icon} {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
