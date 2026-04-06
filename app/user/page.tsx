"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const DEFAULT_CENTER: [number, number] = [77.1025, 28.7041];

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    if (!maptilerKey) {
      setMapError(
        "Map configuration is missing. Add NEXT_PUBLIC_MAPTILER_KEY to your environment and restart the dev server.",
      );
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${maptilerKey}`,
      center: DEFAULT_CENTER,
      zoom: 12,
    });

    mapRef.current = map;

    const markerElement = document.createElement("div");
    markerElement.style.width = "18px";
    markerElement.style.height = "18px";
    markerElement.style.borderRadius = "9999px";
    markerElement.style.backgroundColor = "#ef4444";
    markerElement.style.border = "3px solid white";
    markerElement.style.boxShadow = "0 0 0 2px rgba(0, 0, 0, 0.15)";

    const marker = new maplibregl.Marker(markerElement)
      .setLngLat(DEFAULT_CENTER)
      .addTo(map);

    const intervalId = window.setInterval(() => {
      const newLng = 77.10 + Math.random() * 0.02;
      const newLat = 28.70 + Math.random() * 0.02;

      marker.setLngLat([newLng, newLat]);
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
      marker.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [maptilerKey]);

  if (mapError) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p>{mapError}</p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      style={{ width: "100%", height: "100vh" }}
    />
  );
}
