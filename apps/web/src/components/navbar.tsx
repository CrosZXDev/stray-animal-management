'use client';

import { useState, useEffect } from 'react';

const navLinks = [
  { href: '/reports/new', label: 'แจ้งเบาะแส', emoji: '📢' },
  { href: '/animals', label: 'สัตว์จรจัด', emoji: '🐾' },
  { href: '/adoption', label: 'รับเลี้ยง', emoji: '🏠' },
  { href: '/map', label: 'แผนที่', emoji: '🗺️' },
  { href: '/dashboard', label: 'Dashboard', emoji: '📊' },
];

interface UserInfo {
  displayName: string;
  role: string;
}

const roleLabels: Record<string, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  OFFICER: 'เจ้าหน้าที่',
  VET: 'สัตวแพทย์',
  CITIZEN: 'ประชาชน',
  VOLUNTEER: 'อาสาสมัคร',
  FEEDER: 'ผู้ดูแลอาหาร',
  ADOPTER: 'ผู้รับเลี้ยง',
  NGO: 'NGO/มูลนิธิ',
};

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    // Check if user is logged in by reading stored user info
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <nav className="sticky top-0 z-50 bg-orange-600 text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <a href="/" className="text-xl font-bold">
            🐾 ระบบจัดการสัตว์จรจัด
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded px-3 py-1.5 text-sm hover:bg-orange-700 transition-colors"
              >
                {link.emoji} {link.label}
              </a>
            ))}

            {/* Auth status */}
            {user ? (
              <div className="ml-3 flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-orange-700/60 px-3 py-1">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-medium">{user.displayName}</span>
                  <span className="text-[10px] opacity-75">({roleLabels[user.role] || user.role})</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded bg-orange-800 px-2.5 py-1 text-xs hover:bg-orange-900 transition-colors"
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className="ml-2 rounded bg-orange-800 px-3 py-1.5 text-sm hover:bg-orange-900 transition-colors"
              >
                เข้าสู่ระบบ
              </a>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden rounded p-1 hover:bg-orange-700"
            aria-label="เปิดเมนู"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block rounded px-3 py-2 text-sm hover:bg-orange-700"
              >
                {link.emoji} {link.label}
              </a>
            ))}

            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="h-2 w-2 rounded-full bg-green-400" />
                  <span className="text-sm">{user.displayName}</span>
                  <span className="text-xs opacity-75">({roleLabels[user.role] || user.role})</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left rounded px-3 py-2 text-sm bg-orange-800 hover:bg-orange-900"
                >
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="block rounded px-3 py-2 text-sm bg-orange-800 hover:bg-orange-900"
              >
                เข้าสู่ระบบ
              </a>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
