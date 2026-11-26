import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { ThemeProvider } from '@/components/theme-provider';
import '@/lib/i18n';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Дамп статичен: повторно запрашивать те же данные незачем
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
