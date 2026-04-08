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
const ACTIVE_ROUTE_SOURCE_ID = "ride-active-route-source";
const ACTIVE_ROUTE_LAYER_ID = "ride-active-route-layer";
const OSRM_URL = process.env.NEXT_PUBLIC_OSRM_URL ?? "https://router.project-osrm.org";
const OSM_FALLBACK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
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
    // Best effort only; fallback direct line still keeps the UI usable.
  }

  return [
    [from.lng, from.lat],
    [to.lng, to.lat],
  ] satisfies [number, number][];
}

function createCircleMarker(color: string, label: string) {
  const marker = document.createElement("div");
  marker.style.width = "24px";
  marker.style.height = "24px";
  marker.style.borderRadius = "9999px";
  marker.style.background = color;
  marker.style.border = "4px solid #ffffff";
  marker.style.boxShadow = "0 14px 30px rgba(88, 28, 135, 0.24)";
  marker.style.outline = "6px solid rgba(255,255,255,0.32)";
  marker.title = label;
  return marker;
}

function createVehicleMarker(label: string) {
  const marker = document.createElement("div");
  marker.style.width = "66px";
  marker.style.height = "66px";
  marker.style.display = "grid";
  marker.style.placeItems = "center";
  marker.style.willChange = "transform";
  marker.title = label;
  marker.innerHTML = `
    <div data-vehicle-body="true" style="position:relative;display:grid;place-items:center;width:66px;height:66px;transform-origin:center center;transition:transform 180ms linear;">
      <div style="position:absolute;inset:8px;border-radius:9999px;background:rgba(109,40,217,0.18);filter:blur(8px);"></div>
      <svg width="66" height="66" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="33" cy="33" r="29" fill="#ffffff" fill-opacity="0.96"/>
        <circle cx="33" cy="33" r="24" fill="url(#vehicleGradient)"/>
        <path d="M19 38V29.5C19 28.09 19.71 26.79 20.89 26.03L25.48 23.07C26.71 22.28 28.13 21.86 29.6 21.86H36.4C37.87 21.86 39.29 22.28 40.52 23.07L45.11 26.03C46.29 26.79 47 28.09 47 29.5V38C47 39 46.19 39.8 45.2 39.8H44.03C43.37 39.8 42.79 39.36 42.62 38.72L42.22 37.15H23.78L23.38 38.72C23.21 39.36 22.63 39.8 21.97 39.8H20.8C19.81 39.8 19 39 19 38Z" fill="#FDF2F8"/>
        <rect x="24.4" y="25.35" width="17.2" height="7.2" rx="2.2" fill="#DBEAFE"/>
        <circle cx="26.8" cy="40.9" r="4.1" fill="#F8FAFC"/>
        <circle cx="39.2" cy="40.9" r="4.1" fill="#F8FAFC"/>
        <circle cx="26.8" cy="40.9" r="1.9" fill="#0F172A"/>
        <circle cx="39.2" cy="40.9" r="1.9" fill="#0F172A"/>
        <defs>
          <linearGradient id="vehicleGradient" x1="15" y1="13" x2="51" y2="53" gradientUnits="userSpaceOnUse">
            <stop stop-color="#7C3AED" />
            <stop offset="1" stop-color="#D946EF" />
          </linearGradient>
        </defs>
      </svg>
    </div>
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
      "line-width": 10,
      "line-opacity": 0.96,
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
      "line-width": 5.5,
      "line-opacity": 0.95,
      "line-blur": 0.2,
    },
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
  });
}

function ensureActiveRouteLayer(map: maplibregl.Map, coordinates: [number, number][]) {
  const data = routeFeature(coordinates);

  if (map.getSource(ACTIVE_ROUTE_SOURCE_ID)) {
    (map.getSource(ACTIVE_ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource).setData(data);
    return;
  }

  map.addSource(ACTIVE_ROUTE_SOURCE_ID, {
    type: "geojson",
    data,
  });

  map.addLayer({
    id: ACTIVE_ROUTE_LAYER_ID,
    type: "line",
    source: ACTIVE_ROUTE_SOURCE_ID,
    paint: {
      "line-color": "#0f172a",
      "line-width": 4,
      "line-opacity": 0.34,
      "line-dasharray": [1.2, 1.8],
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
  if (map.getLayer(ACTIVE_ROUTE_LAYER_ID)) map.removeLayer(ACTIVE_ROUTE_LAYER_ID);
  if (map.getSource(ACTIVE_ROUTE_SOURCE_ID)) map.removeSource(ACTIVE_ROUTE_SOURCE_ID);
}

function getBearing(from: [number, number], to: [number, number]) {
  const [lng1, lat1] = from;
  const [lng2, lat2] = to;
  const y = Math.sin((lng2 - lng1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.cos((lng2 - lng1) * (Math.PI / 180));

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function interpolateCoordinate(coordinates: [number, number][], progress: number) {
  if (coordinates.length === 1) {
    return coordinates[0];
  }

  const scaledIndex = progress * (coordinates.length - 1);
  const lowerIndex = Math.floor(scaledIndex);
  const upperIndex = Math.min(lowerIndex + 1, coordinates.length - 1);
  const localProgress = scaledIndex - lowerIndex;
  const from = coordinates[lowerIndex];
  const to = coordinates[upperIndex];

  return [
    from[0] + (to[0] - from[0]) * localProgress,
    from[1] + (to[1] - from[1]) * localProgress,
  ] as [number, number];
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
  const displayedVehiclePositionRef = useRef<[number, number] | null>(null);
  const displayedVehicleKeyRef = useRef<string | null>(null);
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
          const displayedVehiclePosition =
            animateVehicleKey &&
            displayedVehicleKeyRef.current === animateVehicleKey &&
            displayedVehiclePositionRef.current
              ? displayedVehiclePositionRef.current
              : ([vehicle.lng, vehicle.lat] as [number, number]);

          if (!vehicleMarkerRef.current) {
            vehicleMarkerRef.current = new maplibregl.Marker({
              element: createVehicleMarker(vehicle.label),
              anchor: "center",
            }).addTo(map);
          }
          vehicleMarkerRef.current.setLngLat(displayedVehiclePosition);
          bounds.extend(displayedVehiclePosition);
        } else {
          vehicleMarkerRef.current?.remove();
          vehicleMarkerRef.current = null;
          displayedVehiclePositionRef.current = null;
          displayedVehicleKeyRef.current = null;
        }

        if (hasCoordinates(pickup) && hasCoordinates(destination)) {
          const routeCoordinates = await fetchRoadRoute(pickup, destination);

          if (cancelled) return;

          ensureRouteLayers(map, routeCoordinates);
          routeCoordinates.forEach((coordinate) => bounds.extend(coordinate));
        } else {
          removeRouteLayers(map);
        }

        if (hasCoordinates(vehicle) && hasCoordinates(vehicleTarget)) {
          const activeRouteCoordinates = await fetchRoadRoute(vehicle, vehicleTarget);

          if (cancelled) return;

          ensureActiveRouteLayer(map, activeRouteCoordinates);
          activeRouteCoordinates.forEach((coordinate) => bounds.extend(coordinate));
        }

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, {
            padding: 82,
            maxZoom: 15,
            duration: 900,
          });
        }
      };

      if (!map.isStyleLoaded()) {
        map.once("load", render);
        return;
      }

      await render();
    };

    void renderScene();

    return () => {
      cancelled = true;
    };
  }, [animateVehicleKey, destination, pickup, vehicle, vehicleTarget]);

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

      displayedVehicleKeyRef.current = animateVehicleKey ?? null;
      const startedAt = performance.now();
      const duration = 16000;

      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const coordinate = interpolateCoordinate(coordinates, progress);
        const nextCoordinate = interpolateCoordinate(
          coordinates,
          Math.min(progress + 0.01, 1),
        );

        displayedVehiclePositionRef.current = coordinate;
        vehicleMarkerRef.current?.setLngLat(coordinate);

        const vehicleElement = vehicleMarkerRef.current?.getElement();
        const vehicleBody = vehicleElement?.querySelector<HTMLElement>("[data-vehicle-body='true']");
        if (vehicleBody) {
          vehicleBody.style.transform = `rotate(${getBearing(coordinate, nextCoordinate)}deg)`;
        }

        if (progress < 1 && !cancelled) {
          animationFrameRef.current = window.requestAnimationFrame(tick);
        }
      };

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    void animateVehicle();

    return () => {
      cancelled = true;
    };
  }, [animateVehicleKey, vehicle, vehicleTarget]);

  return (
    <div className={`relative overflow-hidden ${className ?? "min-h-[420px] rounded-3xl"}`}>
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-violet-700 shadow-[0_18px_35px_rgba(15,23,42,0.12)] backdrop-blur">
        Live route
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap gap-2">
        {pickup?.label ? (
          <div className="rounded-full border border-white/80 bg-white/92 px-3 py-2 text-xs font-bold text-slate-700 shadow-[0_16px_30px_rgba(15,23,42,0.12)] backdrop-blur">
            Pickup: {pickup.label}
          </div>
        ) : null}
        {destination?.label ? (
          <div className="rounded-full border border-white/80 bg-white/92 px-3 py-2 text-xs font-bold text-slate-700 shadow-[0_16px_30px_rgba(15,23,42,0.12)] backdrop-blur">
            Drop: {destination.label}
          </div>
        ) : null}
      </div>
    </div>
  );
}
