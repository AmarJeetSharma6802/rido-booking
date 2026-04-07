"use client";

import { useEffect, useState } from "react";
import RideMap, { MapPoint } from "@/app/components/ride-map";
import PlacePicker from "@/app/components/place-picker";

interface Category {
  id: string;
  name: string;
  capacity: number;
  baseFare: number;
  perKmRate: number;
}

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
  categoryId: string;
  category?: {
    name: string;
    capacity: number;
  };
  driver?: {
    id: string;
    driverName: string;
    vehicleName: string;
    numberPlate: string | null;
    latitude: number;
    longitude: number;
  };
}

const destinations = [
  { label: "India Gate", address: "India Gate, New Delhi", lat: 28.6129, lng: 77.2295 },
  { label: "Connaught Place", address: "Connaught Place, New Delhi", lat: 28.6315, lng: 77.2167 },
  { label: "Khan Market", address: "Khan Market, New Delhi", lat: 28.6006, lng: 77.2269 },
  { label: "Cyber Hub", address: "Cyber Hub, Gurugram", lat: 28.495, lng: 77.0896 },
    {
    label: "Mahipalpur",
    address: "Mahipalpur, New Delhi",
    lat: 28.5449,
    lng: 77.1257
  },
  {
    label: "New Delhi Railway Station",
    address: "New Delhi Railway Station, Delhi",
    lat: 28.6436,
    lng: 77.2197
  },
  {
    label: "Anand Vihar Railway Station",
    address: "Anand Vihar Railway Terminal, Delhi",
    lat: 28.6460,
    lng: 77.3152
  },
  {
    label: "Hazrat Nizamuddin Railway Station",
    address: "Hazrat Nizamuddin Railway Station, Delhi",
    lat: 28.5880,
    lng: 77.2540
  },
  {
    label: "Chandni Chowk",
    address: "Chandni Chowk, Old Delhi",
    lat: 28.6562,
    lng: 77.2303
  }
];

