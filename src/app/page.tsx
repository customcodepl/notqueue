import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "./locale-switcher";

// Placeholder page, replaced by the first real screen.
export default async function Home() {
  const t = await getTranslations("home");
  const { localeSwitcher } = await getMessages();

  return (
    <main>
      <h1>{t("heading")}</h1>
      <p>{t("tagline")}</p>
      {/* Client components get only their own namespaces. */}
      <NextIntlClientProvider messages={{ localeSwitcher }}>
        <LocaleSwitcher />
      </NextIntlClientProvider>
    </main>
  );
}
