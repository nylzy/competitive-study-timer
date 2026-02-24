import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'UniGrind — Study Tracker for University Students',
  description: 'Track your study hours, compete on the leaderboard, and see your unit breakdown.',
  openGraph: {
    title: 'UniGrind — Study Tracker for University Students',
    description: 'Track your study hours, compete on the leaderboard, and see your unit breakdown.',
    url: 'https://uni-grind.com',
    siteName: 'UniGrind',
    images: [{
      url: 'https://uni-grind.com/opengraph-image',
      width: 1200,
      height: 630,
    }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UniGrind',
    description: 'Competitive study tracker for university students.',
    images: ['https://uni-grind.com/opengraph-image'],
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}