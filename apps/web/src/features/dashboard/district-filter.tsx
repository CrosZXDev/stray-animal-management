'use client';

import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface DistrictFilterProps {
  value: string;
  onChange: (district: string) => void;
}

const DISTRICTS = [
  '',
  'วัฒนา',
  'จตุจักร',
  'บางกะปิ',
  'ลาดพร้าว',
  'ห้วยขวาง',
  'ดินแดง',
  'พญาไท',
  'ราชเทวี',
  'ปทุมวัน',
  'บางรัก',
];

export function DistrictFilter({ value, onChange }: DistrictFilterProps) {
  return (
    <div className="w-full sm:w-64">
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-pointer rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-left text-sm shadow-sm hover:border-orange-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500">
            <span className="block truncate">
              {value ? `📍 ${value}` : '🗺️ ทุกเขต'}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                />
              </svg>
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              {DISTRICTS.map((district) => (
                <Listbox.Option
                  key={district || '__all__'}
                  value={district}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                      active ? 'bg-orange-50 text-orange-700' : 'text-gray-900'
                    }`
                  }
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {district || 'ทุกเขต'}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-orange-600">
                          ✓
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
