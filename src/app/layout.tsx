import type { Metadata } from 'next';
import './globals.css';
import { StudioLoader } from '@/components/global/StudioLoader';

export const metadata: Metadata = {
  title: 'OmniAnima — Professional 2D Web Animation Studio',
  description: 'High-performance frame-by-frame 2D animation in your browser. Zero input lag, multi-layer onion skinning, cloud autosave, and universal video export.',
  icons: {
    icon: '/logo.png',
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
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Work+Sans:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-[#f8fafc] text-[#0f172a] font-['Work_Sans',sans-serif]">
        <StudioLoader />
        {children}
      </body>
    </html>
  );
}
