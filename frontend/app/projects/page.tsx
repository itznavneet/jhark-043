"use client";

import { AppShell } from "../../components/AppShell";
import { ProjectWorkspace } from "../../components/ProjectWorkspace";
import { useAuth } from "../../lib/auth";

export default function ProjectsPage() {
  const { accessToken, user, loading } = useAuth();
  if (loading || !user || !accessToken)
    return (
      <main className="grid min-h-screen place-items-center text-slate-500">
        Loading projects...
      </main>
    );
  return (
    <AppShell>
      <ProjectWorkspace accessToken={accessToken} role={user.role} />
    </AppShell>
  );
}
