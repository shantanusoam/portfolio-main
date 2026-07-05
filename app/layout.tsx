import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import PageScrollProgress from '@/components/ui/PageScrollProgress';
import CustomCursor from '@/components/ui/CustomCursor';
import { displayFont, dataFont } from '@/lib/fonts';
import SmoothScrollProvider from '@/components/providers/SmoothScrollProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Shantanu Soam — Creative Systems Engineer",
  description:
    'A creative systems engineer building fast software, playful interfaces, AI tools, and hardware experiments.',
  openGraph: {
    type: 'website',
    siteName: "Shantanu Soam's Portfolio",
    title: 'Shantanu Soam — Creative Systems Engineer',
    description:
      'A creative systems engineer building fast software, playful interfaces, AI tools, and hardware experiments.',
    images: [
      {
        url: 'https://portfolio-main-jkzj-git-main-shantanusoams-projects.vercel.app/logo.png',
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
      <body className={`${inter.className} ${displayFont.variable} ${dataFont.variable}`}>
        {/* <CustomCursor/> */}

        <PageScrollProgress />
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
