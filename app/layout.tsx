import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import {NavProvider} from "@/app/context/Context"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://rido-booking.vercel.app",
  ),
  title: {
    default: "RIDO BOOKING",
    template: "%s | RIDO BOOKING",
  },
  description:
    "RIDO BOOKING is a ride booking app for riders and drivers with live trip flow, OTP verification, and post-ride feedback.",
  applicationName: "RIDO BOOKING",
  keywords: [
    "ride booking",
    "cab booking",
    "driver dashboard",
    "trip otp",
    "rider app",
    "RIDO BOOKING",
  ],
  openGraph: {
    title: "RIDO BOOKING",
    description:
      "Ride booking app with rider flow, driver acceptance, OTP verification, and completed trip feedback.",
    type: "website",
    siteName: "RIDO BOOKING",
  },
  twitter: {
    card: "summary_large_image",
    title: "RIDO BOOKING",
    description:
      "Ride booking app with rider flow, driver acceptance, OTP verification, and completed trip feedback.",
  },
  icons: {
    icon: "/favicon-image.png",
    shortcut: "/favicon-image.png",
    apple: "/favicon-image.png",
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
      </body>
    </html>
  );
}
