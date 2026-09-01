import { describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";
import {
  canActorTransitionProblem,
  canTransitionProblem,
} from "./lifecycle.js";

describe("problem lifecycle", () => {
  it("allows Ministry review from a submitted problem", () => {
    expect(canTransitionProblem("SUBMITTED", "MINISTRY_REVIEW")).toBe(true);
    expect(
      canActorTransitionProblem(
        "SUBMITTED",
        "MINISTRY_REVIEW",
        UserRole.MINISTRY_ADMIN,
      ),
    ).toBe(true);
  });

  it("allows Ministry review after AI validation", () => {
    expect(
      canActorTransitionProblem(
        "AI_VALIDATED",
        "MINISTRY_REVIEW",
        UserRole.MINISTRY_ADMIN,
      ),
    ).toBe(true);
  });

  it("does not allow submitters or arbitrary repeated transitions", () => {
    expect(
      canActorTransitionProblem(
        "SUBMITTED",
        "MINISTRY_REVIEW",
        UserRole.SUBMITTER,
      ),
    ).toBe(false);
    expect(canTransitionProblem("MINISTRY_REVIEW", "MINISTRY_REVIEW")).toBe(
      false,
    );
  });

  it("keeps approval and rejection decisions Ministry-controlled", () => {
    expect(
      canActorTransitionProblem(
        "MINISTRY_REVIEW",
        "MINISTRY_APPROVED",
        UserRole.MINISTRY_ADMIN,
      ),
    ).toBe(true);
    expect(
      canActorTransitionProblem(
        "MINISTRY_REVIEW",
        "MINISTRY_REJECTED",
        UserRole.SUBMITTER,
      ),
    ).toBe(false);
  });

  it("allows only the assigned university to progress collaboration", () => {
    expect(
      canActorTransitionProblem(
        "INVITATIONS_SENT",
        "UNIVERSITY_ACCEPTED",
        UserRole.UNIVERSITY,
      ),
    ).toBe(true);
    expect(
      canActorTransitionProblem(
        "UNIVERSITIES_RECOMMENDED",
        "MINISTRY_APPROVED_UNIVERSITIES",
        UserRole.UNIVERSITY,
      ),
    ).toBe(false);
    expect(
      canActorTransitionProblem(
        "TEAM_FORMED",
        "PROPOSAL_DRAFT",
        UserRole.MINISTRY_ADMIN,
      ),
    ).toBe(false);
  });
});
