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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const action = mode;

    try {
      const res = await fetch("/api/controllers/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            ...form,
        //   name: form.name,
        //   email: form.email,
        //   password: form.password,
        //   otp: form.otp,
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
          router.push("/driver");
        } else {
          router.push("/user");
        }
      }
    } catch (error) {
      console.error("Auth submit error:", error);
      alert("Server response parse nahi ho paya. Console mein exact error check karo.");
    }
  };

  return (
    <div className="w-[350px] p-6 border rounded space-y-4 shadow-lg">
      <h2 className="text-2xl font-bold text-center">
        {mode === "login" && "Login"}
        {mode === "register" && "Register"}
        {mode === "verify-otp" && "Verify OTP"}
      </h2>

      {mode === "register" && (
        <input
          name="name"
          placeholder="Full Name"
          onChange={handleChange}
          className="w-full border p-2"
        />
      )}

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

      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white w-full p-2 rounded"
      >
        {mode === "login" && "Login"}
        {mode === "register" && "Register"}
        {mode === "verify-otp" && "Verify OTP"}
      </button>

      {mode === "login" && (
        <p className="text-sm text-center">
          Don't have an account?{" "}
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
