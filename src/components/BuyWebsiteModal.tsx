import React, { useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  MessageCircle, 
  X, 
  ShieldCheck, 
  Flame, 
  Send,
  Zap,
  Tag,
  ArrowDown
} from 'lucide-react';

interface BuyWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BuyWebsiteModal: React.FC<BuyWebsiteModalProps> = ({ isOpen, onClose }) => {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const paymentLink = 'https://payment-link-v3.ton.com.br/pl_4K5ZRWB2vk7o35PUQQi9lXzJDyEq3N9V';
  const whatsappNegotiationLink = 'https://wa.me/5566999775501?text=' + encodeURIComponent('Olá! Tenho interesse em adquirir ou negociar a compra do site completo Massas da Vovó (com Painel Master e Cardápio Digital).');
  const whatsappProofLink = 'https://wa.me/5566999775501?text=' + encodeURIComponent('Olá! Realizei o pagamento do site Massas da Vovó no valor de R$ 719,91 e estou enviando o comprovante para transferência e registro de propriedade digital.');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in">
      {/* Backdrop click to dismiss easily */}
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose} 
        aria-label="Fechar proposta"
      />

      <div className="dark-glass-panel rounded-3xl w-full max-w-lg shadow-2xl border border-amber-500/40 overflow-hidden animate-scale-in my-auto text-left relative z-10 max-h-[94vh] flex flex-col">
        
        {/* Top Gradient Header with Large Mobile-Friendly Close Button */}
        <div className="relative bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-4 sm:p-5 text-stone-950 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-md">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Oportunidade Exclusiva</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-stone-950 leading-tight">
                Gostou deste Site? Ele pode ser SEU!
              </h2>
              <p className="text-[11px] sm:text-xs font-bold text-stone-900/90 leading-snug">
                Projeto pronto com Cardápio Digital e Painel Master da Cozinha.
              </p>
            </div>

            {/* Prominent, touch-friendly close button (44px x 44px for easy thumb tapping) */}
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-black/20 hover:bg-black/35 active:scale-90 text-stone-950 hover:text-black transition cursor-pointer shrink-0 border border-black/10 shadow-sm"
              title="Fechar e ver cardápio"
              aria-label="Fechar modal de compra"
            >
              <X className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto text-stone-900 dark:text-stone-100 flex-1">
          
          {/* Price Tag Box */}
          <div className="bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-500 line-through">De R$ 799,90</span>
                <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>10% OFF</span>
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-400">Por apenas</span>
                <span className="text-2xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">R$ 719,91</span>
              </div>
              <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 block mt-0.5">
                ⚡ Pagamento único • Sem mensalidades • Seu para sempre!
              </span>
            </div>

            <div className="bg-white/80 dark:bg-black/40 border border-stone-200 dark:border-white/10 px-3 py-1.5 rounded-xl text-center self-start sm:self-auto shrink-0">
              <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 block">Propriedade Total</span>
              <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200">100% Personalizável</span>
            </div>
          </div>

          {/* Included Features List */}
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">
              O que você recebe ao adquirir:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200/80 dark:border-white/5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Cardápio Digital & Carrinho PIX</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200/80 dark:border-white/5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Painel Master Admin da Cozinha</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200/80 dark:border-white/5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Envio automático para WhatsApp</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200/80 dark:border-white/5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Comandas & Impressão de pedidos</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200/80 dark:border-white/5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Horários de Atendimento & Agendamentos</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200/80 dark:border-white/5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Modo Claro e Modo Escuro Luxo</span>
              </div>
            </div>
          </div>

          {/* Transfer & Post-payment Instructions Banner */}
          <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-white/5 border border-amber-500/20 dark:border-white/10 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-black text-amber-800 dark:text-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Instrução de Transferência & Registro Digital:</span>
            </div>
            <p className="text-stone-700 dark:text-stone-300 text-[11px] leading-relaxed">
              Após o pagamento, envie o comprovante para o WhatsApp <strong className="text-amber-700 dark:text-amber-400 font-black">+55 (66) 99977-5501</strong> para efetuar a transferência imediata e o registro de propriedade digital.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            
            {/* Primary Action: Buy Online */}
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 sm:py-4 px-5 dark-glass-button-gold text-stone-950 font-black rounded-full text-sm shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-stone-950 shrink-0" />
              <span>Garantir e Pagar Agora (R$ 719,91)</span>
              <ExternalLink className="w-4 h-4 ml-0.5" />
            </a>

            {/* Secondary Action: Negotiate on WhatsApp */}
            <a
              href={whatsappNegotiationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Chamar no WhatsApp para Negociar</span>
            </a>

            {/* Post-payment proof sender direct link */}
            <a
              href={whatsappProofLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 rounded-full bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-700 dark:text-stone-300 font-bold text-[11px] border border-stone-300 dark:border-white/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Já paguei: Enviar comprovante p/ WhatsApp</span>
            </a>
          </div>

          {/* Big, Easy-to-Tap Close Button for Mobile */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-full bg-stone-200 hover:bg-stone-300 dark:bg-white/10 dark:hover:bg-white/15 text-stone-800 dark:text-stone-200 font-black text-xs transition active:scale-98 flex items-center justify-center gap-1.5 border border-stone-300 dark:border-white/15 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>✕ Fechar Proposta e Continuar no Cardápio</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
