"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);

    try {
      await fetch("/api/controllers/logout", {
        method: "POST",
      });
      router.push("/auth");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={
        className ??
        "rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-black text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
