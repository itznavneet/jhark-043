"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell } from "../../components/AppShell";
import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  formatStatus,
} from "../../components/ui";
import { apiRequest, type Problem } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const roleLabels: Record<string, string> = {
  SUBMITTER: "Community submitter",
  UNIVERSITY: "University partner",
  INDUSTRY: "Industry partner",
  MINISTRY_ADMIN: "Ministry administrator",
};

export default function ProfilePage() {
  const { accessToken, user, loading, updateProfile } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const loadProblems = useCallback(async () => {
    if (!accessToken || user?.role !== "SUBMITTER") return;
    try {
      setProblems(await apiRequest<Problem[]>("/problems/mine", undefined, accessToken));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load activity");
    }
  }, [accessToken, user?.role]);

  useEffect(() => {
    if (user) setName(user.displayName);
    void loadProblems();
  }, [loadProblems, user]);

  if (loading || !user || !accessToken) return <LoadingState label="Loading your profile" />;

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await updateProfile(name);
      setEditing(false);
      setSaved(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update your name");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Account & identity"
        title="Your profile"
        description="Manage your identity and keep your account information up to date."
        action={<span className="status-badge status-success"><span className="status-dot" />Active account</span>}
      />
      {error ? <div className="mt-6"><ErrorAlert message={error} /></div> : null}
      <div className="mt-7 max-w-4xl">
        <section className="panel p-6 sm:p-8" aria-labelledby="identity-title">
          <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-ink text-2xl font-black text-white">
              {user.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="section-eyebrow">Personal identity</p>
              <h2 className="mt-1 text-2xl font-bold text-ink" id="identity-title">{user.displayName}</h2>
              <p className="mt-1 text-sm text-slate-500">{roleLabels[user.role] ?? formatStatus(user.role)}</p>
            </div>
          </div>
          <form className="mt-6 space-y-4" onSubmit={saveName}>
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-bold text-ink">Profile details</h3>
              {!editing ? <SecondaryButton type="button" onClick={() => setEditing(true)}>Edit name</SecondaryButton> : null}
            </div>
            {editing ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <input className="w-full" required minLength={2} maxLength={160} value={name} onChange={(event) => setName(event.target.value)} aria-label="Display name" />
                <div className="flex gap-2">
                  <PrimaryButton disabled={busy} type="submit">{busy ? "Saving..." : "Save"}</PrimaryButton>
                  <SecondaryButton type="button" onClick={() => { setName(user.displayName); setEditing(false); }}>Cancel</SecondaryButton>
                </div>
              </div>
            ) : <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-ink">{user.displayName}</p>}
            <dl className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</dt><dd className="mt-1 text-sm font-medium text-ink">{user.email}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account type</dt><dd className="mt-1 text-sm font-medium text-ink">{roleLabels[user.role] ?? formatStatus(user.role)}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Organization</dt><dd className="mt-1 text-sm font-medium text-ink">{user.profile?.organizationName ?? user.profile?.name ?? "Independent account"}</dd></div>
            </dl>
            {saved ? <p className="text-sm font-semibold text-emerald-700" role="status">Your profile was updated.</p> : null}
          </form>
        </section>
      </div>

      <section className="mt-7" aria-labelledby="reports-title">
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="section-eyebrow">Reported by you</p><h2 className="section-title mt-1" id="reports-title">My submitted problems</h2></div><Link className="btn-primary" href="/my-problems">Report a problem</Link></div>
        {user.role !== "SUBMITTER" ? <EmptyState title="Activity is managed in your partner workspace" description="Open your workspace to see organization-specific activity." /> : problems.length === 0 ? <EmptyState title="No problems submitted yet" description="Your submitted community challenges will appear here." /> : <div className="grid gap-4 md:grid-cols-2">{problems.map((problem) => <Link key={problem.id} href={`/problems/${problem.id}`} className="panel block p-5 transition hover:-translate-y-0.5 hover:border-accent"><div className="flex items-start justify-between gap-3"><div><p className="page-eyebrow">{problem.category?.name ?? "Community challenge"}</p><h3 className="mt-1 font-bold text-ink">{problem.title}</h3></div><StatusBadge status={problem.currentStatus} /></div><p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{problem.description}</p><p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">{problem.district || problem.location || "Location not specified"} · Updated {new Date(problem.updatedAt).toLocaleDateString()}</p></Link>)}</div>}
      </section>
    </AppShell>
  );
}
