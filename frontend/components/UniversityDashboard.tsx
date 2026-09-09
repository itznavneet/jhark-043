"use client";

import { useCallback, useEffect, useState } from "react";
import {
  apiRequest,
  type UniversityAssignment,
  type UniversityProposal,
  type UniversityTeam,
} from "../lib/api";
import { TeamForm } from "./TeamForm";
import { ProposalForm } from "./ProposalForm";
import { LifecycleStepper } from "./LifecycleStepper";
import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  Panel,
  StatusBadge,
} from "./ui";

export function UniversityDashboard({ accessToken }: { accessToken: string }) {
  const [assignments, setAssignments] = useState<UniversityAssignment[]>([]);
  const [selected, setSelected] = useState<UniversityAssignment | null>(null);
  const [team, setTeam] = useState<UniversityTeam | null>(null);
  const [proposal, setProposal] = useState<UniversityProposal | null>(null);
  const [editingTeam, setEditingTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedId = selected?.id;

  const loadAssignments = useCallback(async () => {
    try {
      const items = await apiRequest<UniversityAssignment[]>(
        "/collaboration/university/assignments",
        undefined,
        accessToken,
      );
      setAssignments(items);
      setSelected((current) =>
        current && items.some((item) => item.id === current.id)
          ? (items.find((item) => item.id === current.id) ?? current)
          : (items[0] ?? null),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load assigned problems",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const loadWorkspace = useCallback(async () => {
    if (!selectedId) return;
    try {
      const [assignment, currentTeam, currentProposal] = await Promise.all([
        apiRequest<UniversityAssignment>(
          `/collaboration/university/assignments/${selectedId}`,
          undefined,
          accessToken,
        ),
        apiRequest<UniversityTeam | null>(
          `/collaboration/university/assignments/${selectedId}/team`,
          undefined,
          accessToken,
        ),
        apiRequest<UniversityProposal | null>(
          `/collaboration/university/assignments/${selectedId}/proposal`,
          undefined,
          accessToken,
        ),
      ]);
      setSelected(assignment);
      setTeam(currentTeam);
      setEditingTeam(false);
      setProposal(currentProposal);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the university workspace",
      );
    }
  }, [accessToken, selectedId]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  async function respond(action: "accept" | "reject") {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const result = await apiRequest<UniversityAssignment>(
        `/collaboration/university/assignments/${selected.id}/${action}`,
        {
          method: "POST",
          body:
            action === "reject"
              ? JSON.stringify({ reason: "Unable to participate at this time" })
              : undefined,
        },
        accessToken,
      );
      setSelected(result);
      setAssignments((items) =>
        items.map((item) => (item.id === result.id ? result : item)),
      );
      if (action === "accept") await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to respond to invitation",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState label="Loading university workspace" />;
  return (
    <div>
      <PageHeader
        eyebrow="University workspace"
        title="Assigned societal problems"
        description="Review Ministry invitations, form a research team, and submit a solution proposal."
        action={
          <span className="rounded-full bg-teal-50 px-3 py-2 text-sm font-bold text-accent">
            {assignments.length} assigned
          </span>
        }
      />
      {error ? (
        <div className="mt-5">
          <ErrorAlert message={error} />
        </div>
      ) : null}
      <div className="mt-7 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside
          className="panel h-fit space-y-3 p-4"
          aria-label="University assignments"
        >
          {assignments.map((assignment) => (
            <button
              className={`w-full rounded-xl p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${selected?.id === assignment.id ? "bg-teal-50 ring-1 ring-accent" : "hover:bg-slate-50"}`}
              key={assignment.id}
              onClick={() => {
                setSelected(assignment);
                setError(null);
              }}
            >
                  <p className={`text-xs font-semibold uppercase tracking-wide ${assignmentStatusTextClass(assignment.status)}`}>
                {assignment.status}
              </p>
              <p className="mt-1 font-semibold text-ink">
                {assignment.problem.title}
              </p>
              <div className="mt-2">
                <StatusBadge status={assignment.status} />
              </div>
            </button>
          ))}
          {!assignments.length ? (
            <EmptyState
              title="No invitations available"
              description="Ministry-approved challenges assigned to your university will appear here."
            />
          ) : null}
        </aside>
        {selected ? (
          <section className="space-y-6">
            <Panel>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                    {selected.problem.category?.name ?? "Societal challenge"}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-ink">
                    {selected.problem.title}
                  </h2>
                </div>
                <StatusBadge status={selected.status} />
              </div>
              <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-700">
                {selected.problem.description}
              </p>
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                <Info
                  label="Location"
                  value={selected.problem.location ?? "Not specified"}
                />
                <Info
                  label="District"
                  value={selected.problem.district ?? "Not specified"}
                />
                <Info
                  label="Desired outcome"
                  value={selected.problem.desiredOutcome ?? "Not specified"}
                />
              </dl>
              {selected.status === "INVITED" ? (
                <div className="mt-6 flex gap-3">
                  <button
                    className="btn-primary"
                    disabled={busy}
                    onClick={() => void respond("accept")}
                  >
                    Accept invitation
                  </button>
                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50"
                    disabled={busy}
                    onClick={() => void respond("reject")}
                  >
                    Reject
                  </button>
                </div>
              ) : null}
              {selected.responseNote ? (
                <p className="mt-4 text-sm text-slate-500">
                  Response: {selected.responseNote}
                </p>
              ) : null}
            </Panel>
            <LifecycleStepper currentStatus={selected.problem.currentStatus} />
            {selected.status === "ACCEPTED" || team ? (
              team && !editingTeam ? (
                <TeamSummary team={team} onEdit={() => setEditingTeam(true)} />
              ) : (
                <TeamForm
                  accessToken={accessToken}
                  assignmentId={selected.id}
                  team={team}
                  onSaved={(saved) => {
                    setTeam(saved);
                    setEditingTeam(false);
                  }}
                  onError={setError}
                />
              )
            ) : null}
            {selected.status === "ACCEPTED" || proposal ? (
              <ProposalForm
                accessToken={accessToken}
                assignmentId={selected.id}
                proposal={proposal}
                onSaved={setProposal}
                onError={setError}
              />
            ) : null}
          </section>
        ) : (
          <div className="rounded-2xl bg-white p-8 text-slate-500 ring-1 ring-slate-200">
            Select an assigned problem to begin.
          </div>
        )}
      </div>
    </div>
  );
}

function assignmentStatusTextClass(status: string) {
  if (status === "ACCEPTED") return "text-emerald-700";
  if (["REJECTED", "CANCELLED"].includes(status)) return "text-rose-700";
  return "text-primary";
}

function TeamSummary({
  team,
  onEdit,
}: {
  team: UniversityTeam;
  onEdit(): void;
}) {
  const mentor = team.members.find(
    (member) => member.memberType === "FACULTY_MENTOR",
  );
  const members = team.members.filter(
    (member) => member.memberType !== "FACULTY_MENTOR",
  );
  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-eyebrow">University team</p>
          <h2 className="section-title">{team.name}</h2>
          <p className="mt-2 text-sm text-slate-600">
            Formed {new Date(team.formedAt).toLocaleString()}
          </p>
        </div>
        <button className="btn-secondary" onClick={onEdit} type="button">
          Edit team
        </button>
      </div>
      {team.description ? (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {team.description}
        </p>
      ) : null}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Info label="Faculty mentor" value={mentor?.name ?? "Not specified"} />
        <Info
          label="Research members"
          value={
            members.length
              ? members.map((member) => member.name).join(", ")
              : "None added"
          }
        />
      </div>
    </Panel>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-slate-700">{value}</dd>
    </div>
  );
}
