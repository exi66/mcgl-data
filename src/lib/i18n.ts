// Shared by every project made from the starter — keep it identical (copy changes back to github.com/exi66/starter).
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

/** Source language: its file defines the keys (and their types, see src/i18next.d.ts) and fills any gap. */
export const DEFAULT_LANGUAGE = 'ru';
/** Where the chosen language is kept: one key for every project on the domain, so the choice follows the user. */
const STORAGE_KEY = 'i18nextLng';

type Messages = Record<string, unknown>;
const files = import.meta.glob<{ default: Messages }>('../messages/*.json', { eager: true });
const messages = Object.fromEntries(
  Object.entries(files).map(([path, mod]) => [path.replace(/^.*\/([\w-]+)\.json$/, '$1'), mod.default]),
);

/**
 * Languages this project offers: every src/messages/<lang>.json that has strings. An empty file is a placeholder —
 * the language appears once it is filled. The default language comes first.
 */
export const SUPPORTED_LANGUAGES: string[] = Object.keys(messages)
  .filter((lng) => lng === DEFAULT_LANGUAGE || Object.keys(messages[lng]).length > 0)
  .sort((a, b) => (a === DEFAULT_LANGUAGE ? -1 : b === DEFAULT_LANGUAGE ? 1 : a.localeCompare(b)));

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: Object.fromEntries(SUPPORTED_LANGUAGES.map((lng) => [lng, { translation: messages[lng] }])),
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: DEFAULT_LANGUAGE,
    // Reads the saved choice (possibly made in another project), then the browser language; a language this project
    // does not have falls back to the default. `caches: []` — detection never writes the shared key, so a project
    // with fewer languages does not overwrite the user's choice; only setLanguage() saves it.
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: [],
    },
    interpolation: {
      escapeValue: false, // React escapes already
    },
  });

/** Switches the language and remembers it for every project on the domain. */
export function setLanguage(lng: string): void {
  void i18n.changeLanguage(lng);
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    /* storage unavailable */
  }
}

/** Keeps <html lang> in sync with the current language (screen readers, hyphenation, spell check). */
const syncLang = () => {
  if (typeof document !== 'undefined') document.documentElement.lang = i18n.resolvedLanguage ?? DEFAULT_LANGUAGE;
};
syncLang();
i18n.on('languageChanged', syncLang);

export default i18n;
