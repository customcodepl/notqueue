import { getTranslations } from "next-intl/server";

// Placeholder page, replaced by the first real screen.
export default async function Home() {
  const t = await getTranslations("home");

  return (
    <main>
      <h1>{t("heading")}</h1>
      <p>{t("tagline")}</p>
    </main>
  );
}
