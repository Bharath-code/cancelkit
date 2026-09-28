import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const body = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://cancelkit.com"),
  title: "CancelKit — Catch the cancel. Never trap it.",
  description:
    "One fair offer between your cancel button and Stripe — a pause or a discount — with “cancel anyway” always one click away. If CancelKit fails, your button still works.",
  openGraph: {
    title: "Catch the cancel. Never trap it.",
    description:
      "A cancel flow for Stripe that saves some subscribers, blocks none, and fails open.",
    siteName: "CancelKit",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${body.variable} ${display.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
