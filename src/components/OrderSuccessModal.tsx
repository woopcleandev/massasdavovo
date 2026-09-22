import React, { useState } from 'react';
import { Order } from '../types';
import { useCompany } from '../context/CompanyContext';
import { CheckCircle2, Copy, Check, Send, Receipt, ArrowRight, Clock, Star, ExternalLink, Calendar } from 'lucide-react';
import { OrderReceiptModal } from './OrderReceiptModal';

interface OrderSuccessModalProps {
  order: Order;
  whatsappUrl: string;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  whatsappUrl,
  onClose,
}) => {
  const { settings } = useCompany();
  const [copiedPix, setCopiedPix] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const formatPrice = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(settings.pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const isPixNow = order.paymentMethod === 'pix_now' || order.paymentMethod === 'pix';
  const isPixDelivery = order.paymentMethod === 'pix_delivery';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="dark-glass-panel rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in my-8 border border-white/10 flex flex-col text-left text-white">
        {/* Top Success Banner */}
        <div className="bg-black/60 backdrop-blur-md text-white p-6 text-center relative border-b border-white/10">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 ring-8 ring-emerald-500/10">
            <CheckCircle2 className="w-9 h-9 text-emerald-400" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">Pedido Enviado com Sucesso!</h2>
          <p className="text-xs text-gray-300 mt-1">
            Comanda <strong className="text-amber-400 font-mono text-sm">{order.orderNumber}</strong> gerada com carinho.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Scheduled Order Highlight Card */}
          {order.schedule?.isScheduled && (
            <div className="bg-amber-500/15 border border-amber-400/40 rounded-2xl p-4 text-xs space-y-1 text-amber-200">
              <div className="flex items-center gap-2 font-black text-amber-300">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Pedido Agendado: {order.schedule.displayLabel}</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed font-normal">
                Sua encomenda foi agendada! Nossa equipe fará a produção artesanal fresquinha na data e horário marcados.
              </p>
            </div>
          )}

          {/* WhatsApp Direct Action Button */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 text-emerald-200 text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <span className="text-base">📱</span>
              <span>Finalização via WhatsApp</span>
            </div>
            <p className="text-emerald-200/80 leading-relaxed text-[11px]">
              Se o WhatsApp não abriu automaticamente no seu aparelho, clique no botão verde abaixo para enviar os detalhes do seu pedido para nossa equipe:
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-98"
            >
              <Send className="w-4 h-4 fill-white" />
              <span>Abrir WhatsApp da Vovó</span>
            </a>
          </div>

          {/* PIX Agora Payment Box */}
          {isPixNow && (
            <div className="dark-glass-card border border-amber-400/40 rounded-2xl p-4.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🌀</span>
                  <span>Pagamento via PIX</span>
                </span>
                <span className="text-sm font-black text-amber-400 bg-black/40 px-2.5 py-1 rounded-lg border border-amber-400/30">
                  {formatPrice(order.grandTotal)}
                </span>
              </div>

              <div className="bg-black/40 rounded-xl p-3 border border-white/10 space-y-1 text-xs">
                <div className="flex justify-between items-center text-[11px] text-gray-400">
                  <span>Chave PIX ({settings.pixKeyType}):</span>
                  <span className="font-semibold text-gray-200">{settings.pixBeneficiary}</span>
                </div>
                <div className="font-mono font-bold text-sm text-amber-300 break-all select-all py-1">
                  {settings.pixKey}
                </div>
              </div>

              {/* Copy PIX Key Button */}
              <button
                onClick={handleCopyPix}
                className={`w-full flex items-center justify-center gap-2 font-bold text-xs py-3 px-4 rounded-xl border transition-all shadow-xs cursor-pointer ${
                  copiedPix
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'dark-glass-button-gold'
                }`}
              >
                {copiedPix ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPix ? 'Chave PIX Copiada com Sucesso!' : 'Copiar Chave PIX'}</span>
              </button>

              <div className="flex items-start gap-2 text-[11px] text-amber-300/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-400/20">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong>Aguardando Comprovante:</strong> Envie o comprovante do Pix nesta mesma conversa do WhatsApp para iniciarmos o preparo imediato!
                </p>
              </div>
            </div>
          )}

          {/* PIX na Entrega Box */}
          {isPixDelivery && (
            <div className="bg-blue-950/30 border border-blue-500/30 rounded-2xl p-4 text-xs text-blue-200 space-y-2">
              <span className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-300">
                <span>📱</span>
                <span>PIX QR Code na Entrega</span>
              </span>
              <p className="text-[11px] text-blue-200/80 leading-relaxed">
                O entregador levará a maquininha ou o celular com o <strong>QR Code PIX</strong> para você escanear e pagar no momento em que receber sua encomenda.
              </p>
            </div>
          )}

          {/* Google 5-Star Review Request */}
          <div className="dark-glass-card border border-amber-400/30 rounded-2xl p-4 text-center space-y-2.5 shadow-xs">
            <div className="flex items-center justify-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wide">
                Gostou do nosso atendimento?
              </h4>
              <p className="text-[11px] text-gray-300 mt-0.5 leading-snug">
                Avalie a <strong>Massas da Vovó</strong> com 5 estrelas no Google! Seu carinho nos ajuda a continuar preparando as melhores massas de Primavera do Leste - MT.
              </p>
            </div>
            <a
              href="https://maps.app.goo.gl/hecpUqJLLVd8EghW9"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full dark-glass-button-gold font-black text-xs py-2.5 px-4 rounded-xl shadow-xs transition active:scale-98"
            >
              <Star className="w-4 h-4 fill-black text-black" />
              <span>Avaliar com 5 Estrelas no Google</span>
              <ExternalLink className="w-3.5 h-3.5 text-black ml-1" />
            </a>
          </div>

          {/* Order Summary & Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setShowReceipt(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl border border-white/15 hover:bg-white/10 text-gray-200 font-bold text-xs transition cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-gray-400" />
              <span>Ver Comanda</span>
            </button>

            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs transition shadow-sm cursor-pointer"
            >
              <span>Voltar ao Cardápio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showReceipt && (
        <OrderReceiptModal
          order={order}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
};
