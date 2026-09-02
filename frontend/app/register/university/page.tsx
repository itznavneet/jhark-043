import { OrganizationApplicationForm } from "../../../components/OrganizationApplicationForm";

export default function UniversityRegistrationPage() {
  return (
    <main className="min-h-screen bg-canvas px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="page-eyebrow">Partner registration</p>
        <h1 className="page-title">University application</h1>
        <p className="page-description">
          Submit your institution for Ministry review. Login activates only
          after approval.
        </p>
        <div className="mt-8">
          <OrganizationApplicationForm targetType="UNIVERSITY" />
        </div>
      </div>
    </main>
  );
}
