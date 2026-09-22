import React, { useState } from 'react';
import { Order } from '../types';
import { useCompany } from '../context/CompanyContext';
import { CheckCircle2, Copy, Check, Send, Receipt, ArrowRight, Clock, Star, ExternalLink } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in my-8 border border-gray-100 flex flex-col text-left">
        {/* Top Success Banner */}
        <div className="bg-gradient-to-br from-[#0b1c3f] via-[#0e2450] to-[#0b1c3f] text-white p-6 text-center relative">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 ring-8 ring-emerald-500/10">
            <CheckCircle2 className="w-9 h-9 text-emerald-400" />
          </div>
          <h2 className="text-xl font-black tracking-tight">Pedido Enviado com Sucesso!</h2>
          <p className="text-xs text-gray-300 mt-1">
            Comanda <strong className="text-yellow-400 font-mono text-sm">{order.orderNumber}</strong> gerada com carinho.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* WhatsApp Direct Action Button */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-emerald-950 text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <span className="text-base">📱</span>
              <span>Finalização via WhatsApp</span>
            </div>
            <p className="text-emerald-800 leading-relaxed text-[11px]">
              Se o WhatsApp não abriu automaticamente no seu aparelho, clique no botão verde abaixo para enviar os detalhes do seu pedido para nossa equipe:
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-98"
            >
              <Send className="w-4 h-4 fill-white" />
              <span>Abrir WhatsApp da Vovó</span>
            </a>
          </div>

          {/* PIX Agora Payment Box */}
          {isPixNow && (
            <div className="bg-amber-50/60 border-2 border-amber-300/80 rounded-2xl p-4.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🌀</span>
                  <span>Pagamento via PIX</span>
                </span>
                <span className="text-sm font-black text-[#0b1c3f] bg-white px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs">
                  {formatPrice(order.grandTotal)}
                </span>
              </div>

              <div className="bg-white rounded-xl p-3 border border-amber-200 space-y-1 text-xs">
                <div className="flex justify-between items-center text-[11px] text-gray-500">
                  <span>Chave PIX ({settings.pixKeyType}):</span>
                  <span className="font-semibold text-gray-700">{settings.pixBeneficiary}</span>
                </div>
                <div className="font-mono font-bold text-sm text-gray-900 break-all select-all py-1">
                  {settings.pixKey}
                </div>
              </div>

              {/* Copy PIX Key Button */}
              <button
                onClick={handleCopyPix}
                className={`w-full flex items-center justify-center gap-2 font-bold text-xs py-3 px-4 rounded-xl border transition-all shadow-xs ${
                  copiedPix
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-[#0b1c3f] text-[#d4af37] border-[#d4af37]/30 hover:bg-[#07132c]'
                }`}
              >
                {copiedPix ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPix ? 'Chave PIX Copiada com Sucesso!' : 'Copiar Chave PIX'}</span>
              </button>

              <div className="flex items-start gap-2 text-[11px] text-amber-800 bg-amber-100/50 p-2.5 rounded-xl border border-amber-200/50">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong>Aguardando Comprovante:</strong> Envie o comprovante do Pix nesta mesma conversa do WhatsApp para iniciarmos o preparo imediato!
                </p>
              </div>
            </div>
          )}

          {/* PIX na Entrega Box */}
          {isPixDelivery && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-2">
              <span className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-950">
                <span>📱</span>
                <span>PIX QR Code na Entrega</span>
              </span>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                O entregador levará a maquininha ou o celular com o <strong>QR Code PIX</strong> para você escanear e pagar no momento em que receber sua encomenda.
              </p>
            </div>
          )}

          {/* Google 5-Star Review Request */}
          <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 border-2 border-yellow-400/60 rounded-2xl p-4 text-center space-y-2.5 shadow-xs">
            <div className="flex items-center justify-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-500 drop-shadow-xs" />
              ))}
            </div>
            <div>
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">
                Gostou do nosso atendimento?
              </h4>
              <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                Avalie a <strong>Massas da Vovó</strong> com 5 estrelas no Google! Seu carinho nos ajuda a continuar preparando as melhores massas caseiras de Primavera do Leste - MT.
              </p>
            </div>
            <a
              href="https://maps.app.goo.gl/hecpUqJLLVd8EghW9"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-gray-950 font-black text-xs py-2.5 px-4 rounded-xl shadow-xs hover:shadow-md transition active:scale-98"
            >
              <Star className="w-4 h-4 fill-gray-950 text-gray-950" />
              <span>Avaliar com 5 Estrelas no Google</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-900 ml-1" />
            </a>
          </div>

          {/* Order Summary & Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setShowReceipt(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs transition"
            >
              <Receipt className="w-4 h-4 text-gray-500" />
              <span>Ver Comanda</span>
            </button>

            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs transition shadow-sm"
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
