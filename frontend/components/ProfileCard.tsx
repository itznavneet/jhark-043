"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PublicUser } from "../lib/api";
import { formatStatus } from "./ui";

const roleLabels: Record<string, string> = {
  MINISTRY_ADMIN: "Ministry administrator",
  SUBMITTER: "Community submitter",
  UNIVERSITY: "University partner",
  INDUSTRY: "Industry partner",
};

export function ProfileCard({ user }: { user: PublicUser }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const organization = user.profile?.organizationName ?? user.profile?.name;
  const accountType = user.profile?.type
    ? formatStatus(user.profile.type)
    : roleLabels[user.role] ?? formatStatus(user.role);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-xs font-bold text-white" aria-hidden="true">
          {user.displayName.slice(0, 2).toUpperCase()}
        </span>
        <span className="hidden sm:block">
          <span className="block max-w-36 truncate text-sm font-semibold text-ink">{user.displayName}</span>
          <span className="block text-[11px] text-slate-500">Profile</span>
        </span>
        <span className="hidden text-slate-400 sm:block" aria-hidden="true">⌄</span>
        <span className="sr-only">Profile</span>
      </button>

      {open ? (
        <section
          className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xl shadow-slate-900/10"
          role="dialog"
          aria-label="Profile details"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-sm font-extrabold text-white" aria-hidden="true">
              {user.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Profile</p>
              <h2 className="truncate text-lg font-bold text-ink">{user.displayName}</h2>
            </div>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registered email</dt>
              <dd className="mt-1 break-all font-medium text-slate-800">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</dt>
              <dd className="mt-1 font-medium text-slate-800">{roleLabels[user.role] ?? formatStatus(user.role)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account type</dt>
              <dd className="mt-1 font-medium text-slate-800">{accountType}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Organization</dt>
              <dd className="mt-1 font-medium text-slate-800">{organization ?? "Independent account"}</dd>
            </div>
          </dl>
          <Link className="btn-secondary mt-5 block w-full text-center" href="/profile" onClick={() => setOpen(false)}>
            Manage profile
          </Link>
        </section>
      ) : null}
    </div>
  );
}
