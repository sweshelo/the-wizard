import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { GlobalContextProvider } from '@/hooks';
import { AuthProvider } from '@/hooks/auth';
import { DeckProvider } from '@/hooks/deck';
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | The Fool',
    absolute: 'The Fool',
  },
  description: 'CODE OF JOKER Simulator',
  keywords: ['CODE OF JOKER', 'COJ', 'コード・オブ・ジョーカー', 'コードオブジョーカー'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <Analytics />
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <DeckProvider>
            <GlobalContextProvider>{children}</GlobalContextProvider>
          </DeckProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
