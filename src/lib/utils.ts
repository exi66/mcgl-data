import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseSearchQuery = (input: string): SearchFilters => {
  const filterRegex = /(\w+):([\w,.\-/:?=&%]+)/g
  const filters: SearchFilters = { query: "" }

  const cleanText = input
    .replace(filterRegex, (_match, key, value) => {
      const rawValues = value.includes(",")
        ? value
            .split(",")
            .map((v: string) => v.trim())
            .filter(Boolean)
        : value.trim()

      if (key === "usersInText") {
        const vals = Array.isArray(rawValues) ? rawValues : [rawValues]
        filters[key] = vals.map(Number).filter((n) => !isNaN(n))
      } else if (key === "linksInText") {
        filters[key] = Array.isArray(rawValues) ? rawValues : [rawValues]
      } else {
        filters[key] = rawValues
      }

      return ""
    })
    .replace(/\s+/g, " ")
    .trim()

  filters.query = cleanText
  return filters
}
