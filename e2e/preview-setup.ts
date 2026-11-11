import { request, type FullConfig } from "@playwright/test";

// Where the Vercel bypass cookie is saved for every test. Not in
// playwright-report/, which CI uploads: the cookie opens every preview.
export const STORAGE_STATE = "playwright/.auth/preview.json";

// Previews sit behind Vercel Authentication. The bypass secret is exchanged
// once for Vercel's host-only cookie, so it is never sent to other origins
// (as extraHTTPHeaders would, e.g. to Sentry ingest).
export default async function previewSetup(config: FullConfig) {
  const { baseURL } = config.projects[0]!.use;
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const context = await request.newContext({
    baseURL,
    extraHTTPHeaders: secret
      ? {
          "x-vercel-protection-bypass": secret,
          "x-vercel-set-bypass-cookie": "true",
        }
      : {},
  });

  // Without a valid secret Vercel redirects to its login page, which answers
  // 200, so the final host is what tells.
  const response = await context.get("/");
  if (new URL(response.url()).host !== new URL(baseURL!).host) {
    throw new Error(
      `${baseURL} redirected to ${new URL(response.url()).origin}: VERCEL_AUTOMATION_BYPASS_SECRET is missing or wrong.`,
    );
  }
  if (!response.ok()) {
    throw new Error(`${baseURL} answered ${response.status()}.`);
  }

  await context.storageState({ path: STORAGE_STATE });
  await context.dispose();
}
