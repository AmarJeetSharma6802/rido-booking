"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import RideMap, { MapPoint } from "@/app/components/ride-map";
import PlacePicker from "@/app/components/place-picker";

interface ActiveRide {
  id: string;
  pickup: string;
  destination: string;
  status: string;
  estimatedFare: number | null;
  estimatedDistanceKm: number | null;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  category?: {
    name: string;
    capacity: number;
  };
  driver?: {
    driverName: string;
    vehicleName: string;
    numberPlate: string | null;
    latitude: number;
    longitude: number;
  };
  user?: {
    name: string;
    email: string;
  };
}

function toMapPoint(
  label: string,
  lat: number | null | undefined,
  lng: number | null | undefined,
): MapPoint {
  return {
    label,
    lat: lat ?? null,
    lng: lng ?? null,
  };
}

export default function DriverPickupPage() {
  const [ride, setRide] = useState<ActiveRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [animatedVehicle, setAnimatedVehicle] = useState<MapPoint | null>(null);

  const loadRide = async () => {
    try {
      const response = await fetch("/api/controllers/rider/createAndupdate");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Ride load failed");
      }

      setRide(result.data ?? null);
      setError(null);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Ride load failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRide();
    const interval = window.setInterval(() => {
      loadRide().catch(() => null);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const syncDriverLocation = () => {
    setNotice("Driver location update kar rahe hain...");
    setError(null);

    if (!navigator.geolocation) {
      setNotice(null);
      setError("Browser geolocation support nahi kar raha.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch("/api/controllers/driver", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              isOnline: true,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || "Location update failed");
          }

          setNotice("Aap online ho. Nearby user ride book karega to yahan show hogi.");
          await loadRide();
        } catch (locationError) {
          const message =
            locationError instanceof Error
              ? locationError.message
              : "Location update failed";
          setError(message);
          setNotice(null);
        }
      },
      () => {
        setNotice(null);
        setError("Location permission deny ho gayi.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const updateRideStatus = async (status: string) => {
    if (!ride) return;

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/controllers/rider/createAndupdate", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rideId: ride.id,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Status update failed");
      }

      setRide(result.data);
      setNotice(status === "ongoing" ? "Ride accepted and started." : "Ride updated.");
    } catch (updateError) {
      const message =
        updateError instanceof Error ? updateError.message : "Status update failed";
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const pickupPoint = ride
    ? toMapPoint("Pickup", ride.pickupLatitude, ride.pickupLongitude)
    : null;
  const destinationPoint = ride
    ? toMapPoint("Destination", ride.destinationLatitude, ride.destinationLongitude)
    : null;
  const rawVehiclePoint =
    ride?.driver &&
    toMapPoint("Driver vehicle", ride.driver.latitude, ride.driver.longitude);
  const vehiclePoint = animatedVehicle ?? rawVehiclePoint;

  useEffect(() => {
    if (!ride?.driver) {
      setAnimatedVehicle(null);
      return;
    }

    const start =
      ride.status === "ongoing"
        ? {
            lat: ride.pickupLatitude ?? ride.driver.latitude,
            lng: ride.pickupLongitude ?? ride.driver.longitude,
          }
        : { lat: ride.driver.latitude, lng: ride.driver.longitude };
    const end =
      ride.status === "ongoing"
        ? {
            lat: ride.destinationLatitude ?? start.lat,
            lng: ride.destinationLongitude ?? start.lng,
          }
        : {
            lat: ride.pickupLatitude ?? ride.driver.latitude,
            lng: ride.pickupLongitude ?? ride.driver.longitude,
          };

    let frame = 0;
    const totalFrames = 80;
    const interval = window.setInterval(() => {
      frame += 1;
      const progress = Math.min(frame / totalFrames, 1);

      setAnimatedVehicle({
        label: "Driver moving",
        lat: start.lat + (end.lat - start.lat) * progress,
        lng: start.lng + (end.lng - start.lng) * progress,
      });

      if (progress >= 1) {
        window.clearInterval(interval);
      }
    }, 120);

    return () => window.clearInterval(interval);
  }, [ride]);

  return (
    <main className="min-h-screen bg-[#f7f2ff] px-4 py-6 text-slate-950">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[430px,1fr]">
        <section className="rounded-[38px] border border-violet-100 bg-white p-6 shadow-[0_30px_90px_rgba(88,28,135,0.16)]">
          <div className="rounded-[30px] bg-gradient-to-br from-slate-950 to-violet-800 p-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-200">
              Driver board
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">
              Accept nearby rides
            </h1>
            <p className="mt-2 text-sm leading-6 text-violet-100">
              Is tab ko open rakho. Location online karne ke baad user ride
              request yahan pending card ki tarah aayegi.
            </p>
          </div>

          <div className="mt-5 grid gap-3">
            <button
              onClick={syncDriverLocation}
              className="rounded-[24px] bg-violet-600 px-5 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(124,58,237,0.28)] transition hover:-translate-y-0.5 hover:bg-violet-700"
            >
              Go online / update my location
            </button>
            <PlacePicker
              label="Manual driver location"
              value={locationQuery}
              placeholder="Search your current area"
              helper="GPS off hai to address select karke online location update karo."
              onQueryChange={setLocationQuery}
              onPlaceSelect={async (place) => {
                setLocationQuery(place.address);
                setNotice("Driver manual location update kar rahe hain...");
                setError(null);

                try {
                  const response = await fetch("/api/controllers/driver", {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      latitude: place.lat,
                      longitude: place.lng,
                      isOnline: true,
                    }),
                  });

                  const result = await response.json();

                  if (!response.ok) {
                    throw new Error(result.message || "Location update failed");
                  }

                  setNotice("Driver manual location online ho gayi.");
                  await loadRide();
                } catch (locationError) {
                  const message =
                    locationError instanceof Error
                      ? locationError.message
                      : "Location update failed";
                  setError(message);
                  setNotice(null);
                }
              }}
            />
            <Link
              href="/driver"
              className="inline-flex justify-center rounded-2xl border border-violet-200 px-4 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-50"
            >
              Edit driver profile
            </Link>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {notice ? (
            <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-700">
              {notice}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              Ride board load ho raha hai...
            </div>
          ) : null}

          {!loading && !ride ? (
            <div className="mt-5 rounded-[26px] border border-dashed border-violet-200 bg-violet-50 p-5 text-sm text-violet-900">
              Abhi ride nahi hai. Driver tab online rakho, phir user tab se ride
              book karo.
            </div>
          ) : null}

          {ride ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-[26px] border border-violet-100 bg-violet-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-500">
                      Assigned ride
                    </p>
                    <p className="mt-2 text-3xl font-black capitalize">
                      {ride.status}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-violet-700 shadow-sm">
                    Rs. {ride.estimatedFare?.toFixed(0) ?? "-"}
                  </span>
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p>
                    <span className="font-black text-slate-950">Rider:</span>{" "}
                    {ride.user?.name ?? "Unknown"} ({ride.user?.email ?? "-"})
                  </p>
                  <p>
                    <span className="font-black text-slate-950">Pickup:</span>{" "}
                    {ride.pickup}
                  </p>
                  <p>
                    <span className="font-black text-slate-950">Drop:</span>{" "}
                    {ride.destination}
                  </p>
                  <p>
                    <span className="font-black text-slate-950">Distance:</span>{" "}
                    {ride.estimatedDistanceKm?.toFixed(2) ?? "-"} km
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                {ride.status === "pending" ? (
                  <button
                    onClick={() => updateRideStatus("ongoing")}
                    disabled={actionLoading}
                    className="rounded-[24px] bg-violet-600 px-5 py-4 text-sm font-black text-white transition hover:bg-violet-700 disabled:bg-violet-300"
                  >
                    {actionLoading ? "Accepting..." : "Accept ride and start pickup"}
                  </button>
                ) : null}

                {ride.status === "ongoing" ? (
                  <button
                    onClick={() => updateRideStatus("complete")}
                    disabled={actionLoading}
                    className="rounded-[24px] bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:bg-emerald-300"
                  >
                    {actionLoading ? "Completing..." : "Complete ride"}
                  </button>
                ) : null}

                {ride.status !== "complete" ? (
                  <button
                    onClick={() => updateRideStatus("cancelled")}
                    disabled={actionLoading}
                    className="rounded-2xl border border-violet-200 px-4 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-50 disabled:opacity-60"
                  >
                    Cancel ride
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-[38px] bg-white p-2 shadow-[0_30px_90px_rgba(88,28,135,0.16)] ring-1 ring-violet-100">
          <RideMap
            pickup={pickupPoint}
            destination={destinationPoint}
            vehicle={vehiclePoint || null}
            className="min-h-[76vh] rounded-[32px]"
          />
        </section>
      </div>
    </main>
  );
}
