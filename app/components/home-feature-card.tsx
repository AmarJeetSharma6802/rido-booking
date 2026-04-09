interface HomeFeatureCardProps {
  title: string;
  description: string;
}

export default function HomeFeatureCard({
  title,
  description,
}: HomeFeatureCardProps) {
  return (
    <div className="rounded-[28px] border border-violet-100 bg-white p-6 shadow-[0_22px_70px_rgba(88,28,135,0.12)]">
      <p className="text-sm font-black uppercase tracking-[0.24em] text-violet-500">
        {title}
      </p>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}
