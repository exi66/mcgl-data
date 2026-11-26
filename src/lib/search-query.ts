import i18next from 'i18next';

/**
 * - int: одно значение → eq, несколько через запятую → in (любое из)
 * - int[] / text[]: колонка-массив, contains (содержит все перечисленные)
 * - date-from / date-to: дата ГГГГ-ММ-ДД, created >= from / created < to
 */
export type FilterKind = 'int' | 'int[]' | 'text[]' | 'date-from' | 'date-to';

export interface FilterSpec {
  kind: FilterKind;
  /** Пример использования для подсказки, например `author:1,2` */
  example: string;
  /** Колонка в БД, если отличается от имени фильтра */
  column?: string;
}

export type FilterSpecs = Record<string, FilterSpec>;

export type FilterValues = number[] | string[];

export interface ParsedQuery {
  text: string;
  filters: Record<string, FilterValues>;
  errors: string[];
}

// Ключ не должен быть продолжением слова или пути, иначе "a/b:c" стал бы фильтром.
// Значение — всё до пробела, чтобы `after:вчера` давал ошибку, а не уходил в текст
const FILTER_RE = /(?<![\w/])(\w+):(\S+)/g;

/**
 * Разбирает строку вида `текст author:1,2 user:5` на текст и фильтры.
 * Неизвестные ключи остаются частью текста (например, `http://...`).
 */
export function parseSearchQuery(input: string, specs: FilterSpecs): ParsedQuery {
  const filters: Record<string, (number | string)[]> = {};
  const errors: string[] = [];

  const text = input
    .replace(FILTER_RE, (match, key: string, rawValue: string) => {
      const spec = Object.hasOwn(specs, key) ? specs[key] : undefined;
      if (!spec) return match;

      const parts = rawValue
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

      const values: (number | string)[] = [];
      for (const part of parts) {
        if (spec.kind === 'text[]') {
          values.push(part);
        } else if (spec.kind === 'date-from' || spec.kind === 'date-to') {
          if (isValidDate(part)) {
            values.push(part);
          } else {
            errors.push(i18next.t('query.notDate', { key, value: part }));
          }
        } else if (/^\d+$/.test(part)) {
          values.push(Number(part));
        } else {
          errors.push(i18next.t('query.notInt', { key, value: part }));
        }
      }

      const isDate = spec.kind === 'date-from' || spec.kind === 'date-to';
      const existing = isDate ? [] : (filters[key] ?? []);
      // У даты одно значение: берём последнее
      filters[key] = isDate ? values.slice(-1) : [...new Set([...existing, ...values])];
      return ' ';
    })
    .replace(/\s+/g, ' ')
    .trim();

  for (const [key, values] of Object.entries(filters)) {
    if (values.length === 0) {
      delete filters[key];
    }
  }

  return { text, filters: filters as Record<string, FilterValues>, errors };
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function isQueryEmpty(query: ParsedQuery): boolean {
  return !query.text && Object.keys(query.filters).length === 0;
}
