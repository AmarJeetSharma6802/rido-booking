"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register" | "verify-otp";

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    otp: "",
  });

  const router = useRouter();

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    let action = mode;

    const res = await fetch("/api/auth", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        action,
      }),
    });

    const data = await res.json();

    alert(data.message);

    // 🔥 Flow control
    if (mode === "register") {
      setMode("verify-otp");
    }

    if (mode === "verify-otp") {
      router.push("/dashboard");
    }

    if (mode === "login") {
      if (data.user.role === "driver") {
        router.push("/driver/dashboard");
      } else {
        router.push("/user/dashboard");
      }
    }
  };

  return (
    <div className="w-[350px] p-6 border rounded space-y-4 shadow-lg">
      <h2 className="text-2xl font-bold text-center">
        {mode === "login" && "Login"}
        {mode === "register" && "Register"}
        {mode === "verify-otp" && "Verify OTP"}
      </h2>

      {/* REGISTER */}
      {mode === "register" && (
        <input
          name="name"
          placeholder="Full Name"
          onChange={handleChange}
          className="w-full border p-2"
        />
      )}

      {/* EMAIL + PASSWORD */}
      {(mode === "login" || mode === "register") && (
        <>
          <input
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full border p-2"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full border p-2"
          />
        </>
      )}

      {/* OTP */}
      {mode === "verify-otp" && (
        <>
          <input
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full border p-2"
          />

          <input
            name="otp"
            placeholder="Enter OTP"
            onChange={handleChange}
            className="w-full border p-2"
          />
        </>
      )}

      {/* BUTTON */}
      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white w-full p-2 rounded"
      >
        {mode === "login" && "Login"}
        {mode === "register" && "Register"}
        {mode === "verify-otp" && "Verify OTP"}
      </button>

      {/* SWITCH LINKS */}
      {mode === "login" && (
        <p className="text-sm text-center">
          Don’t have an account?{" "}
          <span
            className="text-blue-600 cursor-pointer"
            onClick={() => setMode("register")}
          >
            Register
          </span>
        </p>
      )}

      {mode === "register" && (
        <p className="text-sm text-center">
          Already have an account?{" "}
          <span
            className="text-blue-600 cursor-pointer"
            onClick={() => setMode("login")}
          >
            Login
          </span>
        </p>
      )}
    </div>
  );
}