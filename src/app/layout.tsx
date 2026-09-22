import type { Metadata } from 'next';
import './globals.css';
import { StudioLoader } from '@/components/global/StudioLoader';

export const metadata: Metadata = {
  title: 'OmniAnima — Electric Blueprint Animation Studio',
  description: 'High-performance 2D frame-by-frame animation studio with 60 FPS drawing loop, onion skinning, and video remixing.',
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,300..900;1,300..900&family=Bebas+Neue&family=JetBrains+Mono:ital,wght@0,400..700;1,400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-white text-[#212121]">
        <StudioLoader />
        {children}
      </body>
    </html>
  );
}
