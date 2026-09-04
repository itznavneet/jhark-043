import type { PublicUser } from "../lib/api";
import { formatStatus } from "./ui";

export function ProfileCard({ user }: { user: PublicUser }) {
  const organization = user.profile?.organizationName ?? user.profile?.name;
  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm" aria-label="Signed-in profile">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy text-sm font-extrabold text-white" aria-hidden="true">{user.displayName.slice(0, 2).toUpperCase()}</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Signed in as</p>
            <h2 className="text-lg font-bold text-ink">{user.displayName}</h2>
          </div>
        </div>
        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-slate-500">Registered email</dt><dd className="font-medium text-slate-800">{user.email}</dd></div>
          <div><dt className="text-xs text-slate-500">Role</dt><dd className="font-medium text-slate-800">{formatStatus(user.role)}</dd></div>
          <div><dt className="text-xs text-slate-500">Organization</dt><dd className="font-medium text-slate-800">{organization ?? "Independent account"}</dd></div>
        </dl>
      </div>
    </section>
  );
}
