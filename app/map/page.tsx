"use client";

import RideMap from "@/app/components/ride-map";

export default function MapPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl rounded-[32px] bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <RideMap
          pickup={{ label: "Pickup", lat: 28.7041, lng: 77.1025 }}
          destination={{ label: "Destination", lat: 28.6139, lng: 77.209 }}
          vehicle={{ label: "Cab", lat: 28.6584, lng: 77.1432 }}
          className="min-h-[78vh] rounded-[28px]"
        />
      </div>
    </main>
  );
}
