"use client";

import { useCallback, useEffect, useState } from "react";
import {
  acceptIndustryInterest,
  expressIndustryInterest,
  listIndustryCollaborations,
  listIndustryInterests,
  listIndustryProjects,
  listIndustryProposals,
  type IndustryCollaboration,
  type IndustryInterest,
  type IndustryProject,
  type IndustryProposal,
  type IndustrySupportType,
} from "../lib/api";
import { EmptyState, ErrorAlert, LoadingState, PageHeader, Panel, StatusBadge } from "./ui";

const supportTypes: IndustrySupportType[] = [
  "FUNDING",
  "MENTORSHIP",
  "TECHNICAL_SUPPORT",
  "INFRASTRUCTURE",
  "PILOT_SUPPORT",
  "OTHER",
];

export function IndustryDashboard({ accessToken }: { accessToken: string }) {
  const [proposals, setProposals] = useState<IndustryProposal[]>([]);
  const [interests, setInterests] = useState<IndustryInterest[]>([]);
  const [collaborations, setCollaborations] = useState<IndustryCollaboration[]>(
    [],
  );
  const [projects, setProjects] = useState<IndustryProject[]>([]);
  const [selected, setSelected] = useState<IndustryProposal | null>(null);
  const [filters, setFilters] = useState({
    domain: "",
    technology: "",
    minBudget: "",
    maxBudget: "",
    supportType: "",
  });
  const [interestForm, setInterestForm] = useState({
    message: "",
    supportType: "FUNDING" as IndustrySupportType,
  });
  const [acceptForm, setAcceptForm] = useState({
    supportType: "FUNDING" as IndustrySupportType,
    supportSummary: "",
    amount: "",
    currencyCode: "INR",
    conditionsNotes: "",
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(
    async (query: typeof filters) => {
      try {
        const [available, ownInterests, ownCollaborations, ownProjects] =
          await Promise.all([
            listIndustryProposals(
              {
                ...query,
                minBudget: query.minBudget || undefined,
                maxBudget: query.maxBudget || undefined,
                supportType: query.supportType || undefined,
              },
              accessToken,
            ),
            listIndustryInterests(accessToken),
            listIndustryCollaborations(accessToken),
            listIndustryProjects(accessToken),
          ]);
        setProposals(available);
        setInterests(ownInterests);
        setCollaborations(ownCollaborations);
        setProjects(ownProjects);
        setSelected((current) =>
          current && available.some((item) => item.id === current.id)
            ? (available.find((item) => item.id === current.id) ?? current)
            : (available[0] ?? null),
        );
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load the industry workspace",
        );
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    void loadDashboard({
      domain: "",
      technology: "",
      minBudget: "",
      maxBudget: "",
      supportType: "",
    });
  }, [loadDashboard]);

  async function expressInterest() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await expressIndustryInterest(selected.id, interestForm, accessToken);
      await loadDashboard(filters);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to express interest",
      );
    } finally {
      setBusy(false);
    }
  }

  async function acceptInterest(interest: IndustryInterest) {
    setBusy(true);
    setError(null);
    try {
      await acceptIndustryInterest(
        interest.id,
        {
          supportType: acceptForm.supportType,
          supportSummary: acceptForm.supportSummary || undefined,
          funding:
            acceptForm.supportType === "FUNDING"
              ? {
                  amount: acceptForm.amount
                    ? Number(acceptForm.amount)
                    : undefined,
                  currencyCode: acceptForm.currencyCode || undefined,
                  conditionsNotes: acceptForm.conditionsNotes || undefined,
                }
              : undefined,
        },
        accessToken,
      );
      await loadDashboard(filters);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to confirm collaboration",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState label="Loading industry workspace" />;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Industry workspace" title="Discover university solutions" description="Review submitted proposals, express a support interest, and track confirmed collaborations and projects." action={<span className="rounded-full bg-teal-50 px-3 py-2 text-sm font-bold text-accent">{collaborations.length} collaborations</span>} />
      {error ? (
        <ErrorAlert message={error} />
      ) : null}
      <Panel>
        <p className="section-eyebrow">Opportunity finder</p>
        <h2 className="section-title">Filter proposals</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <FilterInput
            label="Domain"
            value={filters.domain}
            onChange={(domain) => setFilters({ ...filters, domain })}
          />
          <FilterInput
            label="Technology"
            value={filters.technology}
            onChange={(technology) => setFilters({ ...filters, technology })}
          />
          <FilterInput
            label="Min budget"
            value={filters.minBudget}
            onChange={(minBudget) => setFilters({ ...filters, minBudget })}
            type="number"
          />
          <FilterInput
            label="Max budget"
            value={filters.maxBudget}
            onChange={(maxBudget) => setFilters({ ...filters, maxBudget })}
            type="number"
          />
          <label className="text-sm font-semibold text-slate-700">
            Support type
            <select
              className="mt-2 w-full rounded-lg border border-slate-300 p-2.5 font-normal"
              value={filters.supportType}
              onChange={(event) =>
                setFilters({ ...filters, supportType: event.target.value })
              }
            >
              <option value="">All support types</option>
              {supportTypes.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          className="btn-primary mt-4"
          onClick={() => void loadDashboard(filters)}
        >
          Apply filters
        </button>
      </Panel>
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="panel h-fit space-y-3 p-4" aria-label="Eligible proposals">
          {proposals.map((proposal) => (
            <button
              className={`w-full rounded-xl p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${selected?.id === proposal.id ? "bg-teal-50 ring-1 ring-accent" : "hover:bg-slate-50"}`}
              key={proposal.id}
              onClick={() => setSelected(proposal)}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                {proposal.problem.category?.name ?? "Societal challenge"}
              </p>
              <p className="mt-1 font-semibold text-ink">{proposal.title}</p>
              <p className="mt-2 text-xs text-slate-500">
                {proposal.university.name}
              </p>
            </button>
          ))}
          {!proposals.length ? (
            <EmptyState title="No proposals match these filters" description="Try a broader domain, budget, or support type." />
          ) : null}
        </aside>
        {selected ? (
          <ProposalDetail
            proposal={selected}
            interestForm={interestForm}
            setInterestForm={setInterestForm}
            busy={busy}
            onExpress={() => void expressInterest()}
          />
        ) : (
          <div className="rounded-2xl bg-white p-8 text-slate-500 ring-1 ring-slate-200">
            Select a proposal to review its solution.
          </div>
        )}
      </div>
      <section className="grid gap-6 lg:grid-cols-3">
        <DashboardCard title="My interests">
          {interests.map((interest) => (
            <div
              className="border-b border-slate-100 py-3 last:border-0"
              key={interest.id}
            >
              <p className="font-semibold text-ink">
                {interest.proposal.title}
              </p>
              <p className="text-xs text-slate-500">
                {formatLabel(interest.supportType)} · {interest.status}
              </p>
              {interest.status === "EXPRESSED" ||
              interest.status === "UNDER_REVIEW" ? (
                <button
                  className="mt-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  disabled={busy}
                  onClick={() => void acceptInterest(interest)}
                >
                  Accept and create project
                </button>
              ) : null}
            </div>
          ))}
          {!interests.length ? (
            <p className="text-sm text-slate-500">No interests yet.</p>
          ) : null}
          {interests.some(
            (interest) =>
              interest.status === "EXPRESSED" ||
              interest.status === "UNDER_REVIEW",
          ) ? (
            <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Acceptance details apply to the pending interest
              </p>
              <SelectInput
                label="Support type"
                value={acceptForm.supportType}
                onChange={(supportType) =>
                  setAcceptForm({ ...acceptForm, supportType })
                }
              />
              <textarea
                className="min-h-20 w-full rounded-lg border border-slate-300 p-2 text-sm"
                placeholder="Support summary"
                value={acceptForm.supportSummary}
                onChange={(event) =>
                  setAcceptForm({
                    ...acceptForm,
                    supportSummary: event.target.value,
                  })
                }
              />
              {acceptForm.supportType === "FUNDING" ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <FilterInput
                    label="Amount"
                    type="number"
                    value={acceptForm.amount}
                    onChange={(amount) =>
                      setAcceptForm({ ...acceptForm, amount })
                    }
                  />
                  <FilterInput
                    label="Currency"
                    value={acceptForm.currencyCode}
                    onChange={(currencyCode) =>
                      setAcceptForm({ ...acceptForm, currencyCode })
                    }
                  />
                  <textarea
                    className="min-h-16 rounded-lg border border-slate-300 p-2 text-sm sm:col-span-2"
                    placeholder="Funding conditions or notes"
                    value={acceptForm.conditionsNotes}
                    onChange={(event) =>
                      setAcceptForm({
                        ...acceptForm,
                        conditionsNotes: event.target.value,
                      })
                    }
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </DashboardCard>
        <DashboardCard title="Confirmed collaborations">
          {collaborations.map((collaboration) => (
            <div
              className="border-b border-slate-100 py-3 last:border-0"
              key={collaboration.id}
            >
              <p className="font-semibold text-ink">
                {collaboration.proposal.title}
              </p>
              <div className="mt-1"><StatusBadge status={collaboration.status} /></div>
            </div>
          ))}
          {!collaborations.length ? (
            <p className="text-sm text-slate-500">
              No confirmed collaborations yet.
            </p>
          ) : null}
        </DashboardCard>
        <DashboardCard title="Active projects">
          {projects.map((project) => (
            <div
              className="border-b border-slate-100 py-3 last:border-0"
              key={project.id}
            >
              <p className="font-semibold text-ink">{project.proposal.title}</p>
              <p className="text-xs text-slate-500">{project.proposal.university.name}</p>
              <div className="mt-1"><StatusBadge status={project.status} /></div>
            </div>
          ))}
          {!projects.length ? (
            <p className="text-sm text-slate-500">No active projects yet.</p>
          ) : null}
        </DashboardCard>
      </section>
    </div>
  );
}

function ProposalDetail({
  proposal,
  interestForm,
  setInterestForm,
  busy,
  onExpress,
}: {
  proposal: IndustryProposal;
  interestForm: { message: string; supportType: IndustrySupportType };
  setInterestForm(value: {
    message: string;
    supportType: IndustrySupportType;
  }): void;
  busy: boolean;
  onExpress(): void;
}) {
  return (
    <Panel>
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">
        {proposal.problem.category?.name ?? "Societal challenge"}
      </p>
      <h2 className="mt-2 text-2xl font-bold text-ink">{proposal.title}</h2>
      <p className="mt-2 text-sm text-slate-500">
        {proposal.university.name} · {proposal.status}
      </p>
      <div className="mt-6 space-y-5 text-sm leading-6 text-slate-700">
        <Detail
          label="Problem understanding"
          value={proposal.problemUnderstanding}
        />
        <Detail label="Proposed solution" value={proposal.solutionSummary} />
        <Detail label="Technical approach" value={proposal.technicalApproach} />
        <Detail
          label="Expected social impact"
          value={proposal.expectedSocialImpact}
        />
        <Detail label="Requested support" value={proposal.requestedSupport} />
      </div>
      <div className="mt-6 rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Express interest
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <SelectInput
            label="Support type"
            value={interestForm.supportType}
            onChange={(supportType) =>
              setInterestForm({ ...interestForm, supportType })
            }
          />
          <textarea
            className="min-h-20 rounded-lg border border-slate-300 p-2 text-sm sm:col-span-2"
            placeholder="Message to the university"
            value={interestForm.message}
            onChange={(event) =>
              setInterestForm({ ...interestForm, message: event.target.value })
            }
          />
        </div>
        <button
          className="btn-primary mt-3"
          disabled={busy}
          onClick={onExpress}
        >
          Express interest
        </button>
      </div>
    </Panel>
  );
}

function DashboardCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="font-semibold text-ink">{label}</p>
      <p className="mt-1 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  type?: string;
}) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <input
        className="mt-2 w-full rounded-lg border border-slate-300 p-2.5 font-normal"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: IndustrySupportType;
  onChange(value: IndustrySupportType): void;
}) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <select
        className="mt-2 w-full rounded-lg border border-slate-300 p-2.5 font-normal"
        value={value}
        onChange={(event) =>
          onChange(event.target.value as IndustrySupportType)
        }
      >
        {supportTypes.map((type) => (
          <option key={type} value={type}>
            {formatLabel(type)}
          </option>
        ))}
      </select>
    </label>
  );
}

function formatLabel(value: string): string {
  return value.toLowerCase().replaceAll("_", " ");
}
