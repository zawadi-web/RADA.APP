import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { AppClientShell } from "@/components/layout/AppClientShell";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rada | Know the intention before you catch feelings",
  description: "Kenya's intentional dating platform for singles who value real connections, clear intentions, and authentic Nairobi vibes.",
  keywords: ["dating kenya", "nairobi singles", "intentional dating", "rada app", "kenyan dating"],
  authors: [{ name: "Rada" }],
  applicationName: "Rada",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rada",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('rada_theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();function registerSW(){if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js',{scope:'/'}).then(function(reg){if(reg.waiting){reg.waiting.postMessage({type:'SKIP_WAITING'});}}).catch(function(err){console.warn('[Rada PWA] SW error:',err);});}}if(document.readyState==='complete'||document.readyState==='interactive'){registerSW();}else{window.addEventListener('DOMContentLoaded',registerSW);window.addEventListener('load',registerSW);}window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.deferredPWAInstallPrompt=e;window.dispatchEvent(new CustomEvent('pwa-prompt-ready',{detail:e}));});window.addEventListener('appinstalled',function(){window.deferredPWAInstallPrompt=null;window.dispatchEvent(new CustomEvent('pwa-installed'));});`,
          }}
        />
      </head>
      <body>
        <div className="rada-app-container">
          <AppClientShell>
            {children}
          </AppClientShell>
        </div>
      </body>
    </html>
  );
}
