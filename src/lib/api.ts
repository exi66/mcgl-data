import { PostgrestClient } from '@supabase/postgrest-js';
import i18next from 'i18next';
import type { EntityConfig } from '@/lib/entities';
import type { ParsedQuery } from '@/lib/search-query';

export const PAGE_SIZE = 10;

export const apiUrl: string = import.meta.env.VITE_API_URL;

const client = new PostgrestClient(apiUrl);

export const getApiUrl = (table: string, id: number) => new URL(`${table}?id=eq.${id}`, apiUrl).toString();

/**
 * Загружает страницу записей, отсортированных по id по убыванию.
 * Пагинация keyset: `cursor` — id последней записи предыдущей страницы.
 */
export async function fetchPage<T extends { id: number }>(
  entity: EntityConfig,
  query: ParsedQuery,
  cursor: number | undefined,
  signal: AbortSignal,
): Promise<T[]> {
  let request = client.from(entity.table).select(entity.columns).order('id', { ascending: false }).limit(PAGE_SIZE);

  if (cursor !== undefined) {
    request = request.lt('id', cursor);
  }

  if (query.text) {
    // websearch_to_tsquery: "фраза", or, -исключение; с учётом словоформ
    request = request.textSearch('fts', query.text, {
      config: 'russian',
      type: 'websearch',
    });
  }

  for (const [key, values] of Object.entries(query.filters)) {
    const spec = entity.filters[key];
    const column = spec.column ?? key;
    switch (spec.kind) {
      case 'int':
        request = values.length === 1 ? request.eq(column, values[0]) : request.in(column, values);
        break;
      case 'int[]':
      case 'text[]':
        request = request.contains(column, values);
        break;
      case 'date-from':
        request = request.gte(column, values[0]);
        break;
      case 'date-to':
        request = request.lt(column, values[0]);
        break;
    }
  }

  const { data, error } = await request.abortSignal(signal);
  if (error) {
    throw new Error(error.message || i18next.t('api.loadFailed'));
  }
  // Список колонок задан строкой из конфига, postgrest-js не выводит по ней тип
  return data as unknown as T[];
}
