import type { Metadata } from 'next';
import { IBM_Plex_Mono, Inter, Space_Grotesk } from 'next/font/google';

import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import './globals.css';

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap'
});

const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap'
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap'
});

export const metadata: Metadata = {
  title: {
    default: 'CertiTrack — certification application registry',
    template: '%s · CertiTrack'
  },
  description:
    'Browse sustainability certification schemes, submit an application, and track its review status.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <div id="app-root" className="flex min-h-screen flex-col">
          <AuthProvider>
            <Navbar />
            <div className="flex-1">{children}</div>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
