"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/app/components/app-shell";
import PlacePicker from "@/app/components/place-picker";

interface Category {
  id: string;
  name: string;
  capacity: number;
  baseFare: number;
  perKmRate: number;
}

export default function BecomeDriver() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serviceLocationQuery, setServiceLocationQuery] = useState("");

  const [form, setForm] = useState({
    categoryId: "",
    vehicleName: "",
    numberPlate: "",
    driverName: "",
    driverImage: null as File | null,
    latitude: null as number | null,
    longitude: null as number | null,
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/controllers/category");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Categories load nahi hui");
        }

        setCategories(data.categories ?? []);

        if (data.categories?.length) {
          setForm((current) => ({
            ...current,
            categoryId: current.categoryId || data.categories[0].id,
          }));
        }
      } catch (categoryError) {
        const message =
          categoryError instanceof Error
            ? categoryError.message
            : "Categories load nahi hui";
        setError(message);
      }
    };

    loadCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setForm({ ...form, driverImage: e.target.files[0] });
    }
  };

  const useCurrentLocation = () => {
    setError(null);
    setNotice("Driver location permission maang rahe hain...");

    if (!navigator.geolocation) {
      setNotice(null);
      setError("Browser geolocation support nahi kar raha.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setNotice("Driver location set ho gayi.");
      },
      () => {
        setNotice(null);
        setError("Location deny ho gayi. Driver matching ke liye location allow karo.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = async () => {
    if (!form.categoryId || !form.driverName || !form.vehicleName) {
      setError("Driver name, vehicle name aur category required hai.");
      return;
    }

    if (form.latitude === null || form.longitude === null) {
      setError("Pehle driver location set karo.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("categoryId", form.categoryId);
      formData.append("driverName", form.driverName);
      formData.append("vehicleName", form.vehicleName);
      formData.append("numberPlate", form.numberPlate);
      formData.append("isOnline", "true");
      formData.append("rating", "0");
      formData.append("latitude", String(form.latitude));
      formData.append("longitude", String(form.longitude));

      if (form.driverImage) {
        formData.append("driverImage", form.driverImage);
      }

      const res = await fetch("/api/controllers/driver", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Driver profile create nahi hua");
      }

      setNotice("Driver profile ready hai. Pickup board open ho raha hai...");
      router.push("/driver/pickup");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Driver profile create nahi hua";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Driver setup"
      subtitle="Create or update your driver identity, vehicle, and live service area before going online."
    >
      <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-[34px] bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500 p-6 text-white shadow-[0_26px_80px_rgba(88,28,135,0.2)]">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-violet-100">
            Driver onboarding
          </p>
          <h3 className="mt-3 text-4xl font-black tracking-tight">
            Go online with a cleaner driver dashboard.
          </h3>
          <p className="mt-4 text-sm leading-7 text-violet-50">
            Setup complete karne ke baad `/driver/pickup` board par assigned ride,
            map, OTP verification, aur live route sab ek jagah dikhega.
          </p>
        </div>

        <div className="rounded-[34px] border border-violet-100 bg-white p-5 shadow-[0_26px_80px_rgba(88,28,135,0.14)]">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {notice ? (
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-700">
              {notice}
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-black text-slate-700 sm:col-span-2">
              Vehicle category
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="rounded-2xl border border-violet-100 px-4 py-3 font-medium outline-none focus:border-violet-400"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} | {category.capacity} seats
                  </option>
                ))}
              </select>
            </label>

            <input
              name="driverName"
              placeholder="Driver full name"
              value={form.driverName}
              onChange={handleChange}
              className="rounded-2xl border border-violet-100 px-4 py-3 text-sm outline-none focus:border-violet-400"
            />
            <input
              name="vehicleName"
              placeholder="Vehicle name"
              value={form.vehicleName}
              onChange={handleChange}
              className="rounded-2xl border border-violet-100 px-4 py-3 text-sm outline-none focus:border-violet-400"
            />
            <input
              name="numberPlate"
              placeholder="Number plate"
              value={form.numberPlate}
              onChange={handleChange}
              className="rounded-2xl border border-violet-100 px-4 py-3 text-sm outline-none focus:border-violet-400 sm:col-span-2"
            />

            <label className="rounded-2xl border border-dashed border-violet-200 px-4 py-3 text-sm text-slate-500 sm:col-span-2">
              Optional driver photo
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-2 block w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:font-bold file:text-violet-700"
              />
            </label>

            <button
              onClick={useCurrentLocation}
              className="rounded-[22px] bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-violet-950 sm:col-span-2"
            >
              {form.latitude && form.longitude
                ? `Location ready (${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)})`
                : "Use current driver location"}
            </button>

            <div className="sm:col-span-2">
              <PlacePicker
                label="Driver service location"
                value={serviceLocationQuery}
                placeholder="Search your street, gali, or area"
                helper="GPS off hai to address select karke service location set karo."
                onQueryChange={setServiceLocationQuery}
                onPlaceSelect={(place) => {
                  setServiceLocationQuery(place.address);
                  setForm((current) => ({
                    ...current,
                    latitude: place.lat,
                    longitude: place.lng,
                  }));
                  setNotice("Driver service location set ho gayi.");
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-[22px] bg-violet-600 px-5 py-4 text-sm font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300 sm:col-span-2"
            >
              {loading ? "Saving driver..." : "Save and go online"}
            </button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
