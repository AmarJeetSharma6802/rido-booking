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

const fallbackPlaces: PlaceResult[] = [
  { label: "India Gate", address: "India Gate, New Delhi", lat: 28.6129, lng: 77.2295 },
  { label: "Connaught Place", address: "Connaught Place, New Delhi", lat: 28.6315, lng: 77.2167 },
  { label: "Khan Market", address: "Khan Market, New Delhi", lat: 28.6006, lng: 77.2269 },
  { label: "Cyber Hub", address: "Cyber Hub, Gurugram", lat: 28.495, lng: 77.0896 },
  { label: "Huda City Centre", address: "Huda City Centre, Gurugram", lat: 28.4595, lng: 77.072 },
  { label: "New Delhi Railway Station", address: "New Delhi Railway Station", lat: 28.6429, lng: 77.2197 },
  { label: "Saket", address: "Saket, New Delhi", lat: 28.5245, lng: 77.2066 },
  { label: "Noida Sector 18", address: "Sector 18, Noida", lat: 28.5708, lng: 77.3261 },
];

async function geocodeAddress(value: string, maptilerKey?: string) {
  const localMatch = fallbackPlaces.find((place) =>
    `${place.label} ${place.address}`
      .toLowerCase()
      .includes(value.trim().toLowerCase()),
  );

  if (!maptilerKey) return localMatch ?? null;

  const response = await fetch(
    `https://api.maptiler.com/geocoding/${encodeURIComponent(value)}.json?key=${maptilerKey}&limit=1`,
  );
  const result = await response.json();
  const feature = result.features?.[0] as MapTilerFeature | undefined;

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

      if (!maptilerKey) {
        setSuggestions(localMatches.slice(0, 5));
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(
          `https://api.maptiler.com/geocoding/${encodeURIComponent(value)}.json?key=${maptilerKey}&limit=5`,
        );
        const result = await response.json();

        if (ignore) return;

        const remotePlaces =
          result.features?.map((feature: MapTilerFeature) => ({
            label: feature.text ?? feature.place_name ?? value,
            address: feature.place_name ?? feature.text ?? value,
            lat: feature.center?.[1],
            lng: feature.center?.[0],
          })) ?? [];

        const validRemotePlaces = remotePlaces.filter(
          (place: PlaceResult) =>
            typeof place.lat === "number" && typeof place.lng === "number",
        );

        setSuggestions(
          validRemotePlaces.length ? validRemotePlaces : localMatches.slice(0, 5),
        );
      } catch {
        if (!ignore) {
          setSuggestions(localMatches.slice(0, 5));
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
              setManualError("Address coordinates nahi mile. Suggestion select karo.");
              return;
            }

            onPlaceSelect(place);
            setSuggestions([]);
          } catch {
            setManualError("Address search failed. Suggestion select karo.");
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
