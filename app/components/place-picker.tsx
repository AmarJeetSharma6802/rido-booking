"use client";

import { useEffect, useMemo, useState } from "react";

export interface PlaceResult {
  label: string;
  address: string;
  lat: number;
  lng: number;
}

interface PlacePickerProps {
  label: string;
  value: string;
  placeholder: string;
  helper?: string;
  onQueryChange: (value: string) => void;
  onPlaceSelect: (place: PlaceResult) => void;
}

interface MapTilerFeature {
  text?: string;
  place_name?: string;
  center?: [number, number];
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
}

const DELHI_PROXIMITY = "77.2167,28.6315";
const NCR_BBOX = "76.75,28.25,77.65,28.95";

const fallbackPlaces: PlaceResult[] = [
  { label: "India Gate", address: "India Gate, New Delhi", lat: 28.6129, lng: 77.2295 },
  { label: "Connaught Place", address: "Connaught Place, New Delhi", lat: 28.6315, lng: 77.2167 },
  { label: "Khan Market", address: "Khan Market, New Delhi", lat: 28.6006, lng: 77.2269 },
  { label: "Cyber Hub", address: "Cyber Hub, Gurugram", lat: 28.495, lng: 77.0896 },
  { label: "Huda City Centre", address: "Huda City Centre, Gurugram", lat: 28.4595, lng: 77.072 },
  { label: "New Delhi Railway Station", address: "New Delhi Railway Station", lat: 28.6429, lng: 77.2197 },
  { label: "Saket", address: "Saket, New Delhi", lat: 28.5245, lng: 77.2066 },
  { label: "Noida Sector 18", address: "Sector 18, Noida", lat: 28.5708, lng: 77.3261 },
  { label: "Mahipalpur", address: "Mahipalpur, Vasant Vihar Tehsil, Delhi", lat: 28.5449, lng: 77.1257 },
  { label: "Mahipalpur Bypass", address: "Mahipalpur Bypass, Delhi", lat: 28.5482, lng: 77.1269 },
  { label: "Anand Vihar", address: "Anand Vihar, Delhi", lat: 28.646, lng: 77.3152 },
  { label: "Chandni Chowk", address: "Chandni Chowk, Old Delhi", lat: 28.6562, lng: 77.2303 },
];

async function geocodeAddress(value: string, maptilerKey?: string) {
  const localMatch = findLocalMatch(value);

  const nominatimPlace = await geocodeWithNominatim(value);
  if (nominatimPlace) return nominatimPlace;
  if (!maptilerKey) return localMatch ?? null;

  const response = await fetch(
    `https://api.maptiler.com/geocoding/${encodeURIComponent(value)}.json?key=${maptilerKey}&limit=5&country=in&proximity=${DELHI_PROXIMITY}&bbox=${NCR_BBOX}`,
  );
  const result = await response.json();
  const feature = (result.features as MapTilerFeature[] | undefined)?.find(
    (item) => item.center?.length === 2 && isInNcr(item.center[1], item.center[0]),
  );

  if (feature?.center?.length === 2) {
    return {
      label: feature.text ?? value,
      address: feature.place_name ?? feature.text ?? value,
      lat: feature.center[1],
      lng: feature.center[0],
    };
  }

  return localMatch ?? null;
}

