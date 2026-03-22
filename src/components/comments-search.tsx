import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { useCommentSearchStore } from "@/stores/comments-store"
import { ExternalLink, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { parseSearchQuery } from "@/lib/utils"
import { getUrlToCommentById } from "@/lib/supabase"

export function CommentsSearch() {
  const {
    items,
    isLoading,
    hasMore,
    inputValue,
    setInputValue,
    runSearch,
    fetchNextPage,
    clearSearch,
    filters,
  } = useCommentSearchStore()

  const { ref, inView } = useInView()
  const isSearchEmpty = !filters.query && Object.keys(filters).length <= 1

  useEffect(() => {
    if (inView && hasMore && !isLoading && items.length > 0) {
      fetchNextPage()
    }
  }, [inView, hasMore, isLoading, items.length, fetchNextPage])

  const handleRunSearch = () => {
    const parsed = parseSearchQuery(inputValue)
    runSearch(parsed)
  }

  return (
    <div>
      <div className="w-full space-y-2">
        <div className="flex flex-row items-center gap-2">
          <div className="relative grow">
            <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="truncate px-9"
              placeholder="Поиск..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRunSearch()}
            />
            {inputValue && (
              <button
                type="button"
                title="Очистить"
                className="absolute top-1/2 right-0 inline-flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded transition-colors hover:text-muted-foreground"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            className="cursor-pointer px-2.25 lg:px-6"
            onClick={handleRunSearch}
          >
            <Search className="lg:hidden" />
            <span className="hidden lg:inline">Поиск</span>
          </Button>
        </div>

        {(filters.query || Object.keys(filters).length > 1) && (
          <div className="flex flex-wrap items-end gap-2">
            <span className="text-muted-foreground">Результаты поиска:</span>
            {filters.query && (
              <span className="font-semibold italic">"{filters.query}"</span>
            )}
            {Object.entries(filters).map(([key, value]) => {
              if (key === "query" || !value) return null
              return (
                <Badge key={key} variant="secondary">
                  <span className="text-muted-foreground">{key}:</span>
                  {Array.isArray(value) ? value.join(", ") : value}
                </Badge>
              )
            })}
          </div>
        )}
      </div>

      <Separator className="mt-2 mb-4" />

      <div className="space-y-4">
        {items.length === 0 && !isLoading && !isSearchEmpty && (
          <div className="py-4 text-center text-muted-foreground">
            Ничего не найдено
          </div>
        )}

        {items.map((comment, index) => (
          <Card key={`${comment.id}-${index}`} className="p-2">
            <CardContent className="space-y-1 px-0">
              <div className="flex flex-row flex-wrap items-end gap-2">
                <Badge asChild>
                  <a href={getUrlToCommentById(comment.id)} target="_blank">
                    <span className="text-primary-foreground/80">id:</span>
                    {comment.id}
                    <ExternalLink />
                  </a>
                </Badge>
                <Badge variant="secondary">
                  <span className="text-muted-foreground">author:</span>
                  {comment.author}
                </Badge>
                <Badge variant="secondary">
                  <span className="text-muted-foreground">user:</span>
                  {comment.user}
                </Badge>
                <Badge variant="secondary">
                  <span className="text-muted-foreground">created:</span>
                  {new Date(comment.created).toLocaleString()}
                </Badge>
              </div>
              <pre className="whitespace-pre-wrap text-muted-foreground">
                {comment.plaintext}
              </pre>
            </CardContent>
          </Card>
        ))}

        <div ref={ref}>
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3">
              <Skeleton className="h-16 w-full rounded-lg"></Skeleton>
              <Skeleton className="h-16 w-full rounded-lg"></Skeleton>
              <Skeleton className="h-16 w-full rounded-lg"></Skeleton>
            </div>
          )}
          {!hasMore && items.length > 0 && (
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
