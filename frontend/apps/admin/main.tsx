import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AdminApp } from '@/admin/AdminApp';
import { AdminAuthProvider } from '@/admin/auth/AdminAuthContext';
import '@/admin/admin.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AdminAuthProvider>
          <AdminApp />
        </AdminAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
