import { expect, test } from "@playwright/test";

// The locale comes from the request, never from the URL (ADR-0018):
// the NEXT_LOCALE cookie, then Accept-Language, then the default `pl`.

const POLISH = "Wirtualna kolejka dla Twojego lokalu";
const ENGLISH = "A virtual queue for your venue";

test.describe("with an English browser", () => {
  test.use({ locale: "en-GB" });

  test("shows English", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(ENGLISH)).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

test.describe("with a Polish browser", () => {
  test.use({ locale: "pl-PL" });

  test("shows Polish", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(POLISH)).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "pl");
  });

  test("switches the language and keeps the choice", async ({ page }) => {
    await page.goto("/");
    const switcher = page.getByRole("navigation", { name: "Język" });

    await switcher.getByRole("button", { name: "English" }).click();
    await expect(page.getByText(ENGLISH)).toBeVisible();
    await expect(page.getByText(POLISH)).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page
        .getByRole("navigation", { name: "Language" })
        .getByRole("button", { name: "English" }),
    ).toHaveAttribute("aria-current", "true");

    await page.reload();
    await expect(page.getByText(ENGLISH)).toBeVisible();

    await page.getByRole("button", { name: "Polski" }).click();
    await expect(page.getByText(POLISH)).toBeVisible();
    await expect(page.getByText(ENGLISH)).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("lang", "pl");
  });
});

test("falls back to Polish for other languages", async ({ request }) => {
  const response = await request.get("/", {
    headers: { "accept-language": "de-DE,de;q=0.9" },
  });
  expect(await response.text()).toContain('<html lang="pl"');
});
