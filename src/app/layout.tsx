import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const siteUrl = 'https://tcg-signals.vercel.app'

export const metadata: Metadata = {
  title: {
    default: 'TCGSignals - Real-Time TCG Price Tracking',
    template: '%s | TCGSignals',
  },
  description: 'Track Pokemon and One Piece card prices in real-time. Price history, top movers, set values, and market data for 21,000+ cards.',
  keywords: ['TCG', 'Pokemon cards', 'One Piece cards', 'card prices', 'price tracking', 'trading card games', 'TCGSignals'],
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'TCGSignals - Real-Time TCG Price Tracking',
    description: 'Track Pokemon and One Piece card prices in real-time. 21,000+ cards with price history and market data.',
    url: siteUrl,
    siteName: 'TCGSignals',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TCGSignals - Real-Time TCG Price Tracking',
    description: 'Track Pokemon and One Piece card prices in real-time. 21,000+ cards with price history and market data.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
