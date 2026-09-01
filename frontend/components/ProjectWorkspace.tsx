"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createProjectMilestone,
  createProjectUpdate,
  listProjects,
  transitionProject,
  type Project,
  type ProjectStatus,
  type SubmitterProject,
  upsertProjectImpact,
} from "../lib/api";
import { LifecycleStepper } from "./LifecycleStepper";
import { EmptyState, PageHeader, StatusBadge } from "./ui";

const transitions: ProjectStatus[] = [
  "PROTOTYPE_DEVELOPMENT",
  "FIELD_PILOT",
  "IMPLEMENTATION",
  "IMPACT_MEASURED",
  "COMPLETED",
];

function isFullProject(
  project: Project | SubmitterProject,
): project is Project {
  return "proposal" in project;
}

export function ProjectWorkspace({
  accessToken,
  role,
}: {
  accessToken: string;
  role: string;
}) {
  const [projects, setProjects] = useState<Array<Project | SubmitterProject>>(
    [],
  );
  const [selectedId, setSelectedId] = useState<string>();
  const [message, setMessage] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateDescription, setUpdateDescription] = useState("");
  const [impactMetric, setImpactMetric] = useState("");

  const load = useCallback(async () => {
    try {
      const result = await listProjects(accessToken);
      setProjects(result);
      setSelectedId((current) => current ?? result[0]?.id);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load projects",
      );
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = projects.find((project) => project.id === selectedId);
  const canManage =
    role === "UNIVERSITY" && selected && isFullProject(selected);

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      setMessage(success);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    }
  }

  return (
    <section className="space-y-7">
      <PageHeader eyebrow="Project delivery" title="Projects and impact" description="Track delivery progress, evidence, milestones, and measurable outcomes." action={<span className="rounded-full bg-teal-50 px-3 py-2 text-sm font-bold text-accent">{projects.length} visible</span>} />
      {message && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700" role="status">{message}</div>
      )}
      {!projects.length ? (
        <EmptyState title="No projects are visible yet" description="Projects will appear here when a collaboration is confirmed." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="panel h-fit space-y-2 p-4" aria-label="Projects">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedId(project.id)}
                className={`w-full rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${selectedId === project.id ? "border-accent bg-teal-50" : "border-transparent hover:border-slate-200 hover:bg-slate-50"}`}
              >
                <p className="font-semibold text-ink">
                  {isFullProject(project)
                    ? project.proposal.title
                    : project.problem.title}
                </p>
                <div className="mt-2"><StatusBadge status={project.status} /></div>
              </button>
            ))}
          </div>
          {selected && (
            <ProjectDetails
              project={selected}
              canManage={Boolean(canManage)}
              onTransition={(status) =>
                void run(
                  () => transitionProject(selected.id, { status }, accessToken),
                  "Project status updated",
                )
              }
              onMilestone={(title) =>
                void run(
                  () =>
                    createProjectMilestone(selected.id, { title }, accessToken),
                  "Milestone created",
                )
              }
              onUpdate={(title, description) =>
                void run(
                  () =>
                    createProjectUpdate(
                      selected.id,
                      { title, description },
                      accessToken,
                    ),
                  "Progress update posted",
                )
              }
              onImpact={(metricName) =>
                void run(
                  () =>
                    upsertProjectImpact(
                      selected.id,
                      { metricName },
                      accessToken,
                    ),
                  "Impact record saved",
                )
              }
              milestoneTitle={milestoneTitle}
              setMilestoneTitle={setMilestoneTitle}
              updateTitle={updateTitle}
              setUpdateTitle={setUpdateTitle}
              updateDescription={updateDescription}
              setUpdateDescription={setUpdateDescription}
              impactMetric={impactMetric}
              setImpactMetric={setImpactMetric}
            />
          )}
        </div>
      )}
    </section>
  );
}