const reviewReasons = [
  "extra_money_demand",
  "wrong_pickup",
  "rude_behavior",
  "unsafe_driving",
  "driving_on_call",
  "vehicle_not_clean",
  "late_arrival",
  "route_issue",
  "other",
];

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

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return radius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function vehicleIcon(name: string) {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes("bike")) {
    return (
      <svg viewBox="0 0 64 64" className="h-11 w-11" aria-hidden="true">
        <circle cx="18" cy="46" r="9" fill="#ede9fe" stroke="#6d28d9" strokeWidth="4" />
        <circle cx="48" cy="46" r="9" fill="#ede9fe" stroke="#6d28d9" strokeWidth="4" />
        <path d="M18 46l10-18h10l10 18M28 28l7 18M36 28h9" fill="none" stroke="#111827" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M31 20h10" stroke="#a855f7" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  if (normalizedName.includes("auto")) {
    return (
      <svg viewBox="0 0 64 64" className="h-11 w-11" aria-hidden="true">
        <path d="M11 40V28c0-7 6-13 13-13h12c6 0 12 4 15 10l4 9v6H11Z" fill="#f5d0fe" stroke="#6d28d9" strokeWidth="4" strokeLinejoin="round" />
        <path d="M22 18v16h25" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
        <circle cx="21" cy="44" r="6" fill="#111827" />
        <circle cx="47" cy="44" r="6" fill="#111827" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className="h-11 w-11" aria-hidden="true">
      <path d="M12 41V29c0-3 2-6 5-7l8-4h14l8 4c3 1 5 4 5 7v12H12Z" fill="#ede9fe" stroke="#6d28d9" strokeWidth="4" strokeLinejoin="round" />
      <path d="M22 20h20l5 12H17l5-12Z" fill="#f5d0fe" stroke="#111827" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="21" cy="43" r="6" fill="#111827" />
      <circle cx="43" cy="43" r="6" fill="#111827" />
    </svg>
  );
}

export default function UserRidePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [ride, setRide] = useState<ActiveRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pickup, setPickup] = useState({
    address: "Use current location",
    lat: null as number | null,
    lng: null as number | null,
  });
  const [pickupQuery, setPickupQuery] = useState("");
  const [destination, setDestination] = useState(destinations[0]);
  const [destinationQuery, setDestinationQuery] = useState(destinations[0].address);
  const [categoryId, setCategoryId] = useState("");
  const [reviewForm, setReviewForm] = useState({
    rating: "5",
    reason: "late_arrival",
  });
  const [complaintMessage, setComplaintMessage] = useState("");

  const loadRide = async () => {
    const rideResponse = await fetch("/api/controllers/rider/createAndupdate");
    const rideResult = await rideResponse.json();

    if (rideResponse.ok) {
      setRide(rideResult.data ?? null);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const categoryResponse = await fetch("/api/controllers/category");
        const categoryResult = await categoryResponse.json();

        if (!categoryResponse.ok) {
          throw new Error(categoryResult.message || "Category load failed");
        }

        setCategories(categoryResult.categories ?? []);

        if (categoryResult.categories?.length) {
          setCategoryId(categoryResult.categories[0].id);
        }

        await loadRide();
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Data load failed";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadRide().catch(() => null);
    }, 6000);

    return () => window.clearInterval(interval);
  }, []);

  const routeDistanceKm =
    pickup.lat && pickup.lng
      ? getDistanceKm(pickup.lat, pickup.lng, destination.lat, destination.lng)
      : null;

  const rideOptions = categories.map((category) => ({
    ...category,
    fare: routeDistanceKm
      ? Math.round(category.baseFare + category.perKmRate * routeDistanceKm)
      : null,
    eta: routeDistanceKm ? Math.max(3, Math.round(routeDistanceKm * 2.2)) : null,
  }));

  const pickupPoint = ride
    ? toMapPoint("Pickup", ride.pickupLatitude, ride.pickupLongitude)
    : toMapPoint("You", pickup.lat, pickup.lng);

  const destinationPoint = ride
    ? toMapPoint("Destination", ride.destinationLatitude, ride.destinationLongitude)
    : toMapPoint(destination.label, destination.lat, destination.lng);

  const vehiclePoint =
    ride?.driver &&
    toMapPoint(
      `${ride.driver.driverName}'s vehicle`,
      ride.driver.latitude,
      ride.driver.longitude,
    );

  const vehicleTargetPoint =
    ride?.driver && ride.status === "ongoing"
      ? toMapPoint("Destination", ride.destinationLatitude, ride.destinationLongitude)
      : ride?.driver
        ? toMapPoint("Pickup", ride.pickupLatitude, ride.pickupLongitude)
        : null;

  const useCurrentLocation = () => {
    setError(null);
    setNotice("Location permission maang rahe hain...");

    if (!navigator.geolocation) {
      setError("Browser geolocation support nahi kar raha.");
      setNotice(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPickup({
          address: "Current location",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setPickupQuery("Current location");
        setNotice("Pickup location set ho gayi.");
      },
      () => {
        setNotice(null);
        setError("Location permission deny ho gayi. Ride book karne ke liye allow karo.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const requestRide = async () => {
    if (!categoryId) {
      setError("Category select karo.");
      return;
    }

    if (!pickup.lat || !pickup.lng) {
      setError("Pickup address select karo ya current location allow karo.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/controllers/rider/createAndupdate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickup: pickup.address,
          destination: destination.address,
          categoryId,
          pickupLatitude: pickup.lat,
          pickupLongitude: pickup.lng,
          destinationLatitude: destination.lat,
          destinationLongitude: destination.lng,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Ride create nahi hui");
      }

      setRide(result.data);
      setNotice("Ride request driver ko bhej di gayi.");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Ride create nahi hui";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRide = async () => {
    if (!ride) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/controllers/rider/createAndupdate", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rideId: ride.id,
          status: "cancelled",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Ride cancel nahi hui");
      }

      setRide(null);
      setNotice("Ride cancel ho gayi.");
    } catch (cancelError) {
      const message =
        cancelError instanceof Error ? cancelError.message : "Ride cancel nahi hui";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitReview = async () => {
    if (!ride) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/controllers/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rideId: ride.id,
          categoryId: ride.categoryId,
          rating: Number(reviewForm.rating),
          reason: reviewForm.reason,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Review submit nahi hua");
      }

      setNotice("Review submit ho gaya. Thank you!");
    } catch (reviewError) {
      const message =
        reviewError instanceof Error ? reviewError.message : "Review submit nahi hua";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitComplaint = async () => {
    if (!ride?.driver || !complaintMessage.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/controllers/complaint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          driverId: ride.driver.id,
          message: complaintMessage,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Complaint submit nahi hui");
      }

      setComplaintMessage("");
      setNotice("Complaint submit ho gayi.");
    } catch (complaintError) {
      const message =
        complaintError instanceof Error
          ? complaintError.message
          : "Complaint submit nahi hui";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f2ff] px-4 py-6 text-slate-950">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[440px,1fr]">
        <section className="rounded-[34px] border border-violet-100 bg-white/95 p-5 shadow-[0_30px_90px_rgba(88,28,135,0.16)]">
          <div className="rounded-[28px] bg-gradient-to-br from-violet-600 to-fuchsia-500 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-100">
              Ride App
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">
              Book your ride
            </h1>
            <p className="mt-2 text-sm leading-6 text-violet-50">
              Pickup real device location se set hoga. Driver tab online hoga to
              nearest driver ko request assign hogi.
            </p>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {notice ? (
            <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-700">
              {notice}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              App data load ho raha hai...
            </div>
          ) : null}

          {ride ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-[26px] border border-violet-100 bg-violet-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-500">
                      Current ride
                    </p>
                    <p className="mt-2 text-3xl font-black capitalize text-slate-950">
                      {ride.status}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-violet-700 shadow-sm">
                    Rs. {ride.estimatedFare?.toFixed(0) ?? "-"}
                  </span>
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p>
                    <span className="font-bold text-slate-950">From:</span>{" "}
                    {ride.pickup}
                  </p>
                  <p>
                    <span className="font-bold text-slate-950">To:</span>{" "}
                    {ride.destination}
                  </p>
                  <p>
                    <span className="font-bold text-slate-950">Driver:</span>{" "}
                    {ride.driver?.driverName ?? "Finding driver"}
                    {ride.driver?.vehicleName ? ` | ${ride.driver.vehicleName}` : ""}
                  </p>
                  <p>
                    <span className="font-bold text-slate-950">Plate:</span>{" "}
                    {ride.driver?.numberPlate ?? "-"}
                  </p>
                </div>
              </div>

              {ride.status !== "complete" ? (
                <button
                  onClick={cancelRide}
                  disabled={submitting}
                  className="w-full rounded-2xl border border-violet-200 px-4 py-3 text-sm font-bold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Updating..." : "Cancel ride"}
                </button>
              ) : (
                <div className="space-y-4 rounded-[26px] border border-violet-100 bg-white p-4 shadow-sm">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      Ride complete. Review driver
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <select
                        value={reviewForm.rating}
                        onChange={(event) =>
                          setReviewForm((current) => ({
                            ...current,
                            rating: event.target.value,
                          }))
                        }
                        className="rounded-2xl border border-violet-100 px-4 py-3 text-sm outline-none focus:border-violet-400"
                      >
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <option key={rating} value={rating}>
                            {rating} star
                          </option>
                        ))}
                      </select>
                      <select
                        value={reviewForm.reason}
                        onChange={(event) =>
                          setReviewForm((current) => ({
                            ...current,
                            reason: event.target.value,
                          }))
                        }
                        className="rounded-2xl border border-violet-100 px-4 py-3 text-sm outline-none focus:border-violet-400"
                      >
                        {reviewReasons.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={submitReview}
                      disabled={submitting}
                      className="mt-3 w-full rounded-2xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:bg-violet-300"
                    >
                      Submit review
                    </button>
                  </div>

                  {ride.driver ? (
                    <div>
                      <textarea
                        value={complaintMessage}
                        onChange={(event) => setComplaintMessage(event.target.value)}
                        placeholder="Complaint likho agar issue hua..."
                        className="min-h-24 w-full rounded-2xl border border-violet-100 px-4 py-3 text-sm outline-none focus:border-violet-400"
                      />
                      <button
                        onClick={submitComplaint}
                        disabled={submitting || !complaintMessage.trim()}
                        className="mt-3 w-full rounded-2xl border border-violet-200 px-4 py-3 text-sm font-bold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Submit complaint
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              {ride.status === "complete" || ride.status === "cancelled" ? (
                <button
                  onClick={() => setRide(null)}
                  className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Book another ride
                </button>
              ) : null}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3">
                <PlacePicker
                  label="Pickup"
                  value={pickupQuery}
                  placeholder="Search pickup address"
                  helper="Address type karo ya current location button use karo."
                  onQueryChange={(value) => {
                    setPickupQuery(value);
                    setPickup((current) => ({ ...current, address: value }));
                  }}
                  onPlaceSelect={(place) => {
                    setPickupQuery(place.address);
                    setPickup({
                      address: place.address,
                      lat: place.lat,
                      lng: place.lng,
                    });
                  }}
                />

                <button
                  onClick={useCurrentLocation}
                  className="rounded-[24px] bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-violet-950"
                >
                  Use my current pickup location
                </button>
              </div>

              <PlacePicker
                label="Destination"
                value={destinationQuery}
                placeholder="Search drop address"
                helper="Suggestion select karte hi coordinates set ho jayenge."
                onQueryChange={setDestinationQuery}
                onPlaceSelect={(place) => {
                  setDestinationQuery(place.address);
                  setDestination(place);
                }}
              />

              <div className="grid gap-2 rounded-[22px] border border-violet-100 bg-violet-50 p-4 text-xs font-semibold text-violet-900">
                <p>
                  Pickup selected:{" "}
                  {pickup.lat && pickup.lng
                    ? `${pickup.address} (${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)})`
                    : "not set"}
                </p>
                <p>
                  Destination selected: {destination.address} (
                  {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)})
                </p>
              </div>

              <div className="grid gap-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      Choose a ride
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      Price pickup aur destination ke distance se estimate hota hai.
                    </p>
                  </div>
                  {routeDistanceKm ? (
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
                      {routeDistanceKm.toFixed(1)} km
                    </span>
                  ) : null}
                </div>

                {rideOptions.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id)}
                    className={`flex items-center gap-4 rounded-[24px] border p-4 text-left transition ${
                      categoryId === category.id
                        ? "border-violet-500 bg-violet-50 shadow-[0_16px_45px_rgba(124,58,237,0.16)]"
                        : "border-violet-100 bg-white hover:border-violet-300"
                    }`}
                  >
                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-sm">
                      {vehicleIcon(category.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-black text-slate-950">
                        {category.name}
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        {category.capacity} seats | {category.eta ? `${category.eta} min` : "Set pickup"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-950">
                        {category.fare ? `Rs. ${category.fare}` : "--"}
                      </p>
                      <p className="text-xs font-semibold text-violet-600">
                        {categoryId === category.id ? "Selected" : "Select"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={requestRide}
                disabled={submitting || loading || !pickup.lat || !pickup.lng}
                className="w-full rounded-[24px] bg-violet-600 px-5 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(124,58,237,0.28)] transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
              >
                {submitting ? "Finding driver..." : "Book ride"}
              </button>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-[38px] bg-white p-2 shadow-[0_30px_90px_rgba(88,28,135,0.16)] ring-1 ring-violet-100">
          <RideMap
            pickup={pickupPoint}
            destination={destinationPoint}
            vehicle={vehiclePoint || null}
            vehicleTarget={vehicleTargetPoint}
            animateVehicleKey={ride?.driver ? `${ride.id}-${ride.status}` : null}
            className="min-h-[76vh] rounded-[32px]"
          />
        </section>
      </div>
    </main>
  );
}
