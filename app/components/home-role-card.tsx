import Link from "next/link";

interface HomeRoleCardProps {
  badge: string;
  title: string;
  description: string;
  href: string;
  action: string;
  tone?: "violet" | "fuchsia";
}

export default function HomeRoleCard({
  badge,
  title,
  description,
  href,
  action,
  tone = "violet",
}: HomeRoleCardProps) {
  const badgeClass =
    tone === "fuchsia"
      ? "bg-fuchsia-100 text-fuchsia-700"
      : "bg-violet-100 text-violet-700";
  const buttonClass =
    tone === "fuchsia"
      ? "bg-fuchsia-600 hover:bg-fuchsia-700"
      : "bg-violet-600 hover:bg-violet-700";

  return (
    <Link
      href={href}
      className="group rounded-[34px] border border-violet-100 bg-white p-7 shadow-[0_26px_80px_rgba(88,28,135,0.14)] transition hover:-translate-y-1 hover:border-violet-300"
    >
      <span
        className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${badgeClass}`}
      >
        {badge}
      </span>
      <h3 className="mt-5 text-3xl font-black text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
      <span
        className={`mt-6 inline-flex rounded-full px-5 py-3 text-sm font-black text-white transition ${buttonClass}`}
      >
        {action}
      </span>
    </Link>
  );
}
