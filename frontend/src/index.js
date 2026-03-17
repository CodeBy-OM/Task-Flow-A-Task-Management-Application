import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a24',
              color: '#e8e8f0',
              border: '1px solid #2a2a3a',
              borderRadius: '10px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10d98e', secondary: '#0a0a0f' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#0a0a0f' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
