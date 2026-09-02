import Link from "next/link";

const links = [
  { label: "Problems", href: "/ministry/problems", available: true },
  { label: "Universities", href: "/ministry/universities", available: false },
  { label: "Industries", href: "/ministry/industries", available: false },
  {
    label: "Registration Applications",
    href: "/ministry/registrations",
    available: true,
  },
  {
    label: "AI Recommendations",
    href: "/ministry/problems#ai-recommendations",
    available: true,
  },
  { label: "Projects", href: "/projects", available: true },
  { label: "Analytics", href: "/ministry/analytics", available: true },
  { label: "Notifications", href: "/notifications", available: true },
];

export function MinistryNavigation() {
  return (
    <nav
      aria-label="Ministry administration"
      className="rounded-2xl bg-ink p-4 text-white shadow-sm"
    >
      <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
        Ministry control
      </p>
      <div className="mt-3 grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((link) =>
          link.available ? (
            <Link
              className="rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
              href={link.href}
              key={link.label}
            >
              {link.label}
            </Link>
          ) : (
            <span
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-400"
              key={link.label}
            >
              {link.label}
              <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-500">
                Planned
              </span>
            </span>
          ),
        )}
      </div>
    </nav>
  );
}
