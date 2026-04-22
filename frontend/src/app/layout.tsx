import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { DotDistortionBackground } from "@/components/DotDistortionBackground";
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
  title: "AXIOM | Command Center",
  description: "Advanced Cross-Platform Prediction Market Arbitrage System",
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
          <DotDistortionBackground />
          {/* Radial gradient vignette */}
          <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,5,5,0.9)_80%)] z-0" />
          {/* Content */}
          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  );
}
