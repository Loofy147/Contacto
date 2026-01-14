// app/layout.tsx
/**
 * Root layout component - wraps entire application
 * RED TEAM: Test XSS in metadata, CSP violations, hydration errors
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from '@/lib/query/client';
import { Toaster } from '@/components/ui/toaster';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

/**
 * Static metadata for SEO
 */
export const metadata: Metadata = {
  title: {
    default: 'Contacto - Digital Ecosystem for Algerian Businesses',
    template: '%s | Contacto',
  },
  description: 'Professional directory, API-first POS system, and complete financial services layer for Algerian businesses.',
  keywords: ['Algeria', 'business', 'POS', 'directory', 'payments', 'fintech'],
  authors: [{ name: 'Contacto Team' }],
  creator: 'Contacto',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'fr_DZ',
    url: '/',
    siteName: 'Contacto',
    title: 'Contacto - Digital Ecosystem for Algerian Businesses',
    description: 'Professional directory, API-first POS system, and complete financial services layer.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Contacto Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contacto - Digital Ecosystem for Algerian Businesses',
    description: 'Professional directory, API-first POS system, and complete financial services layer.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
};

/**
 * Root layout component
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Security headers via meta tags */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />

        {/* Preconnect to improve performance */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryClientProvider client={queryClient}>
          {/* Main application content */}
          <div id="app-root" className="min-h-screen bg-gray-50">
            {children}
          </div>

          {/* Toast notifications */}
          <Toaster />

          {/* React Query DevTools (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>

        {/* Portal mount point for modals */}
        <div id="modal-root" />

        {/* Portal mount point for tooltips */}
        <div id="tooltip-root" />
      </body>
    </html>
  );
}