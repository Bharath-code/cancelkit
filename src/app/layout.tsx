import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://cancelkit.com"),
  title: "CancelKit — Your cancel button fires instantly. Fix that in 5 minutes.",
  description:
    "CancelKit turns cancel clicks into pauses, discounts, and exit feedback. One script tag. $39/mo. One saved customer pays for the year.",
  openGraph: {
    title: "Your cancel button fires instantly. Fix that in 5 minutes.",
    description:
      "CancelKit turns cancel clicks into pauses, discounts, and exit feedback. One script tag. $39/mo.",
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
