import { PostgrestClient } from "@supabase/postgrest-js"

export const apiUrl = import.meta.env.VITE_API_URL

export const getUrlToCommentById = (id: number) =>
  new URL(`comments?id=eq.${id}`, apiUrl).toString()

export const getUrlToPostById = (id: number) =>
  new URL(`posts?id=eq.${id}`, apiUrl).toString()

export const supabase = new PostgrestClient(apiUrl)
