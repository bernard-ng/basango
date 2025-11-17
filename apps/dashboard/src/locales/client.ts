"use client";

import { createI18nClient } from "next-international/client";

// NOTE: Also update middleware.ts to support locale
export const languages = ["en"];

export const { I18nProviderClient, useCurrentLocale } = createI18nClient({
  en: () => import("./translations/en"),
});
