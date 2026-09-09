"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { registerSubmitter } from "../lib/api";
import { ErrorAlert, PrimaryButton } from "./ui";
import { PasswordField } from "./PasswordField";
import { useAuth } from "../lib/auth";

export function RegisterSubmitterForm({
  initialSubmitterType = "INDIVIDUAL_CITIZEN",
}: {
  initialSubmitterType?:
    "INDIVIDUAL_CITIZEN" | "PANCHAYATI_RAJ" | "ORGANIZATION";
}) {
  const router = useRouter();
  const { signIn } = useAuth();
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    submitterType: initialSubmitterType,
    organizationName: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const createdUser = await registerSubmitter({
        ...form,
        submitterType: form.submitterType as
          "INDIVIDUAL_CITIZEN" | "PANCHAYATI_RAJ" | "ORGANIZATION",
        organizationName: form.organizationName || undefined,
        description: form.description || undefined,
      });
      await signIn(form.email, form.password, "SUBMITTER");
      router.replace(createdUser.mustChangePassword ? "/account/setup" : "/my-problems");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create account",
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <main className="public-page">
      <div className="mx-auto max-w-2xl">
        <p className="page-eyebrow">Submitter registration</p>
        <h1 className="page-title">Create your citizen account</h1>
        <p className="page-description">
          Submit challenges as an individual, Panchayati Raj Institution, or
          organization.
        </p>
        <form className="panel mt-8 space-y-5 p-7 sm:p-9" onSubmit={submit}>
          {error ? <ErrorAlert message={error} /> : null}
          <label>
            <span className="text-sm font-semibold text-slate-700">
              Full name or contact name *
            </span>
            <input
              className="mt-2 w-full"
              required
              value={form.displayName}
              onChange={(event) => update("displayName", event.target.value)}
            />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">
              Email *
            </span>
            <input
              className="mt-2 w-full"
              required
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
            />
          </label>
          <fieldset>
            <legend className="text-sm font-semibold text-slate-700">
              Who do you belong to? *
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {[
                ["INDIVIDUAL_CITIZEN", "Individual Citizen"],
                ["PANCHAYATI_RAJ", "Panchayati Raj Institution"],
                ["ORGANIZATION", "Other Organization / NGO"],
              ].map(([value, label]) => (
                <label
                  className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"
                  key={value}
                >
                  <input
                    checked={form.submitterType === value}
                    name="submitterType"
                    onChange={() => update("submitterType", value)}
                    type="radio"
                    value={value}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            <span className="text-sm font-semibold text-slate-700">
              Organization name (optional)
            </span>
            <input
              className="mt-2 w-full"
              value={form.organizationName}
              onChange={(event) =>
                update("organizationName", event.target.value)
              }
            />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">
              About you or your organization
            </span>
            <textarea
              className="mt-2 min-h-24 w-full"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <PasswordField
              id="submitter-password"
              label="Password *"
              value={form.password}
              onChange={(value) => update("password", value)}
              minLength={12}
              required
              autoComplete="new-password"
            />
            <PasswordField
              id="submitter-confirm-password"
              label="Confirm password *"
              value={form.confirmPassword}
              onChange={(value) => update("confirmPassword", value)}
              minLength={12}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5">
            <Link
              className="text-sm font-semibold text-accent hover:underline"
              href="/register"
            >
              Back
            </Link>
            <PrimaryButton disabled={submitting} type="submit">
              {submitting ? "Creating account..." : "Create submitter account"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </main>
  );
}
