"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/app/components/app-shell";
import PlacePicker from "@/app/components/place-picker";
import RideMap, { MapPoint } from "@/app/components/ride-map";

interface ActiveRide {
  id: string;
  pickup: string;
  destination: string;
  status: string;
  otp: string | null;
  isVerified: boolean;
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
  const [otpInput, setOtpInput] = useState("");

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

          setNotice("Aap online ho. User ride book karega to request yahan show hogi.");
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
          otp: status === "ongoing" ? otpInput : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Status update failed");
      }

      if (status === "complete" || status === "cancelled") {
        setRide(null);
        setOtpInput("");
        setNotice(
          status === "complete"
            ? "Ride complete ho gayi. Board next ride ke liye ready hai."
            : "Ride cancel ho gayi. Board next ride ke liye ready hai.",
        );
      } else {
        setRide(result.data);
        setOtpInput("");
        setNotice("OTP verify ho gayi. Trip officially start ho gayi.");
      }
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
  const vehiclePoint =
    ride?.driver &&
    toMapPoint("Driver vehicle", ride.driver.latitude, ride.driver.longitude);
  const vehicleTargetPoint =
    ride?.driver && ride.status === "ongoing"
      ? toMapPoint("Destination", ride.destinationLatitude, ride.destinationLongitude)
      : ride?.driver
        ? toMapPoint("Pickup", ride.pickupLatitude, ride.pickupLongitude)
        : null;

  return (
    <AppShell
      title="Driver board"
      subtitle="Live pickup dashboard with OTP verification. Driver ko trip start karne ke liye rider OTP enter karni hogi."
    >
      <section className="overflow-hidden rounded-[34px] border border-violet-100 bg-white p-3 shadow-[0_26px_80px_rgba(88,28,135,0.14)]">
        <RideMap
          pickup={pickupPoint}
          destination={destinationPoint}
          vehicle={vehiclePoint || null}
          vehicleTarget={vehicleTargetPoint}
          animateVehicleKey={ride?.driver ? `${ride.id}-${ride.status}` : null}
          className="min-h-[42vh] rounded-[28px] md:min-h-[52vh]"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.92fr,1.08fr]">
        <section className="rounded-[34px] border border-violet-100 bg-white p-5 shadow-[0_26px_80px_rgba(88,28,135,0.14)]">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-500">
            Driver controls
          </p>
          <h3 className="mt-2 text-2xl font-black">Go online</h3>

          <div className="mt-5 grid gap-4">
            <button
              onClick={syncDriverLocation}
              className="rounded-[22px] bg-violet-600 px-5 py-4 text-sm font-black text-white transition hover:bg-violet-700"
            >
              Go online / update current location
            </button>

            <PlacePicker
              label="Manual driver location"
              value={locationQuery}
              placeholder="Search your area, street, gali"
              helper="GPS off hai to address select karke driver location set karo."
              onQueryChange={setLocationQuery}
              onPlaceSelect={async (place) => {
                setLocationQuery(place.address);
                setNotice("Manual driver location update kar rahe hain...");
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

                  setNotice("Driver location update ho gayi.");
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
              Edit driver setup
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

          {!loading && !ride ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-violet-200 bg-violet-50 p-5 text-sm text-violet-900">
              Abhi ride nahi hai. Driver online rakho, phir user ride book karega to request yahan dikhegi.
            </div>
          ) : null}
        </section>

        <section className="rounded-[34px] border border-violet-100 bg-white p-5 shadow-[0_26px_80px_rgba(88,28,135,0.14)]">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-500">
            Assigned ride
          </p>
          <h3 className="mt-2 text-2xl font-black">
            {ride ? "Accept and move trip" : "Waiting for next ride"}
          </h3>

          {loading ? (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              Ride board load ho raha hai...
            </div>
          ) : null}

          {ride ? (
            <div className="mt-5 space-y-5">
              <div className="rounded-[26px] bg-violet-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-500">
                      Status
                    </p>
                    <p className="mt-2 text-3xl font-black capitalize">{ride.status}</p>
                  </div>
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-violet-700">
                    Rs. {ride.estimatedFare?.toFixed(0) ?? "-"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-700">
                  <p><span className="font-black text-slate-950">Rider:</span> {ride.user?.name ?? "Unknown"} ({ride.user?.email ?? "-"})</p>
                  <p><span className="font-black text-slate-950">Pickup:</span> {ride.pickup}</p>
                  <p><span className="font-black text-slate-950">Drop:</span> {ride.destination}</p>
                  <p><span className="font-black text-slate-950">Distance:</span> {ride.estimatedDistanceKm?.toFixed(2) ?? "-"} km</p>
                  <p><span className="font-black text-slate-950">Vehicle:</span> {ride.driver?.vehicleName ?? "-"}</p>
                </div>
              </div>

              {ride.status === "pending" ? (
                <div className="rounded-[26px] border border-violet-100 bg-white p-5">
                  <p className="text-sm font-black text-slate-950">Enter rider OTP to start trip</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Rider app par jo OTP dikhegi, wahi yahan daalni hai.
                  </p>
                  <input
                    value={otpInput}
                    onChange={(event) => setOtpInput(event.target.value)}
                    placeholder="Enter 4-digit rider OTP"
                    className="mt-4 w-full rounded-2xl border border-violet-100 px-4 py-3 text-lg font-black tracking-[0.28em] outline-none focus:border-violet-400"
                  />
                  <button
                    onClick={() => updateRideStatus("ongoing")}
                    disabled={actionLoading || otpInput.trim().length < 4}
                    className="mt-4 w-full rounded-[22px] bg-violet-600 px-5 py-4 text-sm font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
                  >
                    {actionLoading ? "Verifying OTP..." : "Verify OTP and start trip"}
                  </button>
                </div>
              ) : null}

              {ride.status === "ongoing" ? (
                <button
                  onClick={() => updateRideStatus("complete")}
                  disabled={actionLoading}
                  className="w-full rounded-[22px] bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:bg-emerald-300"
                >
                  {actionLoading ? "Completing..." : "Complete ride"}
                </button>
              ) : null}

              {ride.status !== "complete" ? (
                <button
                  onClick={() => updateRideStatus("cancelled")}
                  disabled={actionLoading}
                  className="w-full rounded-[22px] border border-violet-200 px-4 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-50 disabled:opacity-60"
                >
                  Cancel ride
                </button>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
