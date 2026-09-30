import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Auto-recovery for new Vercel deployments when dynamic chunk hashes change
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event?.message?.toLowerCase() || '';
    if (
      msg.includes('dynamically imported module') ||
      msg.includes('loading chunk') ||
      msg.includes('failed to fetch') ||
      msg.includes('loading css chunk')
    ) {
      const storageKey = 'vovo_last_chunk_reload';
      const lastReload = Number(sessionStorage.getItem(storageKey) || 0);
      const now = Date.now();
      // Reload at most once every 10 seconds to avoid infinite loop
      if (now - lastReload > 10000) {
        sessionStorage.setItem(storageKey, String(now));
        window.location.reload();
      }
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason?.message?.toLowerCase() || String(event?.reason || '').toLowerCase();
    if (
      reason.includes('dynamically imported module') ||
      reason.includes('loading chunk') ||
      reason.includes('failed to fetch')
    ) {
      const storageKey = 'vovo_last_chunk_reload';
      const lastReload = Number(sessionStorage.getItem(storageKey) || 0);
      const now = Date.now();
      if (now - lastReload > 10000) {
        sessionStorage.setItem(storageKey, String(now));
        window.location.reload();
      }
    }
  });
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
