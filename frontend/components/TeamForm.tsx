"use client";

import { useState } from "react";
import { apiRequest, type UniversityTeam } from "../lib/api";

interface TeamFormProps {
  accessToken: string;
  assignmentId: string;
  team: UniversityTeam | null;
  onSaved(team: UniversityTeam): void;
  onError(message: string): void;
}

export function TeamForm({
  accessToken,
  assignmentId,
  team,
  onSaved,
  onError,
}: TeamFormProps) {
  const mentor = team?.members.find(
    (member) => member.memberType === "FACULTY_MENTOR",
  );
  const students =
    team?.members.filter((member) => member.memberType !== "FACULTY_MENTOR") ??
    [];
  const [name, setName] = useState(team?.name ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [mentorName, setMentorName] = useState(mentor?.name ?? "");
  const [mentorRole, setMentorRole] = useState(mentor?.roleTitle ?? "");
  const [studentNames, setStudentNames] = useState(
    students.map((student) => student.name).join("\n"),
  );
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const saved = await apiRequest<UniversityTeam>(
        `/collaboration/university/assignments/${assignmentId}/team`,
        {
          method: "PUT",
          body: JSON.stringify({
            name,
            description: description || undefined,
            facultyMentor: {
              name: mentorName,
              roleTitle: mentorRole || undefined,
            },
            members: studentNames
              .split("\n")
              .map((studentName) => studentName.trim())
              .filter(Boolean)
              .map((studentName) => ({
                name: studentName,
                memberType: "RESEARCH_STUDENT",
              })),
          }),
        },
        accessToken,
      );
      onSaved(saved);
    } catch (requestError) {
      onError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save team",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">University team</h2>
          <p className="mt-1 text-sm text-slate-600">
            Add a faculty mentor and research members for this accepted problem.
          </p>
        </div>
        {team ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Team formed
          </span>
        ) : null}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Team name" value={name} onChange={setName} />
        <Field
          label="Faculty mentor"
          value={mentorName}
          onChange={setMentorName}
        />
        <Field
          label="Mentor role"
          value={mentorRole}
          onChange={setMentorRole}
        />
        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
          Description
          <textarea
            className="mt-2 min-h-20 w-full rounded-lg border border-slate-300 p-3 font-normal"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
          Research students (one name per line)
          <textarea
            className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 p-3 font-normal"
            value={studentNames}
            onChange={(event) => setStudentNames(event.target.value)}
          />
        </label>
      </div>
      <button
        className="mt-5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        disabled={busy}
        onClick={() => void save()}
      >
        Save team
      </button>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
}) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <input
        className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-normal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
