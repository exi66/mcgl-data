import { useEffect, useState, type ReactNode } from "react"
import { useInView } from "react-intersection-observer"
import { useShallow } from "zustand/react/shallow"
import { AlertCircle, CircleHelp, Search, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useEntitySearch } from "@/hooks/use-entity-search"
import type { EntityConfig } from "@/lib/entities"
import { isQueryEmpty, type ParsedQuery } from "@/lib/search-query"
import { cn } from "@/lib/utils"
import { useSearchStore, type SearchTab } from "@/stores/search-store"

const INPUT_ICON_BUTTON =
  "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"

interface SearchViewProps<T extends { id: number }> {
  tab: SearchTab
  entity: EntityConfig
  renderItem: (item: T) => ReactNode
}

export function SearchView<T extends { id: number }>({
  tab,
  entity,
  renderItem,
}: SearchViewProps<T>) {
  const { input, rawQuery, setInput, submit, clear } = useSearchStore(
    useShallow((s) => ({
      input: s.inputs[tab],
      rawQuery: s.queries[tab],
      setInput: s.setInput,
      submit: s.submit,
      clear: s.clear,
    }))
  )

  const {
    parsed,
    items,
    error,
    refetch,
    isFetching,
    isPending,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useEntitySearch<T>(entity, rawQuery)

  const { ref: sentinelRef, inView } = useInView({ rootMargin: "200px 0px" })

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !error) {
      void fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, error, fetchNextPage])

  const hasValidQuery = parsed !== null && parsed.errors.length === 0
  const isInitialLoading = hasValidQuery && isPending && isFetching

  return (
    <div>
      <div className="w-full space-y-2">
        <form
          className="flex flex-row items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            submit(tab)
          }}
        >
          <div className="relative grow">
            <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className={cn("truncate pl-9", input ? "pr-18" : "pr-9")}
              placeholder="Поиск..."
              aria-label={`Поиск: ${entity.label.toLowerCase()}`}
              value={input}
              onChange={(e) => setInput(tab, e.target.value)}
            />
            <div className="absolute top-1/2 right-0 flex -translate-y-1/2">
              {input && (
                <button
                  type="button"
                  title="Очистить"
                  aria-label="Очистить"
                  className={INPUT_ICON_BUTTON}
                  onClick={() => clear(tab)}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <SearchHelp entity={entity} />
            </div>
          </div>
          <Button
            type="submit"
            className="cursor-pointer px-2.25 lg:px-6"
            aria-label="Искать"
          >
            <Search className="lg:hidden" />
            <span className="hidden lg:inline">Поиск</span>
          </Button>
        </form>

        {parsed && (
          <div className="flex flex-wrap items-center gap-2">
            <QuerySummary query={parsed} />
          </div>
        )}
      </div>

      <Separator className="mt-2 mb-4" />

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
          <div className="py-4 text-center text-muted-foreground">
            Ничего не найдено
          </div>
        )}

        {items.map((item) => (
          <div key={item.id}>{renderItem(item)}</div>
        ))}

        {error && (
          <Message icon>
            <span>Ошибка загрузки: {error.message}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="cursor-pointer"
              onClick={() => void (hasNextPage ? fetchNextPage() : refetch())}
            >
              Повторить
            </Button>
          </Message>
        )}

        <div ref={sentinelRef}>
          {(isInitialLoading || isFetchingNextPage) && (
            <div className="flex flex-col items-center justify-center gap-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          )}
          {hasValidQuery && !hasNextPage && !isFetching && items.length > 0 && (
            <Button
              type="button"
              className="mx-auto flex cursor-pointer px-6"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Наверх
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function QuerySummary({ query }: { query: ParsedQuery }) {
  if (isQueryEmpty(query)) {
    return <span className="text-muted-foreground">Последние записи</span>
  }

  return (
    <>
      <span className="text-muted-foreground">Результаты поиска:</span>
      {query.text && (
        <span className="font-semibold italic">"{query.text}"</span>
      )}
      {Object.entries(query.filters).map(([key, values]) => (
        <Badge key={key} variant="secondary">
          <span className="text-muted-foreground">{key}:</span>
          {values.join(", ")}
        </Badge>
      ))}
    </>
  )
}

function SearchHelp({ entity }: { entity: EntityConfig }) {
  // HoverCard открывается по наведению и фокусу; клик добавлен для тач-экранов
  const [open, setOpen] = useState(false)

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={150}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label="Подсказка по поиску"
          className={INPUT_ICON_BUTTON}
          onClick={() => setOpen((v) => !v)}
        >
          <CircleHelp className="h-4 w-4" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        align="end"
        className="w-[min(24rem,calc(100vw-2rem))] text-sm"
      >
        <p className="mb-2 font-medium">В поиске доступно:</p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground marker:text-muted-foreground/60">
          <li>поиск по словоформам</li>
          <li>
            <Code>"точная фраза"</Code>
          </li>
          <li>
            операторы:
            <ul className="mt-1 list-[circle] space-y-1 pl-5">
              <li>
                <Code>шахта or руда</Code>
              </li>
              <li>
                <Code>-исключение</Code>
              </li>
            </ul>
          </li>
          <li>
            поиск по ключам:
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
  )
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs break-all text-foreground">
      {children}
    </code>
  )
}

function Message({ children, icon }: { children: ReactNode; icon?: boolean }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {icon && <AlertCircle className="h-4 w-4 shrink-0" />}
      {children}
    </div>
  )
}
