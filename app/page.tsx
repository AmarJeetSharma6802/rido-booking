import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f7f2ff] px-4 py-6 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] max-w-6xl items-center">
        <div className="grid w-full gap-5 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-[44px] bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500 p-8 text-white shadow-[0_30px_90px_rgba(88,28,135,0.25)]">
            <p className="text-xs font-black uppercase tracking-[0.34em] text-violet-100">
              Rideflow
            </p>
            <h1 className="mt-5 max-w-3xl text-6xl font-black tracking-tight">
              A lightweight ride booking app for users and drivers.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-violet-50">
              User real pickup location se ride book karega. Driver online
              location sync karke assigned ride accept karega.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/auth"
                className="rounded-full bg-white px-6 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-50"
              >
                Login / Register
              </Link>
              <Link
                href="/driver/pickup"
                className="rounded-full bg-violet-950/60 px-6 py-3 text-sm font-black text-white transition hover:bg-violet-950"
              >
                Driver board
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              "Current-location pickup",
              "Nearest online driver match",
              "Driver accept and complete ride",
              "Review and complaint after completion",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[28px] border border-violet-100 bg-white p-6 text-lg font-black shadow-[0_22px_70px_rgba(88,28,135,0.12)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
