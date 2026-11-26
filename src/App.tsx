import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { Moon, Sun } from 'lucide-react';
import { CommentCard, PostCard } from '@/components/record-cards';
import { SearchView } from '@/components/search-view';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { commentsEntity, postsEntity } from '@/lib/entities';
import { useSearchStore, type SearchTab } from '@/stores/search-store';
import type { ForumComment, ForumPost } from '@/types';

export default function App() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const dark = theme === 'system' ? matchMedia('(prefers-color-scheme: dark)').matches : theme === 'dark';
  const themeLabel = dark ? t('theme.light') : t('theme.dark');
  const { tab, setTab } = useSearchStore(useShallow((s) => ({ tab: s.tab, setTab: s.setTab })));

  useEffect(() => {
    document.title = t('app.title');
  }, [t]);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center gap-4 border-b bg-card px-3 py-2">
        <h1 className="flex min-w-0 items-center gap-2 font-medium">
          <img src="./favicon.svg" alt="" className="size-6" />
          <span className="truncate">{t('app.title')}</span>
        </h1>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            title={themeLabel}
            aria-label={themeLabel}
            onClick={() => setTheme(dark ? 'light' : 'dark')}
          >
            {dark ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>

      <main className="container mx-auto flex p-4">
        <Tabs value={tab} onValueChange={(value) => setTab(value as SearchTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-80">
            <TabsTrigger value="comments">{t(commentsEntity.label)}</TabsTrigger>
            <TabsTrigger value="posts">{t(postsEntity.label)}</TabsTrigger>
          </TabsList>

          <TabsContent value="comments" className="w-full">
            <SearchView<ForumComment>
              tab="comments"
              entity={commentsEntity}
              renderItem={(comment) => <CommentCard comment={comment} />}
            />
          </TabsContent>

          <TabsContent value="posts" className="w-full">
            <SearchView<ForumPost> tab="posts" entity={postsEntity} renderItem={(post) => <PostCard post={post} />} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
