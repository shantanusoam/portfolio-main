import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import PageScrollProgress from '@/components/ui/PageScrollProgress';
import CustomCursor from '@/components/ui/CustomCursor';
import StickyCursor from '@/components/ui/stickyCursor/StickyCursor';
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shantanu Portfolio',
  description: 'Making pixel-perfect UIs and robust backends.',
  openGraph: {
    type: 'website',
    siteName: "Shantanu's Portfolio",
    title: "Shantanu's Portfolio",
    description: 'Making pixel-perfect UIs and robust backends.',
    images: [
      {
        url: 'https://0xjoy.tech/logo.png',
      },
    ],
  },
  keywords: [
    'portfolio',
    'Shantanu',
    'soam',
    'Shantanu soam',
    'frontend',
    'react',
    'nextjs',
    'developer',
    'backend',
  ],
  themeColor: '#0d0d0d',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        {/* <CustomCursor/> */}
      <StickyCursor/>
        {/* <PageScrollProgress /> */}
        {children}
      </body>
    </html>
  );
}
