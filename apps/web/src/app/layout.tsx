import type { Metadata } from 'next';
import { Noto_Sans_Thai } from 'next/font/google';
import '../styles/globals.css';
import { Navbar } from '../components/navbar';

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  variable: '--font-noto-thai',
});

export const metadata: Metadata = {
  title: 'ระบบจัดการสัตว์จรจัด',
  description: 'ระบบจัดการสัตว์จรจัดสำหรับกรุงเทพมหานครและเทศบาล',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={notoSansThai.variable}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
