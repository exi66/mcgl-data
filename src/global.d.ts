interface Comment {
  id: number
  plaintext: string
  author: number
  user: number
  created: string
}

interface Post {
  id: number
  plaintext: string
  created: string
  usersInText: number[]
  linksInText: string[]
}

interface SearchFilters {
  query: string
  [key: string]: string | string[] | number | number[]
}
