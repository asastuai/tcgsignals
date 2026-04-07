import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TCGSignals — Precios de cartas TCG en tiempo real",
    template: "%s | TCGSignals",
  },
  description:
    "Hub de precios para cartas coleccionables. Pokemon, One Piece y mas. Graficos en tiempo real, ultimo vendido, comparacion entre plataformas.",
  keywords: [
    "tcg",
    "pokemon cards",
    "one piece cards",
    "card prices",
    "trading cards",
    "pokemon tcg prices",
    "one piece tcg prices",
    "booster box prices",
  ],
  metadataBase: new URL("https://tcgsignals.com"),
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "TCGSignals",
    title: "TCGSignals — Precios de cartas TCG en tiempo real",
    description:
      "Hub de precios para cartas coleccionables. Pokemon, One Piece y mas.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TCGSignals",
    description:
      "Precios en tiempo real para tus cartas coleccionables.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border py-8 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 32 32" fill="none" className="opacity-50">
                    <path d="M18.5 4L8 18h7l-1.5 10L24 14h-7l1.5-10z" fill="currentColor" />
                  </svg>
                  <span className="text-sm font-semibold text-text-secondary">TCGSignals</span>
                </div>
                <div className="flex items-center gap-6 text-xs text-text-muted">
                  <a href="#" className="hover:text-text-secondary transition-colors">
                    About
                  </a>
                  <a href="#" className="hover:text-text-secondary transition-colors">
                    API
                  </a>
                  <a href="#" className="hover:text-text-secondary transition-colors">
                    Contacto
                  </a>
                  <a
                    href="https://ko-fi.com/tcgsignals"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent transition-colors font-medium"
                  >
                    Donar
                  </a>
                </div>
              </div>
              <p className="text-center text-[11px] text-text-muted mt-6">
                &copy; 2026 TCGSignals — Precios de referencia, no constituyen consejo financiero.
              </p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
