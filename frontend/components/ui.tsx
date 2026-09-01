import type { ButtonHTMLAttributes, ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="page-eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`panel ${className}`}>{children}</section>;
}

export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
      <h2 className="section-title">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <span className={`status-badge ${tone}`}>
      <span aria-hidden="true" className="status-dot" />
      {formatStatus(status)}
    </span>
  );
}

export function PrimaryButton({
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`btn-primary ${className}`} {...props}>
      {children}
    </button>
  );
}

export function SecondaryButton({
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`btn-secondary ${className}`} {...props}>
      {children}
    </button>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">—</div>
      <p className="font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

export function LoadingState({ label = "Loading workspace" }: { label?: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-6 text-sm text-slate-500">
      <div className="flex items-center gap-3" role="status">
        <span className="loading-dot" aria-hidden="true" />
        {label}…
      </div>
    </main>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="alert-error" role="alert">
      <span className="font-semibold">Something needs attention.</span> {message}
    </div>
  );
}

export function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function statusTone(status: string) {
  if (["COMPLETED", "APPROVED", "ACCEPTED", "CONFIRMED", "VALID"].includes(status)) {
    return "status-success";
  }
  if (["REJECTED", "CANCELLED", "FAILED", "BLOCKED", "INVALID"].includes(status)) {
    return "status-danger";
  }
  if (["SUBMITTED", "IN_PROGRESS", "PROCESSING", "UNDER_REVIEW", "MINISTRY_REVIEW"].includes(status)) {
    return "status-warning";
  }
  return "status-neutral";
}
