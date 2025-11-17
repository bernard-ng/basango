import { createI18nServer } from "next-international/server";

export const { getStaticParams } = createI18nServer({
  en: () => import("./translations/en"),
});
