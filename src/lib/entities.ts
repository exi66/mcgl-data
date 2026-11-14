import type { FilterSpec, FilterSpecs } from "@/lib/search-query"
import type { ForumComment, ForumPost } from "@/types"

export interface EntityConfig {
  table: string
  label: string
  /** Колонки для select: без служебной fts */
  columns: string
  filters: FilterSpecs
}

const dateFilters = {
  after: {
    kind: "date-from",
    column: "created",
    example: "after:2016-01-31",
  },
  before: {
    kind: "date-to",
    column: "created",
    example: "before:2017-01-01",
  },
} as const satisfies Record<string, FilterSpec>

export const commentsEntity = {
  table: "comments",
  label: "Комментарии",
  columns: "id,created,plaintext,user,author",
  filters: {
    id: { kind: "int", example: "id:775" },
    author: {
      kind: "int",
      example: "author:1,2",
    },
    user: {
      kind: "int",
      example: "user:41234",
    },
    ...dateFilters,
  },
} as const satisfies EntityConfig

export const postsEntity = {
  table: "posts",
  label: "Посты",
  columns: "id,created,plaintext,html,usersInText,linksInText",
  filters: {
    id: { kind: "int", example: "id:113294" },
    usersInText: {
      kind: "int[]",
      example: "usersInText:1,12120",
    },
    linksInText: {
      kind: "text[]",
      example: "linksInText:http://vk.com/x",
    },
    ...dateFilters,
  },
} as const satisfies EntityConfig

export interface EntityRows {
  comments: ForumComment
  posts: ForumPost
}
