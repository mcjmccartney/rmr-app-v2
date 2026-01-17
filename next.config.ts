import type { NextConfig } from "next";
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  // =====================================================
  // IMAGE OPTIMIZATION
  // =====================================================
  images: {
    // Use modern image formats for better compression
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
    ],
    // Optimize image loading
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // =====================================================
  // PRODUCTION OPTIMIZATIONS
  // =====================================================
  // Disable source maps in production for smaller bundles and security
  productionBrowserSourceMaps: false,

  // Optimize package imports to reduce bundle size
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'framer-motion',
      '@supabase/supabase-js',
      '@supabase/auth-ui-react',
      '@supabase/auth-ui-shared',
      'react-chartjs-2',
      'chart.js',
      '@tanstack/react-query',
    ],
  },

  // =====================================================
  // SERVER CONFIGURATION
  // =====================================================
  // Externalize chromium and puppeteer to avoid bundling issues
  serverExternalPackages: [
    '@sparticuz/chromium',
    'puppeteer-core',
    'puppeteer',
  ],

  // =====================================================
  // BUILD CONFIGURATION
  // =====================================================
  // Empty turbopack config to silence Next.js 16 warning about webpack config from next-pwa
  turbopack: {},

  // Compress output for faster loading
  compress: true,
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false, // Enable PWA in all environments
  runtimeCaching: [
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-js-css-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /^\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'apis',
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        },
        networkTimeoutSeconds: 30 // Increased from 10 to 30 seconds
      }
    },
    {
      urlPattern: /.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'others',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        },
        networkTimeoutSeconds: 30 // Increased from 10 to 30 seconds
      }
    }
  ]
})(nextConfig);
