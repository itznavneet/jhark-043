import type { AnalyticsBucket } from "../lib/api";

export function AnalyticsBarList({
  title,
  items,
  empty = "No data available yet.",
}: {
  title: string;
  items: AnalyticsBucket[];
  empty?: string;
}) {
  const maximum = Math.max(...items.map((item) => item.value), 1);
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {items.length ? (
        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-slate-600">
                  {formatLabel(item.label)}
                </span>
                <span className="font-semibold text-ink">{item.value}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-accent transition-all"
                  style={{
                    width: `${Math.max((item.value / maximum) * 100, 3)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-slate-500">{empty}</p>
      )}
    </section>
  );
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}
