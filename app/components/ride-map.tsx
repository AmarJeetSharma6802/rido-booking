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
  vehicleTarget?: MapPoint | null;
  animateVehicleKey?: string | null;
  className?: string;
}

interface OsrmRouteResponse {
  routes?: Array<{
    geometry?: {
      coordinates?: [number, number][];
    };
  }>;
}

const DEFAULT_CENTER: [number, number] = [77.1025, 28.7041];
const ROUTE_SOURCE_ID = "ride-route-source";
const ROUTE_LAYER_ID = "ride-route-layer";
const ROUTE_CASE_SOURCE_ID = "ride-route-case-source";
const ROUTE_CASE_LAYER_ID = "ride-route-case-layer";
const OSRM_URL = process.env.NEXT_PUBLIC_OSRM_URL ?? "https://router.project-osrm.org";
const OSM_FALLBACK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
};

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

function isReasonableMapPoint(point: MapPoint & { lat: number; lng: number }) {
  return point.lat >= -85 && point.lat <= 85 && point.lng >= -180 && point.lng <= 180;
}

function routeFeature(coordinates: [number, number][]) {
  return {
    type: "Feature" as const,
    geometry: {
      type: "LineString" as const,
      coordinates,
    },
    properties: {},
  };
}

async function fetchRoadRoute(from: MapPoint, to: MapPoint) {
  if (!hasCoordinates(from) || !hasCoordinates(to)) return [];

  try {
    const response = await fetch(
      `${OSRM_URL}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`,
    );
    const result = (await response.json()) as OsrmRouteResponse;
    const coordinates = result.routes?.[0]?.geometry?.coordinates;

    if (coordinates?.length) {
      return coordinates;
    }
  } catch {
    // Road routing is best-effort; fallback keeps the map usable.
  }

  return [
    [from.lng, from.lat],
    [to.lng, to.lat],
  ] satisfies [number, number][];
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
  marker.style.width = "54px";
  marker.style.height = "54px";
  marker.style.display = "grid";
  marker.style.placeItems = "center";
  marker.style.willChange = "transform";
  marker.title = label;
  marker.innerHTML = `
    <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="27" cy="27" r="25" fill="#6D28D9" fill-opacity="0.9"/>
      <path d="M15.5 31.5V24.5C15.5 23.34 16.08 22.26 17.05 21.63L20.95 19.1C21.96 18.44 23.13 18.1 24.34 18.1H29.66C30.87 18.1 32.04 18.44 33.05 19.1L36.95 21.63C37.92 22.26 38.5 23.34 38.5 24.5V31.5C38.5 32.33 37.83 33 37 33H36.05C35.5 33 35.03 32.63 34.89 32.1L34.55 30.8H19.45L19.11 32.1C18.97 32.63 18.5 33 17.95 33H17C16.17 33 15.5 32.33 15.5 31.5Z" fill="#F5D0FE"/>
      <rect x="20.5" y="21.2" width="13" height="5.7" rx="1.8" fill="#E0F2FE"/>
      <circle cx="21.9" cy="33.7" r="3.2" fill="#F8FAFC"/>
      <circle cx="32.1" cy="33.7" r="3.2" fill="#F8FAFC"/>
      <circle cx="21.9" cy="33.7" r="1.5" fill="#0F172A"/>
      <circle cx="32.1" cy="33.7" r="1.5" fill="#0F172A"/>
    </svg>
  `;
  return marker;
}

function ensureRouteLayers(map: maplibregl.Map, coordinates: [number, number][]) {
  const data = routeFeature(coordinates);

  if (map.getSource(ROUTE_SOURCE_ID)) {
    (map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource).setData(data);
    (map.getSource(ROUTE_CASE_SOURCE_ID) as maplibregl.GeoJSONSource).setData(data);
    return;
  }

  map.addSource(ROUTE_CASE_SOURCE_ID, {
    type: "geojson",
    data,
  });
  map.addSource(ROUTE_SOURCE_ID, {
    type: "geojson",
    data,
  });

  map.addLayer({
    id: ROUTE_CASE_LAYER_ID,
    type: "line",
    source: ROUTE_CASE_SOURCE_ID,
    paint: {
      "line-color": "#ffffff",
      "line-width": 9,
      "line-opacity": 0.95,
    },
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
  });

  map.addLayer({
    id: ROUTE_LAYER_ID,
    type: "line",
    source: ROUTE_SOURCE_ID,
    paint: {
      "line-color": "#7c3aed",
      "line-width": 5,
      "line-opacity": 0.95,
    },
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
  });
}

