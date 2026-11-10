import type { Metadata, Viewport } from "next";
import "@fontsource-variable/figtree";
import "@fontsource-variable/fraunces";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { PwaRegister } from "@/components/shell/pwa-register";

export const metadata: Metadata = {
  title: { default: "KG Music", template: "%s · KG Music" },
  description: "Evidenca ur za učiteljico klavirja in petja.",
  applicationName: "KG Music",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "KG Music", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f5f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0f161b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl">
      <body>
        <ToastProvider>{children}</ToastProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
