import { Inter, Fira_Code } from 'next/font/google';
import { Metadata, Viewport } from 'next';

import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import { TailwindIndicator } from '@/components/dev/TailwindIndicator';

import './globals.css';

// Font configuration
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira-code',
  display: 'swap',
});

// Metadata configuration
export const metadata: Metadata = {
  title: {
    default: 'Carbon Offset Marketplace 2.0',
    template: '%s | Carbon Offset Marketplace 2.0',
  },
  description: 'Trade verified carbon credits on Aptos blockchain with AI-powered emission tracking and IoT verification.',
  keywords: [
    'carbon credits',
    'carbon offset',
    'blockchain',
    'aptos',
    'sustainability',
    'climate change',
    'emission tracking',
    'IoT verification',
    'AI emissions',
    'green technology',
    'carbon marketplace',
    'environmental impact',
  ],
  authors: [
    {
      name: 'Carbon Marketplace Team',
      url: 'https://carbonmarketplace.com',
    },
  ],
  creator: 'Carbon Marketplace Team',
  publisher: 'Carbon Marketplace',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'Carbon Offset Marketplace 2.0',
    description: 'Trade verified carbon credits on Aptos blockchain with AI-powered emission tracking and IoT verification.',
    siteName: 'Carbon Offset Marketplace 2.0',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Carbon Offset Marketplace 2.0 - Blockchain Carbon Credits',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Carbon Offset Marketplace 2.0',
    description: 'Trade verified carbon credits on Aptos blockchain with AI-powered emission tracking and IoT verification.',
    creator: '@CarbonMarket',
    images: [`${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`],
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
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
  },
};

// Viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${firaCode.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />

        {/* Favicon and app icons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

        {/* Manifest for PWA */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme color */}
        <meta name="theme-color" content="#22c55e" />
        <meta name="msapplication-TileColor" content="#22c55e" />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://api.carbonmarketplace.com" />

        {/* DNS prefetch for better performance */}
        <link rel="dns-prefetch" href="//carbonmarketplace.com" />
        <link rel="dns-prefetch" href="//api.carbonmarketplace.com" />

        {/* Security headers via meta tags */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />

        {/* Performance hints */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />

        {/* Environment-specific analytics */}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}', {
                    page_title: document.title,
                    page_location: window.location.href,
                  });
                `,
              }}
            />
          </>
        )}
      </head>

      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            {/* Header */}
            <Header />

            {/* Main content area */}
            <main className="flex-1">
              {children}
            </main>

            {/* Footer */}
            <Footer />
          </div>

          {/* Global toast notifications */}
          <Toaster />

          {/* Development helpers */}
          {process.env.NODE_ENV === 'development' && <TailwindIndicator />}
        </Providers>

        {/* Service Worker registration */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.register('/sw.js')
                    .then((registration) => console.log('SW registered:', registration))
                    .catch((error) => console.log('SW registration failed:', error));
                }
              `,
            }}
          />
        )}

        {/* Anti-flicker snippet for A/B testing */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(a,s,y,n,c,h,i,d,e){s.className+=' '+y;h.start=1*new Date;
              h.end=i=function(){s.className=s.className.replace(RegExp(' ?'+y),'')};
              (a[n]=a[n]||[]).hide=h;setTimeout(function(){i();h.end=null},c);h.timeout=c;
              })(window,document.documentElement,'async-hide','dataLayer',4000,
              {'${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}':true});
            `,
          }}
        />
      </body>
    </html>
  );
}