async function geocodeWithNominatim(value: string) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        value,
      )}&countrycodes=in&viewbox=76.75,28.95,77.65,28.25&bounded=1&limit=1&addressdetails=1`,
    );
    const result = (await response.json()) as NominatimResult[];
    const item = result[0];

    if (!item) return null;

    const lat = Number(item.lat);
    const lng = Number(item.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isInNcr(lat, lng)) {
      return null;
    }

    return {
      label: item.name ?? item.display_name.split(",")[0] ?? value,
      address: item.display_name,
      lat,
      lng,
    };
  } catch {
    return null;
  }
}

async function searchPlaces(value: string, maptilerKey?: string, localMatches: PlaceResult[] = []) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        value,
      )}&countrycodes=in&viewbox=76.75,28.95,77.65,28.25&bounded=1&limit=6&addressdetails=1`,
    );
    const result = (await response.json()) as NominatimResult[];
    const suggestions = result
      .map((item) => ({
        label: item.name ?? item.display_name.split(",")[0] ?? value,
        address: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
      }))
      .filter(
        (item) =>
          Number.isFinite(item.lat) &&
          Number.isFinite(item.lng) &&
          isInNcr(item.lat, item.lng),
      );

    if (suggestions.length) return suggestions;
  } catch {
    // Fall through to other providers.
  }

  if (!maptilerKey) return localMatches.slice(0, 6);

  try {
    const response = await fetch(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(value)}.json?key=${maptilerKey}&limit=6&country=in&proximity=${DELHI_PROXIMITY}&bbox=${NCR_BBOX}`,
    );
    const result = await response.json();
    const remotePlaces =
      result.features?.map((feature: MapTilerFeature) => ({
        label: feature.text ?? feature.place_name ?? value,
        address: feature.place_name ?? feature.text ?? value,
        lat: feature.center?.[1],
        lng: feature.center?.[0],
      })) ?? [];

    const validRemotePlaces = remotePlaces.filter(
      (place: PlaceResult) =>
        typeof place.lat === "number" &&
        typeof place.lng === "number" &&
        isInNcr(place.lat, place.lng),
    );

    return validRemotePlaces.length ? validRemotePlaces : localMatches.slice(0, 6);
  } catch {
    return localMatches.slice(0, 6);
  }
}

function findLocalMatch(value: string) {
  const normalizedValue = value.trim().toLowerCase();

  return fallbackPlaces.find((place) => {
    const normalizedPlace = `${place.label} ${place.address}`.toLowerCase();
    return (
      normalizedPlace.includes(normalizedValue) ||
      normalizedValue.includes(place.label.toLowerCase())
    );
  });
}

function isInNcr(lat: number, lng: number) {
  return lat >= 28.25 && lat <= 28.95 && lng >= 76.75 && lng <= 77.65;
}

export default function PlacePicker({
  label,
  value,
  placeholder,
  helper,
  onQueryChange,
  onPlaceSelect,
}: PlacePickerProps) {
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  const localMatches = useMemo(() => {
    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue.length < 2) return [];

    return fallbackPlaces.filter((place) =>
      `${place.label} ${place.address}`.toLowerCase().includes(normalizedValue),
    );
  }, [value]);

  useEffect(() => {
    let ignore = false;

    const loadSuggestions = async () => {
      if (value.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);

      try {
        if (ignore) return;
        const places = await searchPlaces(value, maptilerKey, localMatches);
        if (!ignore) setSuggestions(places);
      } catch {
        if (!ignore) {
          setSuggestions(localMatches.slice(0, 6));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    const timeout = window.setTimeout(loadSuggestions, 350);

    return () => {
      ignore = true;
      window.clearTimeout(timeout);
    };
  }, [localMatches, maptilerKey, value]);

  return (
    <label className="relative grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <input
        value={value}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-violet-100 px-4 py-3 text-sm font-medium outline-none transition focus:border-violet-400"
      />
      {helper ? <span className="text-xs font-medium text-slate-500">{helper}</span> : null}
      <button
        type="button"
        disabled={value.trim().length < 2 || manualLoading}
        onClick={async () => {
          setManualError(null);
          setManualLoading(true);

          try {
            const place = await geocodeAddress(value, maptilerKey);

            if (!place) {
              setManualError("Address coordinates were not found. Pick a suggestion.");
              return;
            }

            onPlaceSelect(place);
            setSuggestions([]);
          } catch {
            setManualError("Address search failed. Pick a suggestion.");
          } finally {
            setManualLoading(false);
          }
        }}
        className="w-fit rounded-full bg-violet-100 px-4 py-2 text-xs font-black text-violet-700 transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {manualLoading ? "Setting..." : "Use this address"}
      </button>
      {manualError ? (
        <span className="text-xs font-semibold text-rose-600">{manualError}</span>
      ) : null}
      {loading ? (
        <span className="absolute right-4 top-10 text-xs font-black text-violet-500">
          Searching...
        </span>
      ) : null}
      {suggestions.length ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-[0_20px_70px_rgba(88,28,135,0.18)]">
          {suggestions.map((place) => (
            <button
              key={`${place.address}-${place.lat}-${place.lng}`}
              type="button"
              onClick={() => {
                onPlaceSelect(place);
                setSuggestions([]);
              }}
              className="block w-full px-4 py-3 text-left text-sm transition hover:bg-violet-50"
            >
              <span className="font-black text-slate-950">{place.label}</span>
              <span className="mt-1 block text-xs text-slate-500">{place.address}</span>
            </button>
          ))}
        </div>
      ) : null}
    </label>
  );
}
