import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, X, HelpCircle, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="btn-pwa-install-desktop"
        onClick={install}
        className="flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all transform hover:scale-102 active:scale-98"
      >
        <Download className="w-4 h-4" />
        <span>Baixar Aplicativo</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          id="btn-pwa-install-ios"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-100/50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-500 transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar no iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Adicionar à Tela de Início</h3>
                  <p className="text-xs text-gray-500">Siga as instruções para iPhone / iPad</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex gap-3 items-start">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white shrink-0 mt-0.5">
                    1
                  </div>
                  <p>
                    Toque no botão de <strong>Compartilhar</strong> (ícone de um quadrado com uma seta para cima) na barra inferior do Safari.
                  </p>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white shrink-0 mt-0.5">
                    2
                  </div>
                  <p>
                    Role a lista de opções para baixo e toque em <strong>Adicionar à Tela de Início</strong>.
                  </p>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white shrink-0 mt-0.5">
                    3
                  </div>
                  <p>
                    Confirme tocando em <strong>Adicionar</strong> no canto superior direito.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-red-600 hover:bg-red-700 py-3 text-sm font-semibold text-white transition shadow-md"
              >
                Entendi, fechar
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
