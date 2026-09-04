"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../../../components/AppShell";
import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  Panel,
  PrimaryButton,
  SecondaryButton,
} from "../../../components/ui";
import {
  approveRegistrationApplication,
  listRegistrationApplications,
  rejectRegistrationApplication,
  type RegistrationApplication,
} from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

export default function RegistrationApplicationsPage() {
  const { accessToken, user, loading } = useAuth();
  const [applications, setApplications] = useState<RegistrationApplication[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setError(null);
      setApplications(await listRegistrationApplications(accessToken));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load applications",
      );
    }
  }, [accessToken]);
  useEffect(() => {
    void load();
  }, [load]);
  if (loading || !user || !accessToken)
    return <LoadingState label="Loading registration applications" />;
  if (user.role !== "MINISTRY_ADMIN")
    return (
      <AppShell>
        <ErrorAlert message="Ministry administrator access is required." />
      </AppShell>
    );
  async function decide(
    application: RegistrationApplication,
    action: "approve" | "reject",
  ) {
    if (!accessToken) return;
    setBusyId(application.id);
    setError(null);
    try {
      if (action === "approve")
        await approveRegistrationApplication(application.id, accessToken);
      else {
        const reason = window.prompt(
          "Reason for rejection",
          "Application does not yet meet registration requirements.",
        );
        if (!reason) return;
        await rejectRegistrationApplication(
          application.id,
          reason,
          accessToken,
        );
      }
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to review application",
      );
    } finally {
      setBusyId(null);
    }
  }
  return (
    <AppShell>
      <PageHeader
        eyebrow="Ministry control"
        title="Registration applications"
        description="Review university and industry partner applications. Approval activates the applicant account."
      />
      <div className="mt-7 space-y-4">
        {error ? <ErrorAlert message={error} /> : null}
        {applications.length ? (
          applications.map((application) => (
            <Panel key={application.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-accent">
                    {application.targetType}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-ink">
                    {application.organizationName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Submitted {new Date(application.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="status-badge status-warning">
                  <span className="status-dot" />
                  {application.status}
                </span>
              </div>
              <ApplicationDetails application={application} />
              <div className="mt-5 flex flex-wrap gap-3">
                <PrimaryButton
                  disabled={busyId === application.id}
                  onClick={() => void decide(application, "approve")}
                >
                  Approve and activate
                </PrimaryButton>
                <SecondaryButton
                  disabled={busyId === application.id}
                  onClick={() => void decide(application, "reject")}
                >
                  Reject
                </SecondaryButton>
              </div>
            </Panel>
          ))
        ) : (
          <EmptyState
            title="No pending applications"
            description="New university and industry applications will appear here."
          />
        )}
      </div>
    </AppShell>
  );
}

function ApplicationDetails({
  application,
}: {
  application: RegistrationApplication;
}) {
  const data = application.applicationData;
  const values = Object.entries(data).filter(
    ([, value]) => value !== null && value !== undefined && value !== "",
  );
  return (
    <details
      className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4"
      open
    >
      <summary className="cursor-pointer text-sm font-bold text-ink">
        Complete application details
      </summary>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Detail
          label="Applicant name"
          value={application.applicant.displayName}
        />
        <Detail label="Applicant email" value={application.applicant.email} />
        {values.map(([key, value]) => (
          <Detail
            key={key}
            label={key.replaceAll("_", " ")}
            value={formatValue(value)}
          />
        ))}
      </div>
    </details>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">
        {value}
      </p>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (Array.isArray(value))
    return value.map((item) => formatValue(item)).join(", ");
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
}
