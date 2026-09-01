"use client";

import { AppShell } from "../../../components/AppShell";
import { MinistryAnalyticsDashboard } from "../../../components/MinistryAnalyticsDashboard";
import { ErrorAlert, LoadingState, PageHeader } from "../../../components/ui";
import { useAuth } from "../../../lib/auth";

export default function MinistryAnalyticsPage() {
  const { accessToken, user, loading } = useAuth();
  if (loading || !user || !accessToken) return <LoadingState label="Loading Ministry analytics" />;
  if (user.role !== "MINISTRY_ADMIN") return <AppShell><ErrorAlert message="Ministry administrator access is required." /></AppShell>;
  return (
    <AppShell>
      <PageHeader eyebrow="Ministry oversight" title="Control dashboard" description="A decision-support view of the societal challenge pipeline, collaboration activity, project delivery, and measured impact." />
      <div className="mt-7"><MinistryAnalyticsDashboard accessToken={accessToken} /></div>
    </AppShell>
  );
}
