import type { Metadata } from "next";

const userPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Book Ride",
  description:
    "Book a ride, view driver details, share OTP, and submit review or complaint after the trip.",
  url: `${process.env.NEXT_PUBLIC_APP_URL || "https://rido-booking.vercel.app"}/user`,
  isPartOf: {
    "@type": "WebSite",
    name: "RIDO BOOKING",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://rido-booking.vercel.app",
  },
  about: {
    "@type": "Service",
    name: "Ride Booking",
    provider: {
      "@type": "Organization",
      name: "RIDO BOOKING",
    },
  },
};

export const metadata: Metadata = {
  title: "Book Ride",
  description:
    "Book a ride, track driver details, verify trip OTP, and manage completed ride feedback on RIDO BOOKING.",
  alternates: {
    canonical: "/user",
  },
  openGraph: {
    title: "Book Ride | RIDO BOOKING",
    description:
      "Book a ride, track driver details, verify trip OTP, and manage completed ride feedback on RIDO BOOKING.",
    url: "/user",
    type: "website",
  },
};

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(userPageJsonLd) }}
      />
      {children}
    </>
  );
}
