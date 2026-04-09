"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface AppShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

interface MeResponse {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

const navItems = [
  { href: "/user", label: "Book Ride" },
  { href: "/driver", label: "Driver Setup" },
  { href: "/driver/pickup", label: "Driver Board" },
  { href: "/map", label: "Full Map" },
];

export default function AppShell({ title, subtitle, children }: AppShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [me, setMe] = useState<MeResponse["user"] | null>(null);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const response = await fetch("/api/controllers/me");
        const result = await response.json();

        if (response.ok) {
          setMe(result.user ?? null);
        }
      } catch {
        setMe(null);
      }
    };

    loadMe();
  }, []);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="rounded-[28px] bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500 p-5 text-white shadow-[0_18px_50px_rgba(88,28,135,0.26)]">
        <p className="text-xs font-black uppercase tracking-[0.34em] text-violet-100">
          RIDO BOOKING
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight">Control panel</h2>
        <p className="mt-2 text-sm leading-6 text-violet-50">
          Search, book, track, and drive from one responsive dashboard.
        </p>
      </div>

      <nav className="mt-6 grid gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                isActive
                  ? "bg-violet-600 text-white shadow-[0_14px_32px_rgba(124,58,237,0.26)]"
                  : "bg-white text-slate-700 hover:bg-violet-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-[24px] border border-violet-100 bg-white p-4 text-sm text-slate-600">
        <p className="font-black text-slate-950">Signed in</p>
        <p className="mt-2">{me?.name ?? "Guest"}</p>
        <p className="text-xs text-slate-500">{me?.email ?? "Login required"}</p>
        <p className="mt-2 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
          {me?.role ?? "visitor"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f1ff] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-violet-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-11 w-11 flex-col items-center justify-center gap-1 rounded-2xl border border-violet-200 bg-white text-violet-700 lg:hidden"
            >
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </button>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-violet-500">
                Live ride dashboard
              </p>
              <h1 className="text-2xl font-black tracking-tight">{title}</h1>
            </div>
          </div>

          <div className="hidden items-center gap-3 rounded-full border border-violet-100 bg-white px-4 py-2 shadow-sm md:flex">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-violet-100 text-sm font-black text-violet-700">
              {(me?.name?.[0] ?? "R").toUpperCase()}
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-slate-950">{me?.name ?? "Ride User"}</p>
              <p className="text-xs text-slate-500">{me?.role ?? "guest"}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 lg:grid-cols-[290px,1fr] lg:px-6">
        <aside className="hidden lg:block">{sidebar}</aside>

        <main className="min-w-0 space-y-6">
          <section className="rounded-[32px] border border-violet-100 bg-white p-5 shadow-[0_24px_80px_rgba(88,28,135,0.12)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-500">
              Overview
            </p>
            <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight">{title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p>
              </div>
              <div className="rounded-full bg-violet-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-violet-700">
                Responsive mode
              </div>
            </div>
          </section>

          {children}
        </main>
      </div>

      <div
        className={`fixed inset-0 z-50 bg-slate-950/40 transition ${
          drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        } lg:hidden`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[290px] border-r border-violet-100 bg-[#f5f1ff] p-4 shadow-[0_26px_80px_rgba(15,23,42,0.2)] transition-transform duration-300 lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="mb-4 rounded-full border border-violet-200 bg-white px-4 py-2 text-xs font-black text-violet-700"
        >
          Close
        </button>
        {sidebar}
      </aside>
    </div>
  );
}
