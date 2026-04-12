"use client";

import dynamic from "next/dynamic";

export interface MapPoint {
  label: string;
  lat: number | null;
  lng: number | null;
}

interface RideMapProps {
  pickup?: MapPoint | null;
  destination?: MapPoint | null;
  vehicle?: MapPoint | null;
  vehicleTarget?: MapPoint | null;
  animateVehicleKey?: string | null;
  className?: string;
}

const LeafletRideMap = dynamic(() => import("./ride-map-leaflet-client"), {
  ssr: false,
  loading: () => (
    <div className="relative min-h-[420px] overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_50%,#fdf2f8_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.18),_transparent_34%)]" />
      <div className="absolute left-4 top-4 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-violet-700 shadow-[0_18px_35px_rgba(15,23,42,0.12)] backdrop-blur">
        Loading map
      </div>
    </div>
  ),
});

export default function RideMap(props: RideMapProps) {
  return <LeafletRideMap {...props} />;
}
