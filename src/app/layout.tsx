import './globals.css';
import '../styles/mobile.css';
import LayoutClient from './LayoutClient';
import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'SocialSage - Instagram Analytics',
  description: 'AI-powered Instagram analytics and insights platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SocialSage',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    // 'apple-touch-fullscreen': 'yes', // Removed to fix type error
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
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icons/icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/icons/icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/icons/icon-57x57.png" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icons/icon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Theme Color and Mobile Optimization */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-navbutton-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Additional Mobile Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="SocialSage" />
        
        {/* Prevent zoom and ensure proper scaling */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="https://api.instagram.com" />
        <link rel="dns-prefetch" href="https://graph.instagram.com" />
        
        {/* SEO and Social Media Meta Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="SocialSage" />
        <meta name="keywords" content="Instagram analytics, social media analytics, Instagram insights, social media management" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="SocialSage - Instagram Analytics" />
        <meta property="og:description" content="AI-powered Instagram analytics and insights platform" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SocialSage" />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SocialSage - Instagram Analytics" />
        <meta name="twitter:description" content="AI-powered Instagram analytics and insights platform" />
        <meta name="twitter:image" content="/twitter-image.png" />
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Disable automatic phone number detection */}
        <meta name="format-detection" content="telephone=no" />
        
        {/* Canonical URL - Update this with your actual domain */}
        <link rel="canonical" href="https://yourdomain.com" />
      </head>
      <body>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}