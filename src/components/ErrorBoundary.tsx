import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React tree:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCacheAndReload = async () => {
    try {
      // Clear localStorage cache related to app items
      const keysToRemove = [
        'vovo_cart_items',
        'vovo_menu_items',
        'vovo_categories',
        'vovo_deleted_categories',
        'vovo_deleted_products',
        'vovo_company_settings'
      ];
      keysToRemove.forEach(k => {
        try { localStorage.removeItem(k); } catch {}
      });
      sessionStorage.clear();

      // Unregister service workers if any
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
    } catch (e) {
      console.warn('Error clearing caches:', e);
    }

    // Force reload bypassing cache
    window.location.href = window.location.origin + '?v=' + Date.now();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-black">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-md w-full bg-stone-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2">
              Massas da Vovó
            </h1>

            <p className="text-sm text-stone-400 font-normal leading-relaxed mb-6">
              Ocorreu uma pequena instabilidade ao carregar o cardápio. Clique no botão abaixo para restabelecer a conexão.
            </p>

            {/* Error detail (subtle) */}
            {this.state.error && (
              <div className="mb-6 p-3 bg-black/40 border border-white/5 rounded-xl text-left overflow-x-auto text-[11px] font-mono text-stone-400 max-h-24">
                {this.state.error.message || 'Erro de execução'}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black py-3.5 px-6 rounded-2xl shadow-lg transition-all active:scale-98 cursor-pointer text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recarregar Cardápio</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="w-full flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-3 px-6 rounded-2xl border border-white/10 transition-all text-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Atualizar Versão e Limpar Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
