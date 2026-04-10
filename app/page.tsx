import Image from "next/image";
import Link from "next/link";

const featureItems = [
  "Login and choose a role",
  "Set pickup and drop, then book a ride",
  "Driver accepts the ride and verifies the OTP",
  "Send a review or complaint after the trip",
];

const quickLinks = [
  { href: "/auth", label: "Login / Register", primary: true },
  { href: "/user", label: "Open user app" },
  { href: "/driver", label: "Open driver setup" },
  { href: "/driver/pickup", label: "Open driver board" },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f7f2ff] px-4 py-6 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] max-w-6xl items-center">
        <div className="grid w-full gap-5 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-[44px] bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500 p-8 text-white shadow-[0_30px_90px_rgba(88,28,135,0.25)]">
            <div className="flex items-center gap-4">
              <div className="overflow-hidden rounded-[24px] bg-violet-900/35 p-3 ring-1 ring-white/20 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-sm">
                <Image
                  src="/transparent-logo.png"
                  alt="RIDO BOOKING logo"
                  width={72}
                  height={72}
                  className="h-14 w-auto object-contain"
                  priority
                />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.34em] text-violet-100">
                  RIDO BOOKING
                </p>
                <p className="mt-1 text-sm font-semibold text-violet-100/85">
                  Ride booking platform
                </p>
              </div>
            </div>
            

            <div className="mt-8 flex flex-wrap gap-3">
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    item.primary
                      ? "rounded-full bg-white px-6 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-50"
                      : "rounded-full bg-violet-950/60 px-6 py-3 text-sm font-black text-white transition hover:bg-violet-950"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </div>

            
          </div>

          <div className="grid gap-4">
            {featureItems.map((item) => (
              <div
                key={item}
                className="rounded-[28px] border border-violet-100 bg-white p-6 text-lg font-black shadow-[0_22px_70px_rgba(88,28,135,0.12)]"
              >
                {item}
              </div>
            ))}

            <div className="rounded-[28px] border border-violet-100 bg-white p-6 shadow-[0_22px_70px_rgba(88,28,135,0.12)]">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-500">
                Simple flow
              </p>
              <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-700">
                <p>1. Login / Register</p>
                <p>2. Choose your role</p>
                <p>3. Book a ride or complete driver setup</p>
                <p>4. Driver accepts, verifies OTP, and starts the trip</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
