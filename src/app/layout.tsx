import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { ModalProvider } from "@/context/ModalContext";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "@/components/layout/Layout";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Raising My Rescue",
  description: "Dog training and behavioral consultation management system",
  manifest: "/manifest.json",
  themeColor: "#4f6749",
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
    description: "Dog training and behavioral consultation management system",
  },
  twitter: {
    card: "summary",
    title: "Raising My Rescue",
    description: "Dog training and behavioral consultation management system",
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
        <meta name="description" content="Dog training and behavioral consultation management system" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#4f6749" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#4f6749" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />

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
              <PWAInstallPrompt />
              <ServiceWorkerRegistration />
            </ModalProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
