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
  title: "ChatU - Real-time Chat",
  description: "A fast, real-time chat application.",
  icons: {
    icon: '/logo.png',
  },
  openGraph: {
    title: "ChatU - Real-time Chat",
    description: "Join a room and start chatting instantly.",
    siteName: "ChatU",
    type: "website",
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'ChatU Logo',
      }
    ]
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
