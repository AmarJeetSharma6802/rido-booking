"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import type { MapPoint } from "./ride-map";

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

const DEFAULT_CENTER: [number, number] = [28.7041, 77.1025];
const OSRM_URL = process.env.NEXT_PUBLIC_OSRM_URL ?? "https://router.project-osrm.org";

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
    // Fall back to a direct line so the map stays useful even if routing fails.
  }

  return [
    [from.lng, from.lat],
    [to.lng, to.lat],
  ] satisfies [number, number][];
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

function toLatLngTuple(point: MapPoint & { lat: number; lng: number }): [number, number] {
  return [point.lat, point.lng];
}

function toLeafletPolyline(coordinates: [number, number][]) {
  return coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
}

function createCircleIcon(color: string, label: string) {
  return L.divIcon({
    className: "",
    html: `
      <div title="${label}" style="width:24px;height:24px;border-radius:9999px;background:${color};border:4px solid #ffffff;box-shadow:0 14px 30px rgba(88,28,135,0.24);outline:6px solid rgba(255,255,255,0.32);"></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function createVehicleIcon(label: string, bearing: number) {
  return L.divIcon({
    className: "",
    html: `
      <div title="${label}" style="display:grid;place-items:center;width:66px;height:66px;transform:rotate(${bearing}deg);transform-origin:center center;will-change:transform;">
        <div style="position:relative;display:grid;place-items:center;width:66px;height:66px;">
          <div style="position:absolute;inset:8px;border-radius:9999px;background:rgba(109,40,217,0.18);filter:blur(8px);"></div>
          <svg width="66" height="66" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="33" cy="33" r="29" fill="#ffffff" fill-opacity="0.96"/>
            <circle cx="33" cy="33" r="24" fill="url(#vehicleGradientLeaflet)"/>
            <path d="M19 38V29.5C19 28.09 19.71 26.79 20.89 26.03L25.48 23.07C26.71 22.28 28.13 21.86 29.6 21.86H36.4C37.87 21.86 39.29 22.28 40.52 23.07L45.11 26.03C46.29 26.79 47 28.09 47 29.5V38C47 39 46.19 39.8 45.2 39.8H44.03C43.37 39.8 42.79 39.36 42.62 38.72L42.22 37.15H23.78L23.38 38.72C23.21 39.36 22.63 39.8 21.97 39.8H20.8C19.81 39.8 19 39 19 38Z" fill="#FDF2F8"/>
            <rect x="24.4" y="25.35" width="17.2" height="7.2" rx="2.2" fill="#DBEAFE"/>
            <circle cx="26.8" cy="40.9" r="4.1" fill="#F8FAFC"/>
            <circle cx="39.2" cy="40.9" r="4.1" fill="#F8FAFC"/>
            <circle cx="26.8" cy="40.9" r="1.9" fill="#0F172A"/>
            <circle cx="39.2" cy="40.9" r="1.9" fill="#0F172A"/>
            <defs>
              <linearGradient id="vehicleGradientLeaflet" x1="15" y1="13" x2="51" y2="53" gradientUnits="userSpaceOnUse">
                <stop stop-color="#7C3AED" />
                <stop offset="1" stop-color="#D946EF" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    `,
    iconSize: [66, 66],
    iconAnchor: [33, 33],
  });
}

function MapViewportController({
  pickup,
  destination,
  vehiclePosition,
  routeCoordinates,
  activeRouteCoordinates,
}: {
  pickup?: MapPoint | null;
  destination?: MapPoint | null;
  vehiclePosition: [number, number] | null;
  routeCoordinates: [number, number][];
  activeRouteCoordinates: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([]);

    if (hasCoordinates(pickup) && isReasonableMapPoint(pickup)) {
      bounds.extend(toLatLngTuple(pickup));
    }

    if (hasCoordinates(destination) && isReasonableMapPoint(destination)) {
      bounds.extend(toLatLngTuple(destination));
    }

    if (vehiclePosition) {
      bounds.extend([vehiclePosition[1], vehiclePosition[0]]);
    }

    routeCoordinates.forEach(([lng, lat]) => bounds.extend([lat, lng]));
    activeRouteCoordinates.forEach(([lng, lat]) => bounds.extend([lat, lng]));

    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.18), {
        maxZoom: 15,
        animate: true,
        duration: 1,
      });
    } else {
      map.setView(DEFAULT_CENTER, 12);
    }
  }, [activeRouteCoordinates, destination, map, pickup, routeCoordinates, vehiclePosition]);

  return null;
}

function MapResizeController() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const resizeMap = () => map.invalidateSize();
    const observer = new ResizeObserver(resizeMap);

    observer.observe(container);
    const timeout = window.setTimeout(resizeMap, 0);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, [map]);

  return null;
}

export default function LeafletRideMap({
  pickup,
  destination,
  vehicle,
  vehicleTarget,
  animateVehicleKey,
  className,
}: RideMapProps) {
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [activeRouteCoordinates, setActiveRouteCoordinates] = useState<[number, number][]>([]);
  const [displayedVehiclePosition, setDisplayedVehiclePosition] = useState<[number, number] | null>(
    hasCoordinates(vehicle) ? [vehicle.lng, vehicle.lat] : null,
  );
  const [vehicleBearing, setVehicleBearing] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const staticVehiclePosition = useMemo(
    () =>
      hasCoordinates(vehicle) && isReasonableMapPoint(vehicle)
        ? ([vehicle.lng, vehicle.lat] as [number, number])
        : null,
    [vehicle],
  );

  useEffect(() => {
    let cancelled = false;

    const loadRoute = async () => {
      if (!hasCoordinates(pickup) || !hasCoordinates(destination)) {
        setRouteCoordinates([]);
        return;
      }

      const coordinates = await fetchRoadRoute(pickup, destination);
      if (!cancelled) {
        setRouteCoordinates(coordinates);
      }
    };

    void loadRoute();

    return () => {
      cancelled = true;
    };
  }, [destination, pickup]);

  useEffect(() => {
    let cancelled = false;

    const loadActiveRoute = async () => {
      if (!hasCoordinates(vehicle) || !hasCoordinates(vehicleTarget)) {
        setActiveRouteCoordinates([]);
        return;
      }

      const coordinates = await fetchRoadRoute(vehicle, vehicleTarget);
      if (!cancelled) {
        setActiveRouteCoordinates(coordinates);
      }
    };

    void loadActiveRoute();

    return () => {
      cancelled = true;
    };
  }, [vehicle, vehicleTarget]);

  useEffect(() => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (!hasCoordinates(vehicle) || !hasCoordinates(vehicleTarget)) {
      return;
    }

    const coordinates =
      activeRouteCoordinates.length >= 2
        ? activeRouteCoordinates
        : [
            [vehicle.lng, vehicle.lat],
            [vehicleTarget.lng, vehicleTarget.lat],
          ] as [number, number][];

    if (coordinates.length < 2) {
      return;
    }

    let cancelled = false;
    const startedAt = performance.now();
    const duration = 16000;

    const tick = (now: number) => {
      if (cancelled) return;

      const progress = Math.min((now - startedAt) / duration, 1);
      const coordinate = interpolateCoordinate(coordinates, progress);
      const nextCoordinate = interpolateCoordinate(coordinates, Math.min(progress + 0.01, 1));

      setDisplayedVehiclePosition(coordinate);
      setVehicleBearing(getBearing(coordinate, nextCoordinate));

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(tick);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [activeRouteCoordinates, animateVehicleKey, vehicle, vehicleTarget]);

  const pickupIcon = useMemo(
    () => createCircleIcon("#7c3aed", pickup?.label ?? "Pickup"),
    [pickup?.label],
  );
  const destinationIcon = useMemo(
    () => createCircleIcon("#ec4899", destination?.label ?? "Destination"),
    [destination?.label],
  );
  const vehicleIcon = useMemo(
    () => createVehicleIcon(vehicle?.label ?? "Vehicle", vehicleBearing),
    [vehicle?.label, vehicleBearing],
  );
  const vehicleMarkerPosition =
    hasCoordinates(vehicle) && hasCoordinates(vehicleTarget)
      ? displayedVehiclePosition ?? staticVehiclePosition
      : staticVehiclePosition;

  return (
    <div className={`relative overflow-hidden rounded-3xl ${className ?? "min-h-[420px]"}`}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        zoomControl={false}
        scrollWheelZoom
        className="absolute inset-0 h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="topright" />
        <MapResizeController />
        <MapViewportController
          pickup={pickup}
          destination={destination}
          vehiclePosition={displayedVehiclePosition}
          routeCoordinates={routeCoordinates}
          activeRouteCoordinates={activeRouteCoordinates}
        />

        {routeCoordinates.length >= 2 ? (
          <>
            <Polyline
              positions={toLeafletPolyline(routeCoordinates)}
              pathOptions={{ color: "#ffffff", weight: 10, opacity: 0.96, lineCap: "round", lineJoin: "round" }}
            />
            <Polyline
              positions={toLeafletPolyline(routeCoordinates)}
              pathOptions={{ color: "#7c3aed", weight: 5.5, opacity: 0.95, lineCap: "round", lineJoin: "round" }}
            />
          </>
        ) : null}

        {activeRouteCoordinates.length >= 2 ? (
          <Polyline
            positions={toLeafletPolyline(activeRouteCoordinates)}
            pathOptions={{ color: "#0f172a", weight: 4, opacity: 0.34, dashArray: "6 8", lineCap: "round", lineJoin: "round" }}
          />
        ) : null}

        {hasCoordinates(pickup) && isReasonableMapPoint(pickup) ? (
          <Marker position={toLatLngTuple(pickup)} icon={pickupIcon} />
        ) : null}

        {hasCoordinates(destination) && isReasonableMapPoint(destination) ? (
          <Marker position={toLatLngTuple(destination)} icon={destinationIcon} />
        ) : null}

        {vehicleMarkerPosition ? (
          <Marker
            position={[vehicleMarkerPosition[1], vehicleMarkerPosition[0]]}
            icon={vehicleIcon}
          />
        ) : null}
      </MapContainer>

      <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-full border border-white/80 bg-white/90 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-violet-700 shadow-[0_18px_35px_rgba(15,23,42,0.12)] backdrop-blur">
        Live route
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 z-[500] flex flex-wrap gap-2">
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
