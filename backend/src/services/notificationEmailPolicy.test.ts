import { describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";
import { shouldSendWorkflowEmail } from "./notification.service.js";

describe("workflow email policy", () => {
  it("emails only the submitter for initial submission", () => {
    expect(
      shouldSendWorkflowEmail(
        { title: "Problem submitted" },
        UserRole.SUBMITTER,
      ),
    ).toBe(true);
    expect(
      shouldSendWorkflowEmail(
        { title: "Problem submitted" },
        UserRole.MINISTRY_ADMIN,
      ),
    ).toBe(false);
  });

  it("emails major decisions and excludes small notifications", () => {
    expect(
      shouldSendWorkflowEmail(
        {
          title: "Problem ministry approved",
          metadata: { status: "MINISTRY_APPROVED" },
        },
        UserRole.SUBMITTER,
      ),
    ).toBe(true);
    expect(
      shouldSendWorkflowEmail(
        { title: "Industry interest received" },
        UserRole.UNIVERSITY,
      ),
    ).toBe(false);
    expect(
      shouldSendWorkflowEmail(
        {
          title: "Project status updated",
          metadata: { status: "PROTOTYPE_DEVELOPMENT" },
        },
        UserRole.INDUSTRY,
      ),
    ).toBe(false);
    expect(
      shouldSendWorkflowEmail(
        {
          title: "Project status updated",
          metadata: { status: "IMPLEMENTATION" },
        },
        UserRole.INDUSTRY,
      ),
    ).toBe(true);
  });
});
