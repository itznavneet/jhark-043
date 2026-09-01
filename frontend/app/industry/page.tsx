"use client";

import { AppShell } from "../../components/AppShell";
import { IndustryDashboard } from "../../components/IndustryDashboard";
import { useAuth } from "../../lib/auth";

export default function IndustryPage() {
  const { accessToken, user, loading } = useAuth();
  if (loading || !user || !accessToken)
    return (
      <main className="grid min-h-screen place-items-center text-slate-500">
        Loading industry workspace...
      </main>
    );
  if (user.role !== "INDUSTRY")
    return (
      <main className="grid min-h-screen place-items-center text-slate-500">
        This workspace is for industry accounts.
      </main>
    );
  return (
    <AppShell>
      <IndustryDashboard accessToken={accessToken} />
    </AppShell>
  );
}
