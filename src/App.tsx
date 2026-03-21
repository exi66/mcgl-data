import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommentsSearch } from "@/components/comments-search"
import { PostsSearch } from "@/components/posts-search"

export default function App() {
  return (
    <main className="container mx-auto flex p-4">
      <Tabs defaultValue="comments" className="w-full">
        <TabsList className="grid w-64 grid-cols-2">
          <TabsTrigger value="comments">Комментарии</TabsTrigger>
          <TabsTrigger value="posts">Посты</TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="w-full">
          <CommentsSearch />
        </TabsContent>

        <TabsContent value="posts" className="w-full">
          <PostsSearch />
        </TabsContent>
      </Tabs>
    </main>
  )
}
