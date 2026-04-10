"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register" | "verify-otp";

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [authReason, setAuthReason] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    otp: "",
  });

  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAuthReason(params.get("reason"));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const action = mode;
    setLoading(true);

    try {
      const res = await fetch("/api/controllers/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          action,
        }),
      });

      const rawResponse = await res.text();
      const data = rawResponse ? JSON.parse(rawResponse) : {};

      alert(data.message ?? "Something went wrong");

      if (!res.ok) {
        return;
      }

      if (mode === "register") {
        setMode("verify-otp");
      }

      if (mode === "verify-otp") {
        router.push("/chooseRole");
      }

      if (mode === "login") {
        if (data.user?.role === "driver") {
          router.push("/driver/pickup");
        } else {
          router.push("/user");
        }
      }

      setForm({
        name: "",
        email: "",
        password: "",
        otp: "",
      });
    } catch (error) {
      console.error("Auth submit error:", error);
      alert("Server response parse nahi ho paya. Console mein exact error check karo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f2ff] px-4 py-6 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-48px)] max-w-6xl items-center gap-5 lg:grid-cols-[1fr,430px]">
        <section className="rounded-[42px] bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500 p-8 text-white shadow-[0_30px_90px_rgba(88,28,135,0.25)]">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-violet-100">
            Ride booking
          </p>
          <h1 className="mt-4 text-5xl font-black tracking-tight">
            A cleaner Uber-style flow for users and drivers.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-violet-50">
            Login ke baad user ride book karega. Driver online hoke current
            location sync karega aur assigned ride accept karega.
          </p>
        </section>

        <section className="rounded-[38px] border border-violet-100 bg-white p-6 shadow-[0_30px_90px_rgba(88,28,135,0.16)]">
          {authReason === "login-required" ? (
            <div className="mb-5 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm font-semibold text-violet-700">
              Please login first to continue booking your ride.
            </div>
          ) : null}
          <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-500">
            {mode === "login" && "Welcome back"}
            {mode === "register" && "Create account"}
            {mode === "verify-otp" && "Verify email"}
          </p>
          <h2 className="mt-2 text-3xl font-black">
            {mode === "login" && "Login"}
            {mode === "register" && "Register"}
            {mode === "verify-otp" && "Enter OTP"}
          </h2>

          <div className="mt-6 space-y-4">
            {mode === "register" && (
              <input
                name="name"
                placeholder="Full name"
                onChange={handleChange}
                value={form.name}
                className="w-full rounded-2xl border border-violet-100 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
              />
            )}

            {(mode === "login" || mode === "register") && (
              <>
                <input
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-violet-100 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                />

                <input
                  name="password"
                  type="password"
                  value={form.password}
                  placeholder="Password"
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-violet-100 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                />
              </>
            )}

            {mode === "verify-otp" && (
              <>
                <input
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-violet-100 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                />

                <input
                  name="otp"
                  value={form.otp}
                  placeholder="Enter OTP"
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-violet-100 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                />
              </>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full rounded-[24px] bg-violet-600 px-5 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(124,58,237,0.28)] transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
            >
              {loading && "Please wait..."}
              {!loading && mode === "login" && "Login"}
              {!loading && mode === "register" && "Register"}
              {!loading && mode === "verify-otp" && "Verify OTP"}
            </button>
          </div>

          {mode === "login" && (
            <p className="mt-5 text-center text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <button
                className="font-black text-violet-700"
                onClick={() => setMode("register")}
              >
                Register
              </button>
            </p>
          )}

          {mode === "register" && (
            <p className="mt-5 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <button
                className="font-black text-violet-700"
                onClick={() => setMode("login")}
              >
                Login
              </button>
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
