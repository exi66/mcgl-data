import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchPage, PAGE_SIZE } from '@/lib/api';
import type { EntityConfig } from '@/lib/entities';
import { parseSearchQuery } from '@/lib/search-query';

/**
 * Бесконечный поиск по таблице. Запросы с устаревшими параметрами
 * отменяются react-query (через AbortSignal), поэтому ответ старого поиска
 * не может перезаписать результаты нового.
 */
export function useEntitySearch<T extends { id: number }>(entity: EntityConfig, rawQuery: string | null) {
  const parsed = useMemo(
    () => (rawQuery === null ? null : parseSearchQuery(rawQuery, entity.filters)),
    [rawQuery, entity.filters],
  );

  const query = useInfiniteQuery({
    queryKey: [entity.table, parsed?.text, parsed?.filters],
    queryFn: ({ pageParam, signal }) => fetchPage<T>(entity, parsed!, pageParam, signal),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => (lastPage.length === PAGE_SIZE ? lastPage[lastPage.length - 1].id : undefined),
    enabled: parsed !== null && parsed.errors.length === 0,
  });

  const items = useMemo(() => query.data?.pages.flat() ?? [], [query.data]);

  return { parsed, items, ...query };
}
