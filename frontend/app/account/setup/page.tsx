"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorAlert, PrimaryButton } from "../../../components/ui";
import { useAuth } from "../../../lib/auth";

export default function AccountSetupPage() {
  const router = useRouter();
  const { accessToken, user, loading, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading)
    return (
      <main className="grid min-h-screen place-items-center bg-canvas text-slate-500">
        Loading account setup...
      </main>
    );
  if (!user || !accessToken) {
    router.replace("/login");
    return null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const updated = await changePassword(currentPassword, newPassword);
      const destination =
        updated.role === "MINISTRY_ADMIN"
          ? "/ministry/analytics"
          : updated.role === "UNIVERSITY"
            ? "/university"
            : updated.role === "INDUSTRY"
              ? "/industry"
              : "/my-problems";
      router.replace(destination);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update password",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-5 py-10">
      <form
        className="panel w-full max-w-md space-y-5 p-7 sm:p-9"
        onSubmit={submit}
      >
        <p className="page-eyebrow">First-login setup</p>
        <h1 className="text-2xl font-bold text-ink">
          Change your temporary password
        </h1>
        <p className="text-sm leading-6 text-slate-600">
          This organization account was provisioned for you. Set a private
          password before entering the workspace.
        </p>
        {error ? <ErrorAlert message={error} /> : null}
        <label>
          <span className="text-sm font-semibold text-slate-700">
            Temporary password *
          </span>
          <input
            className="mt-2 w-full"
            required
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>
        <label>
          <span className="text-sm font-semibold text-slate-700">
            New password *
          </span>
          <input
            className="mt-2 w-full"
            minLength={12}
            required
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </label>
        <label>
          <span className="text-sm font-semibold text-slate-700">
            Confirm new password *
          </span>
          <input
            className="mt-2 w-full"
            minLength={12}
            required
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
        <PrimaryButton className="w-full" disabled={busy} type="submit">
          {busy ? "Updating..." : "Continue to workspace"}
        </PrimaryButton>
      </form>
    </main>
  );
}
