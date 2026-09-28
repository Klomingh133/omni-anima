import type { Metadata } from 'next';
import { Archivo, Bebas_Neue, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { StudioLoader } from '@/components/global/StudioLoader';

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s // OMNIANIMA',
    default: 'OMNIANIMA. Electric Blueprint Animation Studio',
  },
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
    <html
      lang="en"
      className={`${archivo.variable} ${bebasNeue.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased min-h-screen bg-white text-[#212121] font-body">
        <StudioLoader />
        {children}
      </body>
    </html>
  );
}
