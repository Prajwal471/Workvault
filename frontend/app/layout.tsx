import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";

export const metadata: Metadata = {
  title: "Stellar WorkVault — Freelance Escrow on Soroban",
  description:
    "Lock milestone payments into a Soroban vault. Instant, trustless XLM escrow for freelancers — no middleman, portable on-chain reputation.",
  keywords: ["Stellar", "Soroban", "escrow", "freelance", "XLM", "blockchain"],
  openGraph: {
    title: "Stellar WorkVault",
    description: "Trustless XLM escrow for freelancers built on Soroban",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div aria-hidden className="app-texture">
          <span className="app-blob app-blob-1" />
          <span className="app-blob app-blob-2" />
          <span className="app-blob app-blob-3" />
          <span className="app-blob app-blob-4" />
          <span className="app-grain" />
        </div>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
