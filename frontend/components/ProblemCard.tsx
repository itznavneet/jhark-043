import Link from "next/link";
import type { Problem } from "../lib/api";
import { StatusBadge } from "./ui";

export function ProblemCard({ problem }: { problem: Problem }) {
  return (
    <Link className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_22px_-20px_rgba(23,50,77,0.8)] transition hover:-translate-y-0.5 hover:border-accent hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:p-6" href={`/problems/${problem.id}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="page-eyebrow truncate">{problem.category?.name ?? "Uncategorized"}</p>
          <h3 className="mt-1 text-lg font-bold text-ink group-hover:text-accent">{problem.title}</h3>
        </div>
        <StatusBadge status={problem.currentStatus} />
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{problem.description}</p>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span>{problem.district || problem.location || "Location not specified"}</span>
        <span>Submitted {new Date(problem.createdAt).toLocaleDateString()}</span>
      </div>
    </Link>
  );
}
