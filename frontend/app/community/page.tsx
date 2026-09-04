"use client";

import { AppShell } from "../../components/AppShell";
import { CommunityProblemFeed } from "../../components/CommunityProblemFeed";
import { LoadingState, PageHeader } from "../../components/ui";
import { useAuth } from "../../lib/auth";

export default function CommunityPage() {
  const { accessToken, user, loading } = useAuth();
  if (loading || !user || !accessToken) return <LoadingState label="Loading community" />;
  if (user.role !== "SUBMITTER") return <LoadingState label="Community access is limited to submitters" />;
  return (
    <AppShell>
      <PageHeader
        eyebrow="Community problems"
        title="Support challenges worth solving"
        description="Review AI-validated societal challenges, add your perspective, and help the strongest problems reach Ministry review."
      />
      <div className="mt-7"><CommunityProblemFeed accessToken={accessToken} /></div>
    </AppShell>
  );
}
