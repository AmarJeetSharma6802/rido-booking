"use client";

import { useRouter } from "next/navigation";

export default function ChooseRolePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#f7f2ff] px-4 py-6 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-6xl items-center">
        <section className="grid w-full gap-5 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="rounded-[40px] bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500 p-8 text-white shadow-[0_30px_90px_rgba(88,28,135,0.25)]">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-violet-100">
              Welcome
            </p>
            <h1 className="mt-4 text-5xl font-black tracking-tight">
              Choose how you want to ride today.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-violet-50">
              Riders can book from their current location, and drivers can go
              online to accept nearby trips.
            </p>
          </div>

          <div className="grid gap-4">
            <button
              onClick={() => router.push("/user")}
              className="group rounded-[36px] border border-violet-100 bg-white p-7 text-left shadow-[0_26px_80px_rgba(88,28,135,0.14)] transition hover:-translate-y-1 hover:border-violet-300"
            >
              <span className="rounded-full bg-violet-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-violet-700">
                User
              </span>
              <h2 className="mt-5 text-3xl font-black">Book a ride</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Set your current location, choose a destination, and send a
                booking request to a nearby driver.
              </p>
              <span className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition group-hover:bg-violet-700">
                Continue as user
              </span>
            </button>

            <button
              onClick={() => router.push("/driver")}
              className="group rounded-[36px] border border-violet-100 bg-white p-7 text-left shadow-[0_26px_80px_rgba(88,28,135,0.14)] transition hover:-translate-y-1 hover:border-violet-300"
            >
              <span className="rounded-full bg-fuchsia-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-fuchsia-700">
                Driver
              </span>
              <h2 className="mt-5 text-3xl font-black">Go online</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Complete the vehicle details, go online, and accept assigned
                pending rides from the pickup board.
              </p>
              <span className="mt-6 inline-flex rounded-full bg-violet-600 px-5 py-3 text-sm font-black text-white transition group-hover:bg-violet-700">
                Continue as driver
              </span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
