import { describe, expect, it } from 'vitest';
import ru from '@/messages/ru.json';

/** All leaf keys as dotted paths. */
const keys = (o: object, prefix = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v as object, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
/** Keys without plural suffixes: languages have different plural forms (ru: one/few/many/other, en: one/other). */
const baseKeys = (o: object) => [...new Set(keys(o).map((k) => k.replace(/_(zero|one|two|few|many|other)$/, '')))];

const languages = Object.entries(import.meta.glob<{ default: object }>('../src/messages/*.json', { eager: true })).map(
  ([path, mod]) => [path.replace(/^.*\/([\w-]+)\.json$/, '$1'), mod.default] as const,
);
const value = (o: object, key: string) =>
  key.split('.').reduce<unknown>((v, k) => (v as Record<string, unknown>)[k], o);

describe('messages', () => {
  // An empty file is a placeholder (the language is not offered yet); a filled one must be complete.
  it.each(languages.filter(([, m]) => Object.keys(m).length > 0))('%s has the same keys as ru.json', (_, m) => {
    expect(baseKeys(m).sort()).toEqual(baseKeys(ru).sort());
  });

  it.each(languages)('%s has no empty strings', (_, m) => {
    expect(keys(m).filter((k) => value(m, k) === '')).toEqual([]);
  });
});
