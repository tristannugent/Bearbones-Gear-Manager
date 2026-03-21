import './globals.css';
import type { Metadata } from 'next';
import { brand } from '@/lib/brand';

export const metadata: Metadata = {
  title: `${brand.appName}`,
  description: brand.tagline,
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cinematic">{children}</body>
    </html>
  );
}
