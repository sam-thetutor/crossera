import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingPlaygroundButton } from "@/components/playground/FloatingPlaygroundButton";
import { NetworkWarning } from "@/components/shared/NetworkWarning";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CrossEra - CrossFi Reward System",
  description: "A complete blockchain-based reward system for CrossFi applications",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
            <Providers>
              <NetworkWarning />
              <Navbar />
              {children}
              <Footer />
              <FloatingPlaygroundButton />
            </Providers>
      </body>
    </html>
  );
}
