"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapPoint {
  label: string;
  lat: number | null;
  lng: number | null;
}

interface RideMapProps {
  pickup?: MapPoint | null;
  destination?: MapPoint | null;
  vehicle?: MapPoint | null;
  className?: string;
}

const DEFAULT_CENTER: [number, number] = [77.1025, 28.7041];
const ROUTE_SOURCE_ID = "ride-route-source";
const ROUTE_LAYER_ID = "ride-route-layer";

function hasCoordinates(
  point?: MapPoint | null,
): point is MapPoint & { lat: number; lng: number } {
  return Boolean(
    point &&
      typeof point.lat === "number" &&
      !Number.isNaN(point.lat) &&
      typeof point.lng === "number" &&
      !Number.isNaN(point.lng),
  );
}

function createCircleMarker(color: string, label: string) {
  const marker = document.createElement("div");
  marker.style.width = "18px";
  marker.style.height = "18px";
  marker.style.borderRadius = "9999px";
  marker.style.background = color;
  marker.style.border = "3px solid #ffffff";
  marker.style.boxShadow = "0 10px 20px rgba(88, 28, 135, 0.28)";
  marker.title = label;
  return marker;
}

function createVehicleMarker(label: string) {
  const marker = document.createElement("div");
  marker.style.width = "52px";
  marker.style.height = "52px";
  marker.style.display = "grid";
  marker.style.placeItems = "center";
  marker.title = label;
  marker.innerHTML = `
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="26" cy="26" r="24" fill="#6D28D9" fill-opacity="0.88"/>
      <path d="M15 30.5V23.8C15 22.7 15.55 21.68 16.47 21.08L20.2 18.66C21.16 18.03 22.28 17.7 23.43 17.7H28.57C29.72 17.7 30.84 18.03 31.8 18.66L35.53 21.08C36.45 21.68 37 22.7 37 23.8V30.5C37 31.33 36.33 32 35.5 32H34.6C34.05 32 33.58 31.63 33.44 31.1L33.1 29.8H18.9L18.56 31.1C18.42 31.63 17.95 32 17.4 32H16.5C15.67 32 15 31.33 15 30.5Z" fill="#F5D0FE"/>
      <rect x="19.5" y="20.8" width="13" height="5.7" rx="1.8" fill="#E0F2FE"/>
      <circle cx="20.8" cy="32.6" r="3.1" fill="#F8FAFC"/>
      <circle cx="31.2" cy="32.6" r="3.1" fill="#F8FAFC"/>
      <circle cx="20.8" cy="32.6" r="1.5" fill="#0F172A"/>
      <circle cx="31.2" cy="32.6" r="1.5" fill="#0F172A"/>
    </svg>
  `;
  return marker;
}

export default function RideMap({
  pickup,
  destination,
  vehicle,
  className,
}: RideMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  const mapError = maptilerKey
    ? null
    : "NEXT_PUBLIC_MAPTILER_KEY missing hai. Env add karke dev server restart karo.";

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    if (!maptilerKey) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}`,
      center: DEFAULT_CENTER,
      zoom: 11,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [maptilerKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const renderScene = () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      const bounds = new maplibregl.LngLatBounds();

      if (hasCoordinates(pickup)) {
        const marker = new maplibregl.Marker({
          element: createCircleMarker("#7c3aed", pickup.label),
        })
          .setLngLat([pickup.lng, pickup.lat])
          .addTo(map);
        markersRef.current.push(marker);
        bounds.extend([pickup.lng, pickup.lat]);
      }

      if (hasCoordinates(destination)) {
        const marker = new maplibregl.Marker({
          element: createCircleMarker("#ec4899", destination.label),
        })
          .setLngLat([destination.lng, destination.lat])
          .addTo(map);
        markersRef.current.push(marker);
        bounds.extend([destination.lng, destination.lat]);
      }

      if (hasCoordinates(vehicle)) {
        const marker = new maplibregl.Marker({
          element: createVehicleMarker(vehicle.label),
          anchor: "center",
        })
          .setLngLat([vehicle.lng, vehicle.lat])
          .addTo(map);
        markersRef.current.push(marker);
        bounds.extend([vehicle.lng, vehicle.lat]);
      }

      if (map.getLayer(ROUTE_LAYER_ID)) {
        map.removeLayer(ROUTE_LAYER_ID);
      }

      if (map.getSource(ROUTE_SOURCE_ID)) {
        map.removeSource(ROUTE_SOURCE_ID);
      }

      if (hasCoordinates(pickup) && hasCoordinates(destination)) {
        map.addSource(ROUTE_SOURCE_ID, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [pickup.lng, pickup.lat],
                [destination.lng, destination.lat],
              ],
            },
            properties: {},
          },
        });

        map.addLayer({
          id: ROUTE_LAYER_ID,
          type: "line",
          source: ROUTE_SOURCE_ID,
          paint: {
            "line-color": "#8b5cf6",
            "line-width": 5,
            "line-opacity": 0.9,
          },
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
        });
      }

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: 64,
          maxZoom: 14,
          duration: 800,
        });
      } else {
        map.flyTo({
          center: DEFAULT_CENTER,
          zoom: 11,
          duration: 700,
        });
      }
    };

    if (!map.isStyleLoaded()) {
      map.once("load", renderScene);
      return;
    }

    renderScene();
  }, [pickup, destination, vehicle]);

  if (mapError) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-3xl bg-slate-950/90 p-6 text-center text-sm text-white">
        <p>{mapError}</p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className={className ?? "min-h-[420px] rounded-3xl"}
    />
  );
}
