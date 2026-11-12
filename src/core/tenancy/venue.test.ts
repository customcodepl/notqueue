import { describe, expect, it } from "vitest";

import { isContactFieldPolicy } from "./contact-fields";
import { DEFAULT_VENUE_SETTINGS } from "./venue";

describe("venue defaults", () => {
  it("collect a name, offer phone and hide email", () => {
    expect(DEFAULT_VENUE_SETTINGS.contactFields).toEqual({
      name: "required",
      phone: "optional",
      email: "hidden",
    });
  });

  it("start the business day at 04:00 with Polish as default and all locales enabled", () => {
    expect(DEFAULT_VENUE_SETTINGS.businessDayStart).toBe("04:00");
    expect(DEFAULT_VENUE_SETTINGS.defaultLocale).toBe("pl");
    expect(DEFAULT_VENUE_SETTINGS.enabledLocales).toEqual(["pl", "en"]);
    expect(DEFAULT_VENUE_SETTINGS.browserLocaleEnabled).toBe(true);
    expect(DEFAULT_VENUE_SETTINGS.privacyNoticeUrl).toBeNull();
  });

  it("recognizes only the three contact-field policies", () => {
    expect(isContactFieldPolicy("optional")).toBe(true);
    expect(isContactFieldPolicy("mandatory")).toBe(false);
  });
});
