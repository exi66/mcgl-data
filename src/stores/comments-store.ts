import { create } from "zustand"
import { supabase } from "@/lib/supabase"

const PAGE_SIZE = 10

interface SearchState {
  query: string
  inputValue: string
  items: Comment[]
  page: number
  hasMore: boolean
  isLoading: boolean
  filters: SearchFilters

  setInputValue: (val: string) => void
  runSearch: (parsedFilters: SearchFilters) => void
  fetchNextPage: () => Promise<void>
  clearSearch: () => void
}

export const useCommentSearchStore = create<SearchState>((set, get) => ({
  query: "",
  inputValue: "",
  items: [],
  page: 0,
  hasMore: true,
  isLoading: false,
  filters: { query: "" },

  setInputValue: (val) => set({ inputValue: val }),

  runSearch: (parsedFilters) => {
    set({
      filters: parsedFilters,
      query: parsedFilters.query,
      items: [],
      page: 0,
      hasMore: true,
    })
    get().fetchNextPage()
  },

  fetchNextPage: async () => {
    const { filters, page, items, isLoading, hasMore } = get()
    if (isLoading || (!hasMore && page !== 0)) return

    set({ isLoading: true })

    try {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let supabaseQuery = supabase
        .from("comments")
        .select("*")
        .range(from, to)
        .order("id", { ascending: false })

      if (filters.query) {
        supabaseQuery = supabaseQuery.ilike("plaintext", `%${filters.query}%`)
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (key === "query" || !value) return
        if (Array.isArray(value)) {
          supabaseQuery = supabaseQuery.in(key, value)
        } else {
          supabaseQuery = supabaseQuery.eq(key, value)
        }
      })

      const { data, error } = await supabaseQuery

      if (!error && data) {
        set({
          items: page === 0 ? data : [...items, ...data],
          hasMore: data.length === PAGE_SIZE,
          page: page + 1,
        })
      }
    } finally {
      set({ isLoading: false })
    }
  },

  clearSearch: () =>
    set({
      query: "",
      inputValue: "",
      items: [],
      page: 0,
      hasMore: false,
      filters: { query: "" },
    }),
}))
