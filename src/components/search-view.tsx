import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from 'react-intersection-observer';
import { useShallow } from 'zustand/react/shallow';
import { AlertCircle, CircleHelp, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useEntitySearch } from '@/hooks/use-entity-search';
import type { EntityConfig } from '@/lib/entities';
import { isQueryEmpty, type ParsedQuery } from '@/lib/search-query';
import { cn } from '@/lib/utils';
import { useSearchStore, type SearchTab } from '@/stores/search-store';

const INPUT_ICON_BUTTON =
  'inline-flex size-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground';

interface SearchViewProps<T extends { id: number }> {
  tab: SearchTab;
  entity: EntityConfig;
  renderItem: (item: T) => ReactNode;
}

export function SearchView<T extends { id: number }>({ tab, entity, renderItem }: SearchViewProps<T>) {
  const { t } = useTranslation();
  const { input, rawQuery, setInput, submit, clear } = useSearchStore(
    useShallow((s) => ({
      input: s.inputs[tab],
      rawQuery: s.queries[tab],
      setInput: s.setInput,
      submit: s.submit,
      clear: s.clear,
    })),
  );

  const { parsed, items, error, refetch, isFetching, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useEntitySearch<T>(entity, rawQuery);

  const { ref: sentinelRef, inView } = useInView({ rootMargin: '200px 0px' });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !error) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, error, fetchNextPage]);

  const hasValidQuery = parsed !== null && parsed.errors.length === 0;
  const isInitialLoading = hasValidQuery && isPending && isFetching;

  return (
    <div>
      <div className="mb-4 w-full space-y-2">
        <form
          className="flex flex-row items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit(tab);
          }}
        >
          <div className="relative grow">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className={cn('truncate pl-9', input ? 'pr-20' : 'pr-10')}
              placeholder={t('search.placeholder')}
              aria-label={t('search.label', { entity: t(entity.label).toLowerCase() })}
              value={input}
              onChange={(e) => setInput(tab, e.target.value)}
            />
            <div className="absolute top-1/2 right-0 flex -translate-y-1/2">
              {input && (
                <button
                  type="button"
                  title={t('search.clear')}
                  aria-label={t('search.clear')}
                  className={INPUT_ICON_BUTTON}
                  onClick={() => clear(tab)}
                >
                  <X className="size-4" />
                </button>
              )}
              <SearchHelp entity={entity} />
            </div>
          </div>
          <Button type="submit" className="px-2.5 lg:px-6" aria-label={t('search.submitLabel')}>
            <Search className="lg:hidden" />
            <span className="hidden lg:inline">{t('search.submit')}</span>
          </Button>
        </form>

        {parsed && (
          <div className="flex flex-wrap items-center gap-2">
            <QuerySummary query={parsed} />
          </div>
        )}
      </div>

      <div className="space-y-4">
        {parsed && parsed.errors.length > 0 && (
          <Message icon>
            <ul>
              {parsed.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Message>
        )}

        {hasValidQuery && !isFetching && !error && items.length === 0 && (
          <div className="py-4 text-center text-muted-foreground">{t('search.empty')}</div>
        )}

        {items.map((item) => (
          <div key={item.id}>{renderItem(item)}</div>
        ))}

        {error && (
          <Message icon>
            <span>{t('search.loadError', { message: error.message })}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void (hasNextPage ? fetchNextPage() : refetch())}
            >
              {t('search.retry')}
            </Button>
          </Message>
        )}

        <div ref={sentinelRef}>
          {(isInitialLoading || isFetchingNextPage) && (
            <div className="flex flex-col items-center justify-center gap-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}
          {hasValidQuery && !hasNextPage && !isFetching && items.length > 0 && (
            <Button
              type="button"
              className="mx-auto flex px-6"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {t('search.toTop')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function QuerySummary({ query }: { query: ParsedQuery }) {
  const { t } = useTranslation();

  if (isQueryEmpty(query)) {
    return <span className="text-muted-foreground">{t('search.latest')}</span>;
  }

  return (
    <>
      <span className="text-muted-foreground">{t('search.results')}</span>
      {query.text && <span className="font-semibold italic">"{query.text}"</span>}
      {Object.entries(query.filters).map(([key, values]) => (
        <Badge key={key} variant="outline" className="normal-case">
          <span className="text-muted-foreground">{key}:</span>
          {values.join(', ')}
        </Badge>
      ))}
    </>
  );
}

function SearchHelp({ entity }: { entity: EntityConfig }) {
  const { t } = useTranslation();
  // Открывается по наведению и фокусу; клик добавлен для тач-экранов
  const [open, setOpen] = useState(false);

  return (
    <HoverCard open={open} onOpenChange={setOpen}>
      <HoverCardTrigger
        delay={150}
        render={
          <button
            type="button"
            aria-label={t('help.trigger')}
            className={INPUT_ICON_BUTTON}
            onClick={() => setOpen((v) => !v)}
          />
        }
      >
        <CircleHelp className="size-4" />
      </HoverCardTrigger>
      <HoverCardContent align="end" className="w-[min(24rem,calc(100vw-2rem))] text-sm">
        <p className="mb-2 font-medium">{t('help.title')}</p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground marker:text-muted-foreground/60">
          <li>{t('help.wordForms')}</li>
          <li>
            <Code>{t('help.phrase')}</Code>
          </li>
          <li>
            {t('help.operators')}
            <ul className="mt-1 list-[circle] space-y-1 pl-5">
              <li>
                <Code>{t('help.or')}</Code>
              </li>
              <li>
                <Code>{t('help.exclude')}</Code>
              </li>
            </ul>
          </li>
          <li>
            {t('help.keys')}
            <ul className="mt-1 list-[circle] space-y-1 pl-5">
              {Object.entries(entity.filters).map(([key, spec]) => (
                <li key={key}>
                  <Code>{spec.example}</Code>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code className="bg-muted px-1 py-0.5 font-mono text-xs break-all text-foreground">{children}</code>;
}

function Message({ children, icon }: { children: ReactNode; icon?: boolean }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-2 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {icon && <AlertCircle className="size-4 shrink-0" />}
      {children}
    </div>
  );
}
