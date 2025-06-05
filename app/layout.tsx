import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MCP Matcher",
  description: "Compare and configure MCP servers side by side",
  openGraph: {
    title: "MCP Matcher",
    description: "Compare and configure MCP servers side by side",
    url: "https://mcp-match.vercel.app",
    siteName: "MCP Matcher",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "MCP Matcher - Compare and configure MCP servers",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Matcher",
    description: "Compare and configure MCP servers side by side",
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
