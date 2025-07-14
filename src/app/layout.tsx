import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { ModalProvider } from "@/context/ModalContext";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "@/components/layout/Layout";

import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import WebhookScheduler from "@/components/WebhookScheduler";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Raising My Rescue",
  description: "Dog training and behavioural consultation management system",
  manifest: "/manifest.json",
  themeColor: "#6B8E6B",
  verification: {
    google: "uPAjKkMG_J459-n-zzLhlk1cueNgGUOce54k_psV15c",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    notranslate: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      noarchive: true,
      nosnippet: true,
      notranslate: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Raising My Rescue",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Raising My Rescue",
    title: "Raising My Rescue",
    description: "Dog training and behavioural consultation management system",
  },
  twitter: {
    card: "summary",
    title: "Raising My Rescue",
    description: "Dog training and behavioural consultation management system",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Raising My Rescue" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Raising My Rescue" />
        <meta name="description" content="Dog training and behavioural consultation management system" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#6B8E6B" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#6B8E6B" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />

        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/src/app/favicon.ico" />

        {/* Viewport for mobile */}
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <AppProvider>
            <ModalProvider>
              <Layout>
                {children}
              </Layout>
              <ServiceWorkerRegistration />
              <WebhookScheduler />
            </ModalProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
