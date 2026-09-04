"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth";
import { NotificationBell } from "./NotificationBell";
import { ProfileCard } from "./ProfileCard";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { accessToken, signOut, user } = useAuth();
  const homePath =
    user?.role === "MINISTRY_ADMIN"
      ? "/ministry/problems"
      : user?.role === "UNIVERSITY"
        ? "/university"
        : user?.role === "INDUSTRY"
          ? "/industry"
          : "/my-problems";
  const links = user
    ? user.role === "MINISTRY_ADMIN"
      ? [
          ["Problems", "/ministry/problems"],
          ["Applications", "/ministry/registrations"],
          ["Analytics", "/ministry/analytics"],
          ["Projects", "/projects"],
        ]
      : user.role === "SUBMITTER"
        ? [
            ["My challenges", "/my-problems"],
            ["Community problems", "/community"],
            ["Projects", "/projects"],
          ]
        : user.role === "UNIVERSITY"
          ? [
              ["Workspace", "/university"],
              ["Projects", "/projects"],
            ]
          : [
              ["Discover", "/industry"],
              ["Projects", "/projects"],
            ]
    : [];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 shadow-[0_4px_18px_-16px_rgba(23,50,77,0.7)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link className="mr-auto flex items-center gap-3" href={homePath}>
            <span
              className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-sm font-black text-white"
              aria-hidden="true"
            >
              SI
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-tight text-ink">
                Societal Innovation
              </span>
              <span className="block text-[11px] font-medium text-slate-500">
                Collaboration Portal
              </span>
            </span>
          </Link>
          {user && accessToken ? (
            <>
              <nav
                className="order-3 flex w-full flex-wrap items-center gap-1 border-t border-slate-100 pt-2 text-sm sm:order-none sm:w-auto sm:border-0 sm:pt-0"
                aria-label="Primary navigation"
              >
                {links.map(([label, href]) => (
                  <Link
                    className="rounded-lg px-3 py-2 font-medium text-slate-600 transition hover:bg-teal-50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    href={href}
                    key={href}
                  >
                    {label}
                  </Link>
                ))}
                <Link
                  className="rounded-lg px-3 py-2 font-medium text-slate-600 transition hover:bg-teal-50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  href="/notifications"
                >
                  Notifications
                </Link>
              </nav>
              <div className="flex items-center gap-2 sm:gap-3">
                <NotificationBell accessToken={accessToken} />
                <button
                  className="border-l border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  type="button"
                  onClick={async () => {
                    await signOut();
                    window.location.href = "/";
                  }}
                >
                  Sign out
                </button>
                <ProfileCard user={user} />
              </div>
            </>
          ) : null}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        {children}
      </main>
    </div>
  );
}
