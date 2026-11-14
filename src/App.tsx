import { useShallow } from "zustand/react/shallow"
import { CommentCard, PostCard } from "@/components/record-cards"
import { SearchView } from "@/components/search-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { commentsEntity, postsEntity } from "@/lib/entities"
import { useSearchStore, type SearchTab } from "@/stores/search-store"
import type { ForumComment, ForumPost } from "@/types"

export default function App() {
  const { tab, setTab } = useSearchStore(
    useShallow((s) => ({ tab: s.tab, setTab: s.setTab }))
  )

  return (
    <main className="container mx-auto flex p-4">
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as SearchTab)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 lg:w-64">
          <TabsTrigger value="comments">{commentsEntity.label}</TabsTrigger>
          <TabsTrigger value="posts">{postsEntity.label}</TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="w-full">
          <SearchView<ForumComment>
            tab="comments"
            entity={commentsEntity}
            renderItem={(comment) => <CommentCard comment={comment} />}
          />
        </TabsContent>

        <TabsContent value="posts" className="w-full">
          <SearchView<ForumPost>
            tab="posts"
            entity={postsEntity}
            renderItem={(post) => <PostCard post={post} />}
          />
        </TabsContent>
      </Tabs>
    </main>
  )
}
