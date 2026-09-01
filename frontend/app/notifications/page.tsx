"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { EmptyState, ErrorAlert, LoadingState, PageHeader, Panel } from "../../components/ui";
import { listNotifications, markAllNotificationsRead, markNotificationRead, type Notification } from "../../lib/api";
import { useAuth } from "../../lib/auth";

export default function NotificationsPage() {
  const { accessToken, user, loading } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setMessage("");
      setItems(await listNotifications(accessToken));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load notifications");
    }
  }, [accessToken]);
  useEffect(() => { void load(); }, [load]);
  if (loading || !user || !accessToken) return <LoadingState label="Loading notifications" />;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <PageHeader eyebrow="Updates" title="Notifications" description="Stay informed about reviews, invitations, collaborations, and project delivery." action={<button className="btn-secondary" onClick={async () => { await markAllNotificationsRead(accessToken); await load(); }}>Mark all read</button>} />
        <div className="mt-7"><Panel>
          {message ? <div className="mb-4"><ErrorAlert message={message} /></div> : null}
          <div className="space-y-3">
            {items.length ? items.map((item) => (
              <button key={item.id} className={`block w-full rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${item.read ? "border-slate-200 bg-white hover:bg-slate-50" : "border-teal-200 bg-teal-50/60 hover:bg-teal-50"}`} onClick={async () => { if (!item.read) { await markNotificationRead(item.id, accessToken); await load(); } }}>
                <div className="flex flex-wrap justify-between gap-3"><p className="font-bold text-ink">{item.title}</p><span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</span></div>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p>
                {!item.read ? <span className="mt-3 inline-flex text-[11px] font-bold uppercase tracking-wide text-accent">Unread</span> : null}
              </button>
            )) : <EmptyState title="You are all caught up" description="Important lifecycle updates will appear here." />}
          </div>
        </Panel></div>
      </div>
    </AppShell>
  );
}
