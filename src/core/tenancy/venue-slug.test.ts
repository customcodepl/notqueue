import { describe, expect, it } from "vitest";

import { isVenueSlug } from "./venue-slug";

describe("isVenueSlug", () => {
  it("accepts lowercase letters, digits and inner hyphens", () => {
    for (const slug of [
      "abc",
      "bistro-pod-lipa",
      "warsztat24",
      "a".repeat(50),
    ]) {
      expect(isVenueSlug(slug)).toBe(true);
    }
  });

  it("rejects other strings", () => {
    for (const slug of [
      "ab",
      "a".repeat(51),
      "-bistro",
      "bistro-",
      "Bistro",
      "bistró",
      "bistro_1",
      "bistro pod",
      "",
    ]) {
      expect(isVenueSlug(slug)).toBe(false);
    }
  });
});
