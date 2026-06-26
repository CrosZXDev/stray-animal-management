'use client';

import { useState } from 'react';
import { api } from '../../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post<{ user: any; token: string }>('/auth/login', {
        email,
        password,
      });

      if (res.success && res.data) {
        api.setToken(res.data.token);
        localStorage.setItem('auth_user', JSON.stringify(res.data.user));
        window.location.href = '/dashboard';
      } else {
        setError(res.error?.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อ server ได้');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
    setLoading(true);
    setError('');

    try {
      const res = await api.post<{ user: any; token: string }>('/auth/login', {
        email: userEmail,
        password: userPassword,
      });

      if (res.success && res.data) {
        api.setToken(res.data.token);
        localStorage.setItem('auth_user', JSON.stringify(res.data.user));
        window.location.href = '/dashboard';
      } else {
        setError(res.error?.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อ server ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-5xl mb-3">🐾</div>
          <h1 className="text-2xl font-bold text-gray-900">ระบบจัดการสัตว์จรจัด</h1>
          <p className="mt-1 text-sm text-gray-500">กรุงเทพมหานคร</p>
        </div>

        {/* Login Form */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-800">เข้าสู่ระบบ</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                อีเมล
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่าน
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5">
                <p className="text-sm text-red-700">❌ {error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>

        {/* Quick Login (Dev only) */}
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white/50 p-6">
          <p className="mb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
            🧪 ทดสอบ (Quick Login)
          </p>
          <div className="space-y-2">
            <button
              onClick={() => quickLogin('admin@stray-animal.go.th', 'admin123')}
              disabled={loading}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-left text-sm hover:bg-gray-50 transition disabled:opacity-50"
            >
              <span className="font-medium text-gray-800">👨‍💼 ผู้ดูแลระบบ</span>
              <span className="ml-2 text-xs text-gray-400">admin@stray-animal.go.th</span>
            </button>
            <button
              onClick={() => quickLogin('vet@stray-animal.go.th', 'vet123')}
              disabled={loading}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-left text-sm hover:bg-gray-50 transition disabled:opacity-50"
            >
              <span className="font-medium text-gray-800">🩺 สัตวแพทย์</span>
              <span className="ml-2 text-xs text-gray-400">vet@stray-animal.go.th</span>
            </button>
            <button
              onClick={() => quickLogin('citizen@example.com', 'citizen123')}
              disabled={loading}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-left text-sm hover:bg-gray-50 transition disabled:opacity-50"
            >
              <span className="font-medium text-gray-800">👤 ประชาชน</span>
              <span className="ml-2 text-xs text-gray-400">citizen@example.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
