import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/clerk-react';
import { AuthProvider } from './components/auth/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { CLERK_PUBLISHABLE_KEY } from './config/env';
import { App } from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 menit
      refetchOnWindowFocus: false,
    },
  },
});

const appTree = (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {CLERK_PUBLISHABLE_KEY ? (
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>{appTree}</ClerkProvider>
      ) : (
        appTree
      )}
    </ErrorBoundary>
  </StrictMode>
);
