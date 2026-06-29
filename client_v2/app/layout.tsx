import type { Metadata } from "next";
import {
  Instrument_Sans,
  Instrument_Serif,
  JetBrains_Mono,
} from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Constant Product Automated Market Maker",
  description:
    "Swap and provide liquidity on a constant-product (x·y=k) Automated Market Maker deployed to Base Sepolia.",
  icons: {
    icon: [`/reason-of-death.png`],
    shortcut: [`/reason-of-death.png`],
    apple: [`/reason-of-death.png`],
  },
  openGraph: {
    title: "Constant Product Automated Market Maker",
    description:
      "Swap and provide liquidity on a constant-product (x·y=k) Automated Market Maker deployed to Base Sepolia.",
    url: `${process.env.NEXT_PUBLIC_APP_URL}`,
    siteName: "Constant Product Automated Market Maker",
    images: [
      {
        url: "/landing.png",
        width: 1200,
        height: 630,
        alt: "Constant Product Automated Market Maker",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Constant Product Automated Market Maker",
    description:
      "Swap and provide liquidity on a constant-product (x·y=k) Automated Market Maker deployed to Base Sepolia.",

    site: "@vishaaltwts",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookies = (await headers()).get("cookie");

  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans antialiased">
        <Providers cookies={cookies}>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
