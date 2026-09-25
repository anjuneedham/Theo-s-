import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/manrope";
import "./globals.css";
import { config } from "@/lib/config";
import { Toaster } from "@/components/ui/toast";
import { PageViewTracker } from "@/components/site/page-view-tracker";
import { ServiceWorkerRegister } from "@/components/site/sw-register";

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: "Theo's Restaurant & Lounge — Jamaican Restaurant, Lounge & Delivery in Kingston",
    template: "%s · Theo's Restaurant & Lounge",
  },
  description:
    "Jerk chicken, oxtail, escovitch fish and handcrafted rum cocktails. Order online from Theo's Restaurant & Lounge for pickup or delivery in Kingston, Jamaica.",
  applicationName: "Theo's",
  keywords: ["Theo's", "Jamaican restaurant", "Kingston restaurant", "jerk chicken delivery", "lounge Kingston", "order online Jamaica", "food delivery Kingston"],
  openGraph: {
    type: "website",
    siteName: "Theo's Restaurant & Lounge",
    locale: "en_JM",
    title: "Theo's Restaurant & Lounge",
    description: "Island soul food by day, lounge by night. Order online for pickup or delivery.",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "Theo's", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  themeColor: "#1a1310",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-JM">
      <body className="min-h-dvh">
        {children}
        <Toaster />
        <PageViewTracker />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
