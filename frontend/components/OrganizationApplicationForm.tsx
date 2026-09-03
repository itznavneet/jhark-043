"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { submitOrganizationApplication } from "../lib/api";
import { ErrorAlert, PrimaryButton } from "./ui";
import { PasswordField } from "./PasswordField";

type TargetType = "UNIVERSITY" | "INDUSTRY";

export function OrganizationApplicationForm({
  targetType,
}: {
  targetType: TargetType;
}) {
  const router = useRouter();
  const isUniversity = targetType === "UNIVERSITY";
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    organizationType: isUniversity ? "University" : "STARTUP",
    phone: "",
    address: "",
    city: "",
    district: "",
    state: "Jharkhand",
    website: "",
    registrationNumber: "",
    description: "",
    sector: "",
    researchAreas: "",
    capabilities: "",
    labs: "",
    departments: "",
    interestAreas: "",
    fundingCapability: "",
    technicalSupportCapability: "",
    fieldDeploymentCapability: "",
    contactPerson: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const list = (value: string) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    const organization = isUniversity
      ? {
          name: form.name,
          shortName: form.registrationNumber || undefined,
          registrationNumber: form.registrationNumber || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          description: form.description || undefined,
          website: form.website || undefined,
          city: form.city || undefined,
          district: form.district || undefined,
          state: form.state || undefined,
          country: "India",
          departments: list(form.departments),
          capabilities: list(form.capabilities),
          applicationContact: form.displayName,
          faculty: [],
          researchAreas: list(form.researchAreas).map((name) => ({ name })),
          labs: list(form.labs).map((name) => ({
            name,
            capabilities: list(form.capabilities),
          })),
          facilities: [],
          previousProjects: [],
        }
      : {
          name: form.name,
          organizationType: form.organizationType || undefined,
          registrationNumber: form.registrationNumber || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          description: form.description || undefined,
          website: form.website || undefined,
          city: form.city || undefined,
          district: form.district || undefined,
          state: form.state || undefined,
          country: "India",
          sector: form.sector || undefined,
          technologyAreas: list(form.capabilities),
          expertise: list(form.capabilities).map((name) => ({ name })),
          interestAreas: list(form.interestAreas),
          supportCapabilities: list(form.capabilities).map((name) => ({
            name,
          })),
          fundingCapability: form.fundingCapability || undefined,
          technicalSupportCapability:
            form.technicalSupportCapability || undefined,
          fieldDeploymentCapability:
            form.fieldDeploymentCapability || undefined,
          contactPerson: form.contactPerson || form.displayName,
        };

    try {
      await submitOrganizationApplication({
        targetType,
        applicant: {
          displayName: form.displayName,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
        },
        organization,
      });
      setSuccess(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit application",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <section className="panel p-7 text-center sm:p-9">
        <p className="page-eyebrow">Application received</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">
          Your application is pending Ministry review
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your account will remain inactive until the Ministry approves this
          application.
        </p>
        <button
          className="btn-primary mt-6"
          onClick={() => router.replace("/login")}
        >
          Return to sign in
        </button>
      </section>
    );
  }

  const textFields = [
    ["displayName", "Application contact name", true],
    ["email", "Official email", true],
    ["name", isUniversity ? "Institution name" : "Organization name", true],
    ["phone", "Phone", false],
    ["address", "Address", false],
    ["city", "City", false],
    ["district", "District", false],
    ["state", "State", false],
    ["registrationNumber", "Registration / institution code", false],
    ["website", "Website", false],
  ] as const;

  return (
    <form className="panel space-y-5 p-7 sm:p-9" onSubmit={submit}>
      {error ? <ErrorAlert message={error} /> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        {textFields.map(([field, label, required]) => (
          <label
            className={field === "address" ? "sm:col-span-2" : ""}
            key={field}
          >
            <span className="text-sm font-semibold text-slate-700">
              {label}
              {required ? " *" : ""}
            </span>
            <input
              className="mt-2 w-full"
              required={required}
              type={field === "email" ? "email" : "text"}
              value={form[field]}
              onChange={(event) => update(field, event.target.value)}
            />
          </label>
        ))}
        {!isUniversity ? (
          <label>
            <span className="text-sm font-semibold text-slate-700">
              Organization type
            </span>
            <input
              className="mt-2 w-full"
              value={form.organizationType}
              onChange={(event) =>
                update("organizationType", event.target.value)
              }
            />
          </label>
        ) : null}
        {!isUniversity ? (
          <label>
            <span className="text-sm font-semibold text-slate-700">Sector</span>
            <input
              className="mt-2 w-full"
              value={form.sector}
              onChange={(event) => update("sector", event.target.value)}
            />
          </label>
        ) : null}
      </div>
      <label>
        <span className="text-sm font-semibold text-slate-700">
          Description
        </span>
        <textarea
          className="mt-2 min-h-24 w-full"
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
        />
      </label>
      <label>
        <span className="text-sm font-semibold text-slate-700">
          {isUniversity
            ? "Research areas (comma separated)"
            : "Technology and capability areas (comma separated)"}
        </span>
        <input
          className="mt-2 w-full"
          value={isUniversity ? form.researchAreas : form.capabilities}
          onChange={(event) =>
            update(
              isUniversity ? "researchAreas" : "capabilities",
              event.target.value,
            )
          }
        />
      </label>
      {isUniversity ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <label>
            <span className="text-sm font-semibold text-slate-700">
              Labs (comma separated)
            </span>
            <input
              className="mt-2 w-full"
              value={form.labs}
              onChange={(event) => update("labs", event.target.value)}
            />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">
              Departments (comma separated)
            </span>
            <input
              className="mt-2 w-full"
              value={form.departments}
              onChange={(event) => update("departments", event.target.value)}
            />
          </label>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <label>
            <span className="text-sm font-semibold text-slate-700">
              Areas of interest
            </span>
            <input
              className="mt-2 w-full"
              value={form.interestAreas}
              onChange={(event) => update("interestAreas", event.target.value)}
            />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">
              Contact person
            </span>
            <input
              className="mt-2 w-full"
              value={form.contactPerson}
              onChange={(event) => update("contactPerson", event.target.value)}
            />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">
              Funding capability
            </span>
            <textarea
              className="mt-2 min-h-20 w-full"
              value={form.fundingCapability}
              onChange={(event) =>
                update("fundingCapability", event.target.value)
              }
            />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">
              Field deployment capability
            </span>
            <textarea
              className="mt-2 min-h-20 w-full"
              value={form.fieldDeploymentCapability}
              onChange={(event) =>
                update("fieldDeploymentCapability", event.target.value)
              }
            />
          </label>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <PasswordField
          id="organization-password"
          label="Password *"
          value={form.password}
          onChange={(value) => update("password", value)}
          minLength={12}
          required
          autoComplete="new-password"
        />
        <PasswordField
          id="organization-confirm-password"
          label="Confirm password *"
          value={form.confirmPassword}
          onChange={(value) => update("confirmPassword", value)}
          minLength={12}
          required
          autoComplete="new-password"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <Link
          className="text-sm font-semibold text-accent hover:underline"
          href="/login"
        >
          Already have an account? Sign in
        </Link>
        <PrimaryButton disabled={submitting} type="submit">
          {submitting ? "Submitting..." : "Submit application"}
        </PrimaryButton>
      </div>
    </form>
  );
}
