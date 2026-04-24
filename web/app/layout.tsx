import type { Metadata } from 'next';
import { Nunito, Noto_Sans } from 'next/font/google';
import dynamic from 'next/dynamic';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';

const FloatingChat = dynamic(() => import('@/components/shared/FloatingChat'), { ssr: false });

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
  weight: ['400', '600', '700', '800'],
});

const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-noto',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'JanArogya — Free Cancer Check',
  description:
    'Take a photo of your mouth or skin. Get a free cancer screening result in Hindi, Tamil, Telugu, or English. Works offline. No cost ever.',
  keywords: ['cancer screening', 'rural India', 'free health check', 'oral cancer', 'JanArogya'],
  openGraph: {
    title: 'JanArogya — Free Cancer Check for Every Indian',
    description: 'Free. Offline. In your language. Takes under 1 minute.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${notoSans.variable}`}>
      <body>
        <QueryProvider>
          {children}
          <FloatingChat />
        </QueryProvider>
      </body>
    </html>
  );
}
