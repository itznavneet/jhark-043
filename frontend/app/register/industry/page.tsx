import { OrganizationApplicationForm } from "../../../components/OrganizationApplicationForm";

export default function IndustryRegistrationPage() {
  return (
    <main className="public-page">
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
