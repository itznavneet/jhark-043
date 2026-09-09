"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorAlert, PrimaryButton } from "../../../components/ui";
import { PasswordField } from "../../../components/PasswordField";
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
    <main className="grid min-h-screen place-items-center public-page">
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
        <PasswordField
          id="temporary-password"
          label="Temporary password *"
          value={currentPassword}
          onChange={setCurrentPassword}
          required
          autoComplete="current-password"
        />
        <PasswordField
          id="new-password"
          label="New password *"
          value={newPassword}
          onChange={setNewPassword}
          minLength={12}
          required
          autoComplete="new-password"
        />
        <PasswordField
          id="confirm-new-password"
          label="Confirm new password *"
          value={confirmPassword}
          onChange={setConfirmPassword}
          minLength={12}
          required
          autoComplete="new-password"
        />
        <PrimaryButton className="w-full" disabled={busy} type="submit">
          {busy ? "Updating..." : "Continue to workspace"}
        </PrimaryButton>
      </form>
    </main>
  );
}
