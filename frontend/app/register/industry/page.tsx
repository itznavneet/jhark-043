import { OrganizationApplicationForm } from "../../../components/OrganizationApplicationForm";

export default function IndustryRegistrationPage() {
  return (
    <main className="min-h-screen bg-canvas px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="page-eyebrow">Partner registration</p>
        <h1 className="page-title">Industry / startup application</h1>
        <p className="page-description">
          Tell the Ministry how your organization can support societal
          solutions.
        </p>
        <div className="mt-8">
          <OrganizationApplicationForm targetType="INDUSTRY" />
        </div>
      </div>
    </main>
  );
}
