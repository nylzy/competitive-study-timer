import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://www.uni-grind.com"),

  title: {
    default: "UniGrind — Study Tracker for University Students",
    template: "%s | UniGrind",
  },

  description:
    "Track your study hours, compete on the leaderboard, and see your unit breakdown.",

  openGraph: {
    title: "UniGrind — Study Tracker for University Students",
    description:
      "Track your study hours, compete on the leaderboard, and see your unit breakdown.",
    url: "/",
    siteName: "UniGrind",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_AU",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "UniGrind — Study Tracker for University Students",
    description:
      "Track your study hours, compete on the leaderboard, and see your unit breakdown.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }) {
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