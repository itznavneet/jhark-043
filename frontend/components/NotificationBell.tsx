"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getUnreadNotificationCount, listNotifications, markAllNotificationsRead, markNotificationRead, type Notification } from "../lib/api";

export function NotificationBell({ accessToken }: { accessToken: string }) {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const [unreadCount, notifications] = await Promise.all([getUnreadNotificationCount(accessToken), listNotifications(accessToken)]);
      setCount(unreadCount);
      setItems(notifications.slice(0, 5));
    } catch { /* Notifications never block the main workspace. */ }
  }, [accessToken]);
  useEffect(() => { void refresh(); const timer = window.setInterval(() => void refresh(), 60_000); return () => window.clearInterval(timer); }, [refresh]);
  async function read(notificationId: string) { try { await markNotificationRead(notificationId, accessToken); await refresh(); } catch { /* Keep the list usable. */ } }
  async function readAll() { try { await markAllNotificationsRead(accessToken); await refresh(); } catch { /* Keep the indicator non-blocking. */ } }

  return (
    <div className="relative">
      <button aria-expanded={open} aria-haspopup="true" aria-label={`${count} unread notifications`} className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" onClick={() => setOpen((value) => !value)}>
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 1 0-12 0v.75a8.967 8.967 0 0 1-2.31 6.022 23.848 23.848 0 0 0 5.454 1.31m5.713 0a24.255 24.255 0 0 1-5.713 0m5.713 0a3 3 0 1 1-5.713 0" /></svg>
        {count > 0 ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-coral px-1 text-center text-[10px] font-bold text-white">{count > 99 ? "99+" : count}</span> : null}
      </button>
      {open ? <div className="absolute right-0 z-20 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl" role="dialog" aria-label="Recent notifications">
        <div className="flex items-center justify-between gap-3"><p className="font-bold text-ink">Notifications</p>{count > 0 ? <button className="rounded text-xs font-semibold text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" onClick={() => void readAll()}>Mark all read</button> : null}</div>
        <div className="mt-2 space-y-2">{items.length ? items.map((item) => <button key={item.id} className={`block w-full rounded-lg p-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${item.read ? "bg-white hover:bg-slate-50" : "bg-teal-50"}`} onClick={() => { if (!item.read) void read(item.id); }}><p className="text-sm font-medium text-ink">{item.title}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.message}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</p></button>) : <p className="py-4 text-sm text-slate-500">No notifications yet.</p>}</div>
        <Link className="mt-3 block rounded text-center text-xs font-semibold text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" href="/notifications" onClick={() => setOpen(false)}>View all notifications</Link>
      </div> : null}
    </div>
  );
}
