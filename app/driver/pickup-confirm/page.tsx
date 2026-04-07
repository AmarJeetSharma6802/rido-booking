"use client";

import { useEffect, useState } from "react";
import RideMap, { MapPoint } from "@/app/components/ride-map";

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

export default function DriverPickupConfirmPage() {
  const [ride, setRide] = useState<ActiveRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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
  }, []);

  const updateRideStatus = async (status: string) => {
    if (!ride) return;

    setActionLoading(true);
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
      setError(null);
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : "Status update failed";
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

  return (
    <main className="min-h-screen bg-[linear-gradient(145deg,#fff7ed_0%,#f8fafc_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.2fr,420px]">
        <section className="overflow-hidden rounded-[32px] bg-slate-950 p-2 shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
          <RideMap
            pickup={pickupPoint}
            destination={destinationPoint}
            vehicle={vehiclePoint || null}
            className="min-h-[72vh] rounded-[28px]"
          />
        </section>

        <section className="rounded-[28px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] ring-1 ring-orange-100">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">
            Pickup Confirm
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Confirm and move ride
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Driver yahan se pickup confirm karke ride ko `ongoing` ya `complete`
            kar sakta hai.
          </p>

          {loading ? (
            <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
              Ride load ho rahi hai...
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {!loading && !error && !ride ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              Koi active ride nahi mili. Pehle user side se ride create karo.
            </div>
          ) : null}

          {ride ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-slate-950 p-5 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                  Current status
                </p>
                <p className="mt-2 text-2xl font-semibold capitalize">
                  {ride.status}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Rider: {ride.user?.name ?? "Unknown rider"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="grid gap-3 text-sm text-slate-600">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Pickup
                    </p>
                    <p className="mt-1 font-medium text-slate-900">{ride.pickup}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Destination
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {ride.destination}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Vehicle
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {ride.driver?.vehicleName ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Number Plate
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {ride.driver?.numberPlate ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Category
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {ride.category?.name ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Fare
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        Rs. {ride.estimatedFare?.toFixed(0) ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {ride.status === "pending" ? (
                  <button
                    onClick={() => updateRideStatus("ongoing")}
                    disabled={actionLoading}
                    className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
                  >
                    {actionLoading ? "Updating..." : "Confirm pickup and start ride"}
                  </button>
                ) : null}

                {ride.status === "ongoing" ? (
                  <button
                    onClick={() => updateRideStatus("complete")}
                    disabled={actionLoading}
                    className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {actionLoading ? "Updating..." : "Complete ride"}
                  </button>
                ) : null}

                {ride.status !== "complete" ? (
                  <button
                    onClick={() => updateRideStatus("cancelled")}
                    disabled={actionLoading}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel ride
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
