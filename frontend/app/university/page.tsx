"use client";

import { AppShell } from "../../components/AppShell";
import { UniversityDashboard } from "../../components/UniversityDashboard";
import { useAuth } from "../../lib/auth";

export default function UniversityPage() {
  const { accessToken, user, loading } = useAuth();
  if (loading || !user || !accessToken)
    return (
      <main className="grid min-h-screen place-items-center text-slate-500">
        Loading university workspace...
      </main>
    );
  if (user.role !== "UNIVERSITY")
    return (
      <main className="grid min-h-screen place-items-center text-slate-500">
        This workspace is for university accounts.
      </main>
    );
  return (
    <AppShell>
      <UniversityDashboard accessToken={accessToken} />
    </AppShell>
  );
}