function removeRouteLayers(map: maplibregl.Map) {
  if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
  if (map.getLayer(ROUTE_CASE_LAYER_ID)) map.removeLayer(ROUTE_CASE_LAYER_ID);
  if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
  if (map.getSource(ROUTE_CASE_SOURCE_ID)) map.removeSource(ROUTE_CASE_SOURCE_ID);
}

export default function RideMap({
  pickup,
  destination,
  vehicle,
  vehicleTarget,
  animateVehicleKey,
  className,
}: RideMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const pickupMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destinationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const vehicleMarkerRef = useRef<maplibregl.Marker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: maptilerKey
        ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}`
        : OSM_FALLBACK_STYLE,
      center: DEFAULT_CENTER,
      zoom: 12,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      pickupMarkerRef.current?.remove();
      destinationMarkerRef.current?.remove();
      vehicleMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [maptilerKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let cancelled = false;

    const renderScene = async () => {
      const render = async () => {
        const bounds = new maplibregl.LngLatBounds();

        if (hasCoordinates(pickup) && isReasonableMapPoint(pickup)) {
          if (!pickupMarkerRef.current) {
            pickupMarkerRef.current = new maplibregl.Marker({
              element: createCircleMarker("#7c3aed", pickup.label),
            }).addTo(map);
          }
          pickupMarkerRef.current.setLngLat([pickup.lng, pickup.lat]);
          bounds.extend([pickup.lng, pickup.lat]);
        } else {
          pickupMarkerRef.current?.remove();
          pickupMarkerRef.current = null;
        }

        if (hasCoordinates(destination) && isReasonableMapPoint(destination)) {
          if (!destinationMarkerRef.current) {
            destinationMarkerRef.current = new maplibregl.Marker({
              element: createCircleMarker("#ec4899", destination.label),
            }).addTo(map);
          }
          destinationMarkerRef.current.setLngLat([destination.lng, destination.lat]);
          bounds.extend([destination.lng, destination.lat]);
        } else {
          destinationMarkerRef.current?.remove();
          destinationMarkerRef.current = null;
        }

        if (hasCoordinates(vehicle) && isReasonableMapPoint(vehicle)) {
          if (!vehicleMarkerRef.current) {
            vehicleMarkerRef.current = new maplibregl.Marker({
              element: createVehicleMarker(vehicle.label),
              anchor: "center",
            }).addTo(map);
          }
          vehicleMarkerRef.current.setLngLat([vehicle.lng, vehicle.lat]);
          bounds.extend([vehicle.lng, vehicle.lat]);
        } else {
          vehicleMarkerRef.current?.remove();
          vehicleMarkerRef.current = null;
        }

        if (hasCoordinates(pickup) && hasCoordinates(destination)) {
          const routeCoordinates = await fetchRoadRoute(pickup, destination);

          if (cancelled) return;

          ensureRouteLayers(map, routeCoordinates);
          routeCoordinates.forEach((coordinate) => bounds.extend(coordinate));
        } else {
          removeRouteLayers(map);
        }

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, {
            padding: 82,
            maxZoom: 15,
            duration: 700,
          });
        }
      };

      if (!map.isStyleLoaded()) {
        map.once("load", render);
        return;
      }

      await render();
    };

    renderScene();

    return () => {
      cancelled = true;
    };
  }, [destination, pickup, vehicle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasCoordinates(vehicle) || !hasCoordinates(vehicleTarget)) return;

    let cancelled = false;

    const animateVehicle = async () => {
      const coordinates = await fetchRoadRoute(vehicle, vehicleTarget);

      if (cancelled || coordinates.length < 2) return;

      if (!vehicleMarkerRef.current) {
        vehicleMarkerRef.current = new maplibregl.Marker({
          element: createVehicleMarker(vehicle.label),
          anchor: "center",
        }).addTo(map);
      }

      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      const startedAt = performance.now();
      const duration = 12000;

      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const routeIndex = Math.min(
          Math.floor(progress * (coordinates.length - 1)),
          coordinates.length - 1,
        );
        const coordinate = coordinates[routeIndex];

        vehicleMarkerRef.current?.setLngLat(coordinate);

        if (progress < 1 && !cancelled) {
          animationFrameRef.current = window.requestAnimationFrame(tick);
        }
      };

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    animateVehicle();

    return () => {
      cancelled = true;
    };
  }, [animateVehicleKey, vehicle, vehicleTarget]);

  return (
    <div
      ref={mapContainer}
      className={className ?? "min-h-[420px] rounded-3xl"}
    />
  );
}
