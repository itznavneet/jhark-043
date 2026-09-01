export function AnalyticsCard({
  label,
  value,
  detail,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  detail?: string;
  tone?: "slate" | "teal" | "amber" | "blue" | "rose";
}) {
  const tones = {
    slate: "bg-slate-50 text-slate-700",
    teal: "bg-teal-50 text-teal-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
        >
          KPI
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-ink">{value}</p>
      {detail ? <p className="mt-2 text-xs text-slate-500">{detail}</p> : null}
    </article>
  );
}
