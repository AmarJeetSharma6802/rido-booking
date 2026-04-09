interface UserTripOtpCardProps {
  otp: string | null;
  isVerified: boolean;
}

export default function UserTripOtpCard({
  otp,
  isVerified,
}: UserTripOtpCardProps) {
  return (
    <div className="rounded-[34px] border border-violet-100 bg-white p-5 shadow-[0_26px_80px_rgba(88,28,135,0.14)]">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-500">
        Trip OTP
      </p>
      <h3 className="mt-2 text-2xl font-black">Share this with driver</h3>
      <p className="mt-2 text-sm text-slate-600">
        Driver ride start tabhi kar payega jab wo ye OTP enter karega.
      </p>

      <div className="mt-5 rounded-[28px] bg-gradient-to-br from-violet-700 to-fuchsia-500 p-6 text-white shadow-[0_22px_60px_rgba(88,28,135,0.24)]">
        <p className="text-xs font-black uppercase tracking-[0.34em] text-violet-100">
          Rider security code
        </p>
        <p className="mt-4 text-6xl font-black tracking-[0.32em]">
          {otp ?? "WAIT"}
        </p>
        <p className="mt-4 text-sm text-violet-50">
          {isVerified
            ? "Driver ne OTP verify kar li. Trip officially start ho chuki hai."
            : "Ye OTP driver ko tab deni hai jab wo ride accept kar le."}
        </p>
      </div>
    </div>
  );
}
