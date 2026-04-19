import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WaveWatch - Plateforme de Streaming Premium",
  description:
    "Découvrez et streamez des milliers de films, séries TV, animés et contenus exclusifs en haute qualité sur WaveWatch",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <Navigation />
            <main className="min-h-screen bg-background">{children}</main>
            <Footer />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>

        {/* ================= HISTATS ================= */}
        <Script id="histats-init" strategy="afterInteractive">
          {`
            var _Hasync = _Hasync || [];
            _Hasync.push(['Histats.start', '1,4986671,4,0,0,0,00010000']);
            _Hasync.push(['Histats.fasi', '1']);
            _Hasync.push(['Histats.track_hits', '']);

            (function() {
              var hs = document.createElement('script');
              hs.type = 'text/javascript';
              hs.async = true;
              hs.src = '//s10.histats.com/js15_as.js';
              (document.head || document.body).appendChild(hs);
            })();
          `}
        </Script>

        {/* Fallback NOSCRIPT (caché) */}
        <noscript>
          <div style={{ display: "none" }}>
            <a href="/" target="_blank" rel="noreferrer">
              <img
                src="//sstatic1.histats.com/0.gif?4986671&101"
                alt="counter easy hit"
              />
            </a>
          </div>
        </noscript>
        {/* ================= FIN HISTATS ================= */}

        {/* Ahrefs Analytics */}
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="H7U+kFL0zyofiO02zN/tSg"
          strategy="afterInteractive"
          async
        />
      </body>
    </html>
  )
}
