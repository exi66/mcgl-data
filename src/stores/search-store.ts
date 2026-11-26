import { create } from 'zustand';

export type SearchTab = 'comments' | 'posts';

const TABS: SearchTab[] = ['comments', 'posts'];

interface SearchState {
  tab: SearchTab;
  /** Текст в поле ввода */
  inputs: Record<SearchTab, string>;
  /** Отправленный запрос; null — поиск ещё не запускали */
  queries: Record<SearchTab, string | null>;

  setTab: (tab: SearchTab) => void;
  setInput: (tab: SearchTab, value: string) => void;
  submit: (tab: SearchTab) => void;
  clear: (tab: SearchTab) => void;
}

function readUrl(): Pick<SearchState, 'tab' | 'inputs' | 'queries'> {
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get('tab');
  const tab = TABS.includes(tabParam as SearchTab) ? (tabParam as SearchTab) : 'comments';
  const q = params.get('q');

  return {
    tab,
    inputs: { comments: '', posts: '', [tab]: q ?? '' },
    queries: { comments: null, posts: null, [tab]: q },
  };
}

export const useSearchStore = create<SearchState>()((set) => ({
  ...readUrl(),

  setTab: (tab) => set({ tab }),
  setInput: (tab, value) => set((s) => ({ inputs: { ...s.inputs, [tab]: value } })),
  submit: (tab) =>
    set((s) => ({
      queries: { ...s.queries, [tab]: s.inputs[tab].trim() },
    })),
  clear: (tab) =>
    set((s) => ({
      inputs: { ...s.inputs, [tab]: '' },
      queries: { ...s.queries, [tab]: null },
    })),
}));

// Активная вкладка и её запрос попадают в URL, чтобы поиском можно было поделиться
useSearchStore.subscribe((state, prev) => {
  if (state.tab === prev.tab && state.queries === prev.queries) return;

  const url = new URL(window.location.href);
  url.searchParams.set('tab', state.tab);
  const q = state.queries[state.tab];
  if (q) {
    url.searchParams.set('q', q);
  } else {
    url.searchParams.delete('q');
  }
  window.history.replaceState(null, '', url);
});
