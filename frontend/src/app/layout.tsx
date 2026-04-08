import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Prediction Arbitrage | Command Center",
  description: "Cross-Platform Prediction Market Arbitrage System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-obsidian text-white antialiased`}
      >
        <div className="relative min-h-screen">
          {/* Ambient background grid */}
          <div className="bg-grid fixed inset-0 pointer-events-none opacity-40" />
          {/* Radial gradient vignette */}
          <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,15,0.8)_70%)]" />
          {/* Content */}
          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  );
}
