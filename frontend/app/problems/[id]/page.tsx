"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AppShell } from "../../../components/AppShell";
import { LifecycleStepper } from "../../../components/LifecycleStepper";
import { ErrorAlert, LoadingState, Panel, StatusBadge } from "../../../components/ui";
import { apiRequest, type Problem } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

export default function ProblemDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { accessToken, user, loading } = useAuth();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiRequest<Problem>(`/problems/${id}`, undefined, accessToken)
      .then(setProblem)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Unable to load problem"));
  }, [accessToken, id]);

  if (loading || !user || !accessToken) return <LoadingState label="Loading problem" />;
  const backPath = user.role === "MINISTRY_ADMIN" ? "/ministry/problems" : "/my-problems";
  if (error) return <AppShell><ErrorAlert message={error} /></AppShell>;
  if (!problem) return <AppShell><LoadingState label="Loading problem" /></AppShell>;

  return (
    <AppShell>
      <Link className="inline-flex rounded-lg text-sm font-semibold text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" href={backPath}>← Back to workspace</Link>
      <div className="mt-5">
        <LifecycleStepper currentStatus={problem.currentStatus} />
      </div>
      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="page-eyebrow">{problem.category?.name ?? "Uncategorized"}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">{problem.title}</h1>
            </div>
            <StatusBadge status={problem.currentStatus} />
          </div>
          <p className="mt-6 whitespace-pre-wrap text-base leading-7 text-slate-700">{problem.description}</p>
          <dl className="mt-8 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
            <Info label="Location" value={[problem.villageLocality, problem.block, problem.district, problem.location].filter(Boolean).join(", ") || "Not specified"} />
            <Info label="Priority" value={problem.priority ?? "Not specified"} />
            <Info label="Desired outcome" value={problem.desiredOutcome ?? "Not specified"} />
            <Info label="Submitted" value={new Date(problem.submittedAt).toLocaleString()} />
          </dl>
          {problem.supportingInformation ? <section className="mt-8 border-t border-slate-100 pt-6"><h2 className="text-lg font-bold text-ink">Supporting information</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{problem.supportingInformation}</p></section> : null}
          {problem.evidence?.length ? <section className="mt-8 border-t border-slate-100 pt-6"><h2 className="text-lg font-bold text-ink">Evidence</h2><ul className="mt-3 space-y-2">{problem.evidence.map((item) => <li className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm" key={item.id ?? item.title}><span className="status-badge status-neutral">{item.type}</span><span className="text-slate-700">{item.title}</span>{item.externalUrl ? <a className="font-semibold text-accent underline underline-offset-2" href={item.externalUrl} rel="noreferrer">Open</a> : null}</li>)}</ul></section> : null}
        </Panel>
        <Timeline entries={problem.timeline ?? []} />
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 text-sm leading-6 text-slate-700">{value}</dd></div>;
}

function Timeline({ entries }: { entries: NonNullable<Problem["timeline"]> }) {
  return (
    <Panel>
      <p className="section-eyebrow">Audit trail</p>
      <h2 className="section-title">Lifecycle timeline</h2>
      {entries.length ? <div className="mt-6 space-y-6">{entries.map((entry, index) => <div className="relative pl-7" key={entry.id}><span className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-accent shadow ring-1 ring-accent" aria-hidden="true" />{index < entries.length - 1 ? <span className="absolute left-1.5 top-4 h-full w-px bg-slate-200" aria-hidden="true" /> : null}<p className="text-sm font-bold text-ink">{entry.newStatus.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString()}</p>{entry.reason ? <p className="mt-2 text-sm leading-5 text-slate-600">{entry.reason}</p> : null}{entry.actor ? <p className="mt-2 text-xs font-medium text-slate-500">By {entry.actor.displayName}</p> : null}</div>)}</div> : <p className="mt-5 text-sm text-slate-500">No lifecycle events recorded yet.</p>}
    </Panel>
  );
}
