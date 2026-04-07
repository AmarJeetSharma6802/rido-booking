"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  const [form, setForm] = useState<{
    categoryId: string;
    vehicleName: string;
    numberPlate: string;
    driverName: string;
    driverImage: File | null;
    latitude: number | null;
    longitude: number | null;
  }>({
    categoryId: "",
    vehicleName: "",
    numberPlate: "",
    driverName: "",
    driverImage: null,
    latitude: null,
    longitude: null,
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
        setNotice("Driver location set ho gayi. Ab aap nearby rides receive kar sakte ho.");
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
      setError("Pehle driver current location set karo.");
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
    <main className="min-h-screen bg-[#f7f2ff] px-4 py-6 text-slate-950">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.9fr,1.1fr]">
        <section className="rounded-[38px] bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500 p-8 text-white shadow-[0_30px_90px_rgba(88,28,135,0.25)]">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-violet-100">
            Driver setup
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">
            Go online and accept nearby rides.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-violet-50">
            Driver tab mein location set karo. User jab ride book karega, backend
            nearest online driver ko match karega aur pickup board par request
            dikhegi.
          </p>
          <div className="mt-8 grid gap-3 text-sm">
            {["Create profile", "Set live location", "Open pickup board"].map(
              (item, index) => (
                <div
                  key={item}
                  className="rounded-2xl bg-white/15 p-4 backdrop-blur"
                >
                  <span className="mr-3 rounded-full bg-white px-2 py-1 text-xs font-black text-violet-700">
                    {index + 1}
                  </span>
                  {item}
                </div>
              ),
            )}
          </div>
        </section>

        <section className="rounded-[38px] border border-violet-100 bg-white p-6 shadow-[0_30px_90px_rgba(88,28,135,0.16)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-500">
                Vehicle form
              </p>
              <h2 className="mt-2 text-3xl font-black">Become a driver</h2>
            </div>
            <button
              onClick={() => router.push("/driver/pickup")}
              className="rounded-full border border-violet-200 px-4 py-2 text-xs font-black text-violet-700 transition hover:bg-violet-50"
            >
              Pickup board
            </button>
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

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Vehicle category
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="rounded-2xl border border-violet-100 px-4 py-3 font-medium outline-none transition focus:border-violet-400"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} | {category.capacity} seats
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="driverName"
                placeholder="Driver full name"
                value={form.driverName}
                onChange={handleChange}
                className="rounded-2xl border border-violet-100 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
              />
              <input
                name="vehicleName"
                placeholder="Vehicle name"
                value={form.vehicleName}
                onChange={handleChange}
                className="rounded-2xl border border-violet-100 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
              />
              <input
                name="numberPlate"
                placeholder="Number plate"
                value={form.numberPlate}
                onChange={handleChange}
                className="rounded-2xl border border-violet-100 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
              />
              <label className="rounded-2xl border border-dashed border-violet-200 px-4 py-3 text-sm text-slate-500">
                Optional driver photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-2 block w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:font-bold file:text-violet-700"
                />
              </label>
            </div>

            <button
              onClick={useCurrentLocation}
              className="rounded-[24px] bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-violet-950"
            >
              {form.latitude && form.longitude
                ? `Location ready (${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)})`
                : "Use current driver location"}
            </button>

            <PlacePicker
              label="Driver service location"
              value={serviceLocationQuery}
              placeholder="Search your online area"
              helper="GPS off hai to address select karke driver location set karo."
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

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-[24px] bg-violet-600 px-5 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(124,58,237,0.28)] transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
            >
              {loading ? "Saving driver..." : "Save and go online"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
