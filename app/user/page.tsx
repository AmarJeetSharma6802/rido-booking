"use client";

import { useEffect, useState } from "react";
import AppShell from "@/app/components/app-shell";
import PlacePicker from "@/app/components/place-picker";
import RideMap, { MapPoint } from "@/app/components/ride-map";

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
  otp: string | null;
  isVerified: boolean;
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
  hasReview?: boolean;
  driver?: {
    id: string;
    driverName: string;
    vehicleName: string;
    numberPlate: string | null;
    latitude: number;
    longitude: number;
  };
}

type DestinationOption = {
  label: string;
  address: string;
  lat: number;
  lng: number;
};

const defaultDestination: DestinationOption = {
  label: "India Gate",
  address: "India Gate, New Delhi",
  lat: 28.6129,
  lng: 77.2295,
};

const reviewReasonOptions = [
  { value: "late_arrival", label: "Driver late aya" },
  { value: "wrong_pickup", label: "Wrong pickup point" },
  { value: "route_issue", label: "Route issue" },
  { value: "rude_behavior", label: "Rude behavior" },
  { value: "unsafe_driving", label: "Unsafe driving" },
  { value: "driving_on_call", label: "Driving while on call" },
  { value: "vehicle_not_clean", label: "Vehicle clean nahi tha" },
  { value: "extra_money_demand", label: "Extra money demand" },
  { value: "other", label: "Other issue" },
] as const;

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
  const [completedRide, setCompletedRide] = useState<ActiveRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewReason, setReviewReason] =
    useState<(typeof reviewReasonOptions)[number]["value"]>("late_arrival");
  const [complaintMessage, setComplaintMessage] = useState("");
  const [complaintSent, setComplaintSent] = useState(false);
  const [pickup, setPickup] = useState({
    address: "",
    lat: null as number | null,
    lng: null as number | null,
  });
  const [pickupQuery, setPickupQuery] = useState("");
  const [destination, setDestination] = useState<DestinationOption>(defaultDestination);
  const [destinationQuery, setDestinationQuery] = useState(defaultDestination.address);
  const [categoryId, setCategoryId] = useState("");
  const completedRideId = completedRide?.id;

  const loadRide = async () => {
    const rideResponse = await fetch("/api/controllers/rider/createAndupdate", {
      cache: "no-store",
    });
    const rideResult = await rideResponse.json();

    if (rideResponse.ok) {
      setRide(rideResult.data ?? null);
      setCompletedRide(rideResult.completedRide ?? null);
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
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!completedRideId) {
      return;
    }

    setReviewRating(5);
    setReviewReason("late_arrival");
    setComplaintMessage("");
    setComplaintSent(false);
  }, [completedRideId]);

  const routeDistanceKm =
    pickup.lat && pickup.lng
      ? getDistanceKm(pickup.lat, pickup.lng, destination.lat, destination.lng)
      : null;

  const rideOptions = categories.map((category) => ({
    ...category,
    fare: routeDistanceKm
      ? Math.round(category.baseFare + category.perKmRate * routeDistanceKm)
      : null,
    eta: routeDistanceKm ? Math.max(3, Math.round(routeDistanceKm * 2.4)) : null,
  }));

  const rideForDisplay = ride ?? completedRide;

  const pickupPoint = rideForDisplay
    ? toMapPoint("Pickup", rideForDisplay.pickupLatitude, rideForDisplay.pickupLongitude)
    : toMapPoint("Pickup", pickup.lat, pickup.lng);
  const destinationPoint = rideForDisplay
    ? toMapPoint("Destination", rideForDisplay.destinationLatitude, rideForDisplay.destinationLongitude)
    : toMapPoint("Destination", destination.lat, destination.lng);
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
    setNotice("Detecting current pickup...");

    if (!navigator.geolocation) {
      setNotice(null);
      setError("Browser geolocation support nahi kar raha.");
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
        setNotice("Current pickup location set ho gayi.");
      },
      () => {
        setNotice(null);
        setError("Location permission deny ho gayi. Address select ya current location allow karo.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const requestRide = async () => {
    if (!categoryId) {
      setError("Ride type select karo.");
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
        cache: "no-store",
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
      setCompletedRide(null);
      setNotice("Ride request send ho gayi. OTP driver ko start karne ke liye dena hoga.");
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Ride create nahi hui";
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
        cache: "no-store",
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
    if (!completedRide) {
      return;
    }

    setReviewSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/controllers/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rideId: completedRide.id,
          categoryId: completedRide.categoryId,
          rating: reviewRating,
          reason: reviewReason,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Review submit nahi hui");
      }

      setCompletedRide((currentRide) =>
        currentRide ? { ...currentRide, hasReview: true } : currentRide,
      );
      setNotice("Review save ho gayi. Thanks, isse ride quality better hogi.");
    } catch (reviewError) {
      const message =
        reviewError instanceof Error ? reviewError.message : "Review submit nahi hui";
      setError(message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const submitComplaint = async () => {
    if (!completedRide?.driver?.id) {
      setError("Driver information missing hai.");
      return;
    }

    if (!complaintMessage.trim()) {
      setError("Complaint message likho.");
      return;
    }

    setComplaintSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/controllers/complaint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          driverId: completedRide.driver.id,
          message: complaintMessage.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Complaint submit nahi hui");
      }

      setComplaintMessage("");
      setComplaintSent(true);
      setNotice("Complaint team ko send ho gayi.");
    } catch (complaintError) {
      const message =
        complaintError instanceof Error
          ? complaintError.message
          : "Complaint submit nahi hui";
      setError(message);
    } finally {
      setComplaintSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Book your ride"
      subtitle="Map on top, live trip flow, driver acceptance plus OTP start, and completed trip feedback in one clean rider app."
    >
      <section className="overflow-hidden rounded-[34px] border border-violet-100 bg-white p-3 shadow-[0_26px_80px_rgba(88,28,135,0.14)]">
        <RideMap
          pickup={pickupPoint}
          destination={destinationPoint}
          vehicle={vehiclePoint || null}
          vehicleTarget={vehicleTargetPoint}
          animateVehicleKey={
            ride?.driver ? `${ride.id}-${ride.status}-${ride.otp ?? "wait"}-${ride.isVerified}` : null
          }
          className="min-h-[42vh] rounded-[28px] md:min-h-[52vh]"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <section className="rounded-[34px] border border-violet-100 bg-white p-5 shadow-[0_26px_80px_rgba(88,28,135,0.14)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-500">
                Search panel
              </p>
              <h3 className="mt-2 text-2xl font-black">Pickup and destination</h3>
            </div>
            {routeDistanceKm ? (
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
                {routeDistanceKm.toFixed(1)} km route
              </span>
            ) : null}
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

          <div className="mt-5 grid gap-4">
            <PlacePicker
              label="Pickup"
              value={pickupQuery}
              placeholder="Search pickup street, gali, landmark"
              helper="Suggestion select karo ya Use this address dabao."
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
              className="rounded-[22px] bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-violet-950"
            >
              Use current pickup location
            </button>

            <PlacePicker
              label="Destination"
              value={destinationQuery}
              placeholder="Search destination street, gali, landmark"
              helper="Real street-level suggestions NCR area ke liye prefer kiye ja rahe hain."
              onQueryChange={setDestinationQuery}
              onPlaceSelect={(place) => {
                setDestinationQuery(place.address);
                setDestination(place);
              }}
            />

            <div className="rounded-[24px] border border-violet-100 bg-violet-50 p-4 text-xs font-semibold text-violet-900">
              <p>
                Pickup selected:{" "}
                {pickup.lat && pickup.lng
                  ? `${pickup.address} (${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)})`
                  : "not set"}
              </p>
              <p className="mt-2">
                Destination selected: {destination.address} (
                {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)})
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[34px] border border-violet-100 bg-white p-5 shadow-[0_26px_80px_rgba(88,28,135,0.14)]">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-500">
            Ride options
          </p>
          <h3 className="mt-2 text-2xl font-black">Choose your vehicle</h3>

          <div className="mt-5 grid gap-3">
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
                  <p className="text-base font-black text-slate-950">{category.name}</p>
                  <p className="text-xs font-semibold text-slate-500">
                    {category.capacity} seats | {category.eta ? `${category.eta} min away` : "Select route"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-slate-950">
                    {category.fare ? `Rs. ${category.fare}` : "--"}
                  </p>
                  <p className="text-xs font-semibold text-violet-600">
                    {categoryId === category.id ? "Selected" : "Tap to choose"}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {!ride ? (
            <button
              onClick={requestRide}
              disabled={submitting || loading || !pickup.lat || !pickup.lng}
              className="mt-5 w-full rounded-[24px] bg-violet-600 px-5 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(124,58,237,0.28)] transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
            >
              {submitting ? "Creating ride..." : "Book ride"}
            </button>
          ) : null}
        </section>
      </div>

      {ride ? (
        <section className="grid gap-6 xl:grid-cols-[1fr,0.95fr]">
          <div className="rounded-[34px] border border-violet-100 bg-white p-5 shadow-[0_26px_80px_rgba(88,28,135,0.14)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-500">
                  Active ride
                </p>
                <h3 className="mt-2 text-3xl font-black capitalize">{ride.status}</h3>
              </div>
              <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-black text-violet-700">
                Rs. {ride.estimatedFare?.toFixed(0) ?? "-"}
              </span>
            </div>

            <div className="mt-5 grid gap-4 rounded-[26px] bg-violet-50 p-5 text-sm text-slate-700">
              <p><span className="font-black text-slate-950">From:</span> {ride.pickup}</p>
              <p><span className="font-black text-slate-950">To:</span> {ride.destination}</p>
              <p><span className="font-black text-slate-950">Driver:</span> {ride.driver?.driverName ?? "Finding driver"}</p>
              <p><span className="font-black text-slate-950">Vehicle:</span> {ride.driver?.vehicleName ?? "-"}</p>
              <p><span className="font-black text-slate-950">Plate:</span> {ride.driver?.numberPlate ?? "-"}</p>
              <p><span className="font-black text-slate-950">Distance:</span> {ride.estimatedDistanceKm?.toFixed(2) ?? "-"} km</p>
            </div>

            <button
              onClick={cancelRide}
              disabled={submitting}
              className="mt-5 w-full rounded-[22px] border border-violet-200 px-4 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Updating..." : "Cancel ride"}
            </button>
          </div>

          <div className="rounded-[34px] border border-violet-100 bg-white p-5 shadow-[0_26px_80px_rgba(88,28,135,0.14)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-500">
              Trip OTP
            </p>
            <h3 className="mt-2 text-2xl font-black">Share this with driver</h3>
            <p className="mt-2 text-sm text-slate-600">
              Driver ride start tabhi kar payega jab wo ye OTP enter karega.
            </p>

            <div className="mt-5 rounded-[28px] bg-gradient-to-br from-violet-700 to-fuchsia-500 p-6 text-white shadow-[0_22px_60px_rgba(88,28,135,0.24)]">
              <p className="text-xs font-black uppercase tracking-[0.34em] text-violet-100">
                Rider security code
              </p>
              <p className="mt-4 text-6xl font-black tracking-[0.32em]">
                {ride.otp ?? "WAIT"}
              </p>
              <p className="mt-4 text-sm text-violet-50">
                {!ride.otp
                  ? "Driver accept karega, tab OTP yahan show hogi."
                  : ride.isVerified
                  ? "Driver ne OTP verify kar li. Trip officially start ho chuki hai."
                  : "OTP verify hone tak trip final start nahi hogi."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {!ride && completedRide ? (
        <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="rounded-[34px] border border-emerald-100 bg-white p-5 shadow-[0_26px_80px_rgba(16,185,129,0.14)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-500">
                  Trip completed
                </p>
                <h3 className="mt-2 text-3xl font-black">How was your ride?</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Driver details aur trip summary yahan hai. Quick review se app aur real lagega.
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
                Rs. {completedRide.estimatedFare?.toFixed(0) ?? "-"}
              </span>
            </div>

            <div className="mt-5 grid gap-3 rounded-[26px] bg-emerald-50 p-5 text-sm text-slate-700">
              <p><span className="font-black text-slate-950">From:</span> {completedRide.pickup}</p>
              <p><span className="font-black text-slate-950">To:</span> {completedRide.destination}</p>
              <p><span className="font-black text-slate-950">Driver:</span> {completedRide.driver?.driverName ?? "-"}</p>
              <p><span className="font-black text-slate-950">Vehicle:</span> {completedRide.driver?.vehicleName ?? "-"}</p>
              <p><span className="font-black text-slate-950">Plate:</span> {completedRide.driver?.numberPlate ?? "-"}</p>
              <p><span className="font-black text-slate-950">Distance:</span> {completedRide.estimatedDistanceKm?.toFixed(2) ?? "-"} km</p>
            </div>

            {completedRide.hasReview ? (
              <div className="mt-5 rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                Review already submit ho chuki hai. Aap turant next ride book kar sakte ho.
              </div>
            ) : (
              <>
                <div className="mt-5">
                  <p className="text-sm font-black text-slate-900">Driver rating</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {[1, 2, 3, 4, 5].map((ratingValue) => (
                      <button
                        key={ratingValue}
                        type="button"
                        onClick={() => setReviewRating(ratingValue)}
                        className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                          reviewRating === ratingValue
                            ? "bg-emerald-600 text-white shadow-[0_16px_30px_rgba(5,150,105,0.24)]"
                            : "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {ratingValue} / 5
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <label className="text-sm font-black text-slate-900">
                    Review reason
                  </label>
                  <select
                    value={reviewReason}
                    onChange={(event) =>
                      setReviewReason(
                        event.target.value as (typeof reviewReasonOptions)[number]["value"],
                      )
                    }
                    className="mt-3 w-full rounded-[22px] border border-emerald-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500"
                  >
                    {reviewReasonOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={submitReview}
                  disabled={reviewSubmitting}
                  className="mt-5 w-full rounded-[22px] bg-emerald-600 px-4 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {reviewSubmitting ? "Submitting review..." : "Submit review"}
                </button>
              </>
            )}
          </div>

          <div className="rounded-[34px] border border-amber-100 bg-white p-5 shadow-[0_26px_80px_rgba(217,119,6,0.12)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-500">
              Help and complaint
            </p>
            <h3 className="mt-2 text-3xl font-black">Raise an issue</h3>
            <p className="mt-2 text-sm text-slate-600">
              Agar overcharge, rude behavior, ya pickup-route issue hua ho to yahan likh do.
            </p>

            <div className="mt-5 rounded-[26px] bg-amber-50 p-5 text-sm text-slate-700">
              <p><span className="font-black text-slate-950">Assigned driver:</span> {completedRide.driver?.driverName ?? "-"}</p>
              <p className="mt-2"><span className="font-black text-slate-950">Vehicle:</span> {completedRide.driver?.vehicleName ?? "-"}</p>
              <p className="mt-2"><span className="font-black text-slate-950">Number plate:</span> {completedRide.driver?.numberPlate ?? "-"}</p>
            </div>

            {complaintSent ? (
              <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                Complaint submit ho gayi. Team is ride ko manually review kar sakti hai.
              </div>
            ) : null}

            <textarea
              value={complaintMessage}
              onChange={(event) => setComplaintMessage(event.target.value)}
              placeholder="Example: driver ne extra cash demand ki, wrong lane li, ya rude behavior tha..."
              className="mt-5 min-h-40 w-full rounded-[24px] border border-amber-200 bg-white px-4 py-4 text-sm font-medium text-slate-900 outline-none transition focus:border-amber-500"
            />

            <button
              onClick={submitComplaint}
              disabled={complaintSubmitting}
              className="mt-5 w-full rounded-[22px] bg-slate-950 px-4 py-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {complaintSubmitting ? "Submitting complaint..." : "Submit complaint"}
            </button>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