function ProjectDetails({
  project,
  canManage,
  onTransition,
  onMilestone,
  onUpdate,
  onImpact,
  milestoneTitle,
  setMilestoneTitle,
  updateTitle,
  setUpdateTitle,
  updateDescription,
  setUpdateDescription,
  impactMetric,
  setImpactMetric,
}: {
  project: Project | SubmitterProject;
  canManage: boolean;
  onTransition: (status: ProjectStatus) => void;
  onMilestone: (title: string) => void;
  onUpdate: (title: string, description: string) => void;
  onImpact: (metric: string) => void;
  milestoneTitle: string;
  setMilestoneTitle: (value: string) => void;
  updateTitle: string;
  setUpdateTitle: (value: string) => void;
  updateDescription: string;
  setUpdateDescription: (value: string) => void;
  impactMetric: string;
  setImpactMetric: (value: string) => void;
}) {
  const full = isFullProject(project);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            {full ? project.proposal.problem.title : project.problem.title}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-ink">
            {full ? project.proposal.title : "Project lifecycle"}
          </h2>
        </div>
        <StatusBadge status={project.status} />
      </div>
      <LifecycleStepper currentStatus={project.status} compact />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {canManage && (
        <div className="flex flex-wrap gap-2">
          {transitions
            .filter((status) => status !== project.status)
            .map((status) => (
              <button
                key={status}
                className="btn-secondary"
                onClick={() => onTransition(status)}
              >
                {status.replaceAll("_", " ")}
              </button>
            ))}
        </div>
      )}
      <div>
        <h3 className="font-semibold text-ink">Lifecycle</h3>
        <div className="mt-3 space-y-2">
          {project.statusHistory.map((entry) => (
            <div key={entry.id} className="border-l-2 border-accent pl-3 text-sm">
              <p className="font-medium text-ink">
                {entry.newStatus.replaceAll("_", " ")}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(entry.createdAt).toLocaleString()}
                {entry.reason ? ` · ${entry.reason}` : ""}
              </p>
            </div>
          ))}
        </div>
      </div>
      {full ? (
        <>
          <div>
            <h3 className="font-semibold text-ink">Milestones</h3>
            <div className="mt-3 space-y-2">
              {project.milestones.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg bg-slate-50 p-3 text-sm"
                >
                  <div className="flex justify-between">
                    <span>{item.title}</span>
                    <span>{item.completionPercentage}%</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {item.status.replaceAll("_", " ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {canManage && (
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                className="rounded-lg border p-2 text-sm"
                placeholder="Milestone title"
                value={milestoneTitle}
                onChange={(event) => setMilestoneTitle(event.target.value)}
              />
              <button
                className="btn-secondary"
                onClick={() => {
                  if (milestoneTitle.trim()) onMilestone(milestoneTitle);
                }}
              >
                Add milestone
              </button>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-ink">Progress updates</h3>
            <div className="mt-3 space-y-2">
              {project.updates.map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
          {canManage && (
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                className="rounded-lg border p-2 text-sm"
                placeholder="Update title"
                value={updateTitle}
                onChange={(event) => setUpdateTitle(event.target.value)}
              />
              <input
                className="rounded-lg border p-2 text-sm"
                placeholder="What changed?"
                value={updateDescription}
                onChange={(event) => setUpdateDescription(event.target.value)}
              />
              <button
                className="btn-secondary"
                onClick={() => {
                  if (updateTitle.trim() && updateDescription.trim())
                    onUpdate(updateTitle, updateDescription);
                }}
              >
                Post update
              </button>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-ink">Impact measures</h3>
            <p className="mt-1 text-sm text-slate-500">
              {project.impactMeasures.length} metric(s) recorded.
            </p>
            {canManage && (
              <div className="mt-3 flex gap-3">
                <input
                  className="rounded-lg border p-2 text-sm"
                  placeholder="Metric name"
                  value={impactMetric}
                  onChange={(event) => setImpactMetric(event.target.value)}
                />
                <button
                  className="btn-secondary"
                  onClick={() => {
                    if (impactMetric.trim()) onImpact(impactMetric);
                  }}
                >
                  Save metric
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div>
          <h3 className="font-semibold text-ink">Milestone progress</h3>
          {project.milestones.map((item) => (
            <p key={item.id} className="mt-2 text-sm text-slate-600">
              {item.title}: {item.completionPercentage}% (
              {item.status.replaceAll("_", " ")})
            </p>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
