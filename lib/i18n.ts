/**
 * Phase 1 i18n — flat key-value with EN + LT parity.
 *
 * Intentionally minimal. No runtime ICU. Phase 2+ we'll evaluate
 * a richer system once string volume justifies it.
 *
 * Locale resolution: route prefix (/lt) takes precedence; otherwise
 * navigator.language; otherwise English.
 */

export type Locale = "en" | "lt";

export const LOCALES: readonly Locale[] = ["en", "lt"];

type Dict = Record<string, string>;

export const STRINGS: Record<Locale, Dict> = {
  en: {
    "app.name": "Pinara",
    "app.tagline": "A pineal-gland-centred practice instrument.",

    "session.tap_to_begin": "Tap the gland to begin",
    "session.hold_to_descend": "Hold to descend deeper",
    "session.length.11": "11 minutes",
    "session.length.22": "22 minutes",
    "session.length.33": "33 minutes",
    "session.length.55": "55 minutes",
    "session.length.66": "66 minutes",
    "session.start": "Begin",
    "session.end": "Close",
    "session.pause": "Hold",
    "session.resume": "Continue",

    "intent.choose": "Choose your intent",

    "darkness.suggest": "The chamber works best in darkness.",
    "darkness.tap_to_wake": "Tap to wake.",

    "permission.audio.prompt": "Pinara needs sound permission to play your session. Audio is generated live on your device.",
    "permission.motion.prompt": "Pinara uses motion sensors to track your stillness during practice. Data never leaves your device.",
    "permission.wakelock.failed": "Could not keep the screen awake. Your device may dim during practice.",

    "capability.banner.title": "Your device supports",
    "capability.banner.no_audio": "Audio is unavailable on this device.",
    "capability.banner.no_webgl": "3D rendering is unavailable. Pinara needs WebGL to show the gland.",

    "cosmic.planetary_hour": "Planetary hour",
    "cosmic.moon_phase": "Moon phase",
    "cosmic.schumann": "Schumann",
    "cosmic.refreshing": "Reading the field…",

    "moon.new": "New",
    "moon.waxing_crescent": "Waxing crescent",
    "moon.first_quarter": "First quarter",
    "moon.waxing_gibbous": "Waxing gibbous",
    "moon.full": "Full",
    "moon.waning_gibbous": "Waning gibbous",
    "moon.last_quarter": "Last quarter",
    "moon.waning_crescent": "Waning crescent",

    "planet.sun": "Sun",
    "planet.moon": "Moon",
    "planet.mars": "Mars",
    "planet.mercury": "Mercury",
    "planet.jupiter": "Jupiter",
    "planet.venus": "Venus",
    "planet.saturn": "Saturn",

    "error.field_quiet": "The field is quiet.",
    "error.tap_to_retry": "Tap to try again.",

    "footer.lang_switch": "Lietuvių",
    "footer.privacy": "Your biometric data never leaves your device.",
  },
  lt: {
    "app.name": "Pinara",
    "app.tagline": "Į epifizę sutelktas praktikos instrumentas.",

    "session.tap_to_begin": "Palieskite liaukas, kad pradėtumėte",
    "session.hold_to_descend": "Palaikykite, kad nusileistumėte giliau",
    "session.length.11": "11 minučių",
    "session.length.22": "22 minutės",
    "session.length.33": "33 minutės",
    "session.length.55": "55 minutės",
    "session.length.66": "66 minutės",
    "session.start": "Pradėti",
    "session.end": "Užverti",
    "session.pause": "Palaikyti",
    "session.resume": "Tęsti",

    "intent.choose": "Pasirinkite ketinimą",

    "darkness.suggest": "Kambarys geriausiai veikia tamsoje.",
    "darkness.tap_to_wake": "Palieskite, kad pažadintumėte.",

    "permission.audio.prompt": "Pinara prašo garso leidimo, kad galėtų groti jūsų sesiją. Garsas generuojamas tiesiogiai jūsų įrenginyje.",
    "permission.motion.prompt": "Pinara naudoja judesio jutiklius, kad sektų jūsų ramybę praktikos metu. Duomenys niekada neišeina iš įrenginio.",
    "permission.wakelock.failed": "Nepavyko išlaikyti ekrano įjungto. Įrenginys gali pritemti praktikos metu.",

    "capability.banner.title": "Jūsų įrenginys palaiko",
    "capability.banner.no_audio": "Garsas šiame įrenginyje negalimas.",
    "capability.banner.no_webgl": "3D atvaizdavimas negalimas. Pinarai reikia WebGL, kad parodytų liauką.",

    "cosmic.planetary_hour": "Planetinė valanda",
    "cosmic.moon_phase": "Mėnulio fazė",
    "cosmic.schumann": "Šumano dažnis",
    "cosmic.refreshing": "Skaitomas laukas…",

    "moon.new": "Jaunatis",
    "moon.waxing_crescent": "Augantis pjautuvas",
    "moon.first_quarter": "Pirmasis ketvirtis",
    "moon.waxing_gibbous": "Augantis kuprotas",
    "moon.full": "Pilnatis",
    "moon.waning_gibbous": "Mažėjantis kuprotas",
    "moon.last_quarter": "Paskutinis ketvirtis",
    "moon.waning_crescent": "Mažėjantis pjautuvas",

    "planet.sun": "Saulė",
    "planet.moon": "Mėnulis",
    "planet.mars": "Marsas",
    "planet.mercury": "Merkurijus",
    "planet.jupiter": "Jupiteris",
    "planet.venus": "Venera",
    "planet.saturn": "Saturnas",

    "error.field_quiet": "Laukas tylus.",
    "error.tap_to_retry": "Palieskite, kad bandytumėte iš naujo.",

    "footer.lang_switch": "English",
    "footer.privacy": "Jūsų biometriniai duomenys niekada neišeina iš įrenginio.",
  },
};

export function t(locale: Locale, key: string): string {
  const dict = STRINGS[locale] ?? STRINGS.en;
  return dict[key] ?? STRINGS.en[key] ?? key;
}

/** Returns the set of keys missing in any non-English locale.
 *  Vitest test asserts this is empty. */
export function missingKeys(): { locale: Locale; key: string }[] {
  const enKeys = Object.keys(STRINGS.en);
  const result: { locale: Locale; key: string }[] = [];
  for (const locale of LOCALES) {
    if (locale === "en") continue;
    const dict = STRINGS[locale];
    for (const key of enKeys) {
      if (!(key in dict)) result.push({ locale, key });
    }
  }
  return result;
}

/** Resolve locale from URL pathname (server + client safe). */
export function resolveLocale(pathname: string): Locale {
  if (pathname.startsWith("/lt")) return "lt";
  return "en";
}
