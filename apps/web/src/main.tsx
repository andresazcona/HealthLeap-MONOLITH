import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@fontsource-variable/inter';
import { ModoProvider } from './lib/modo';
import { AuthProvider } from './lib/auth';
import { NotificarProvider } from './lib/notificar';
import { App } from './App';

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true, staleTime: 15_000 } },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModoProvider>
      <QueryClientProvider client={qc}>
        <NotificarProvider>
          <AuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>
        </NotificarProvider>
      </QueryClientProvider>
    </ModoProvider>
  </StrictMode>,
);
