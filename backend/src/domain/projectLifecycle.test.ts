import { describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";
import {
  canActorTransitionProject,
  canTransitionProject,
} from "./projectLifecycle.js";

describe("project lifecycle", () => {
  it("allows the planned delivery progression", () => {
    expect(
      canTransitionProject("COLLABORATION_CONFIRMED", "PROTOTYPE_DEVELOPMENT"),
    ).toBe(true);
    expect(canTransitionProject("IMPACT_MEASURED", "COMPLETED")).toBe(true);
  });

  it("rejects skipped or terminal transitions", () => {
    expect(canTransitionProject("COLLABORATION_CONFIRMED", "COMPLETED")).toBe(
      false,
    );
    expect(canTransitionProject("COMPLETED", "IMPLEMENTATION")).toBe(false);
  });

  it("allows only universities to operate project delivery states", () => {
    expect(
      canActorTransitionProject(
        "FIELD_PILOT",
        "IMPLEMENTATION",
        UserRole.UNIVERSITY,
      ),
    ).toBe(true);
    expect(
      canActorTransitionProject(
        "FIELD_PILOT",
        "IMPLEMENTATION",
        UserRole.MINISTRY_ADMIN,
      ),
    ).toBe(false);
    expect(
      canActorTransitionProject(
        "FIELD_PILOT",
        "IMPLEMENTATION",
        UserRole.INDUSTRY,
      ),
    ).toBe(false);
  });
});
