import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistrar } from "./sw-register";

export const metadata: Metadata = {
  title: "Pinara",
  description:
    "A pineal-gland-centred practice instrument. Live-composed sessions that respond to your biology and the cosmos.",
  applicationName: "Pinara",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.svg", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "Pinara",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    title: "Pinara",
    description: "A pineal-gland-centred practice instrument.",
    url: "https://pinara.app",
    siteName: "Pinara",
    type: "website",
  },
  metadataBase: new URL("https://pinara.app"),
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {PLAUSIBLE_DOMAIN ? (
          <script
            defer
            data-domain={PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
          />
        ) : null}
      </head>
      <body className="bg-chamber text-lunar-silver antialiased">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
