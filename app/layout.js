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
  metadataBase: new URL('https://www.uni-grind.com'),
  title: 'UniGrind — Study Tracker for University Students',
    description: 'Track your study hours with friends, see your unit breakdown, and stay accountable.',  openGraph: {
    title: 'UniGrind — Study Tracker for University Students',
    description: 'Track your study hours, compete on the leaderboard, and see your unit breakdown.',
    url: 'https://www.uni-grind.com',
    siteName: 'UniGrind',
    images: [{
      url: ['https://www.uni-grind.com/opengraph-image?v=2'],
      width: 1200,
      height: 630,
    }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UniGrind',
    description: 'Study tracker for university students. Track hours, stay accountable, see where your time goes.',
    images: ['https://www.uni-grind.com/opengraph-image?v=2'],
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