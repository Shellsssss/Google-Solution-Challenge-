import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';
import ThemeProvider from '@/components/providers/ThemeProvider';
import { Toaster } from '@/components/ui/Toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'JanArogya — AI Cancer Screening for Rural India',
  description:
    'Free AI-powered cancer screening for rural India. Upload a photo, get risk assessment in Hindi, Tamil, Telugu, or English in seconds.',
  keywords: ['cancer screening', 'rural India', 'AI health', 'oral cancer', 'JanArogya'],
  openGraph: {
    title: 'JanArogya — Cancer Screening for Every Indian',
    description: 'Free AI-powered cancer screening. No app needed.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-background-primary text-white`}>
        <ThemeProvider>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
