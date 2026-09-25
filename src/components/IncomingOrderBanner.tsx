import React, { useState } from 'react';
import { Order } from '../types';
import { useCompany } from '../context/CompanyContext';
import { 
  BellRing, 
  Send, 
  ChefHat, 
  Receipt, 
  XCircle, 
  X, 
  Phone, 
  MapPin, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Calendar,
  Utensils
} from 'lucide-react';
import { formatExactDateTime } from '../utils/date';
import { formatWhatsappDisplay, buildCustomerOrderConfirmationUrl, buildCustomerOrderCancellationUrl } from '../utils/phone';

interface IncomingOrderBannerProps {
  order: Order;
  onClose: () => void;
  onOpenReceipt: (order: Order) => void;
}

export const IncomingOrderBanner: React.FC<IncomingOrderBannerProps> = ({
  order,
  onClose,
  onOpenReceipt,
}) => {
  const { updateOrderStatus } = useCompany();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Indisponibilidade temporária de ingredientes');

  const formatPrice = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleConfirmAndSendToKitchen = async () => {
    await updateOrderStatus(order.id, 'preparo');
    onOpenReceipt(order);
  };

  const handleConfirmOnWhatsApp = async () => {
    await updateOrderStatus(order.id, 'preparo');
    const waUrl = buildCustomerOrderConfirmationUrl(order);
    if (waUrl) {
      window.open(waUrl, '_blank');
    }
  };

  const handleCancelOrderWithWhatsApp = async () => {
    await updateOrderStatus(order.id, 'cancelado');
    const waUrl = buildCustomerOrderCancellationUrl(order, cancelReason);
    if (waUrl) {
      window.open(waUrl, '_blank');
    }
    setShowCancelModal(false);
    onClose();
  };

  return (
    <>
      {/* Floating Incoming Order Notification Card */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-lg w-[calc(100vw-2rem)] animate-slide-up">
        <div className="bg-stone-900/95 text-white border-2 border-amber-400 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden ring-4 ring-amber-500/20">
          
          {/* Header with Glowing Alert Badge */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-4 text-stone-950 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-black/20 text-stone-950 flex items-center justify-center animate-bounce shrink-0">
                <BellRing className="w-5 h-5 text-stone-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm uppercase tracking-wide">Novo Pedido Recebido!</span>
                  <span className="bg-stone-950 text-amber-300 font-mono font-bold text-xs px-2 py-0.5 rounded-md">
                    {order.orderNumber}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-stone-900/90 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatExactDateTime(order.createdAt)}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/15 hover:bg-black/30 text-stone-950 flex items-center justify-center transition cursor-pointer"
              title="Dispensar alerta"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-5 space-y-3.5 text-xs text-left">
            
            {/* Customer & Delivery Mode Info */}
            <div className="bg-stone-800/80 p-3 rounded-2xl border border-white/10 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="font-black text-sm text-white flex items-center gap-1.5">
                  <span>{order.customerName}</span>
                  {order.customerPhone && (
                    <span className="font-mono text-xs font-normal text-amber-300">
                      • {formatWhatsappDisplay(order.customerPhone)}
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-stone-300 flex items-center gap-1.5 font-medium">
                  {order.deliveryType === 'delivery' ? (
                    <>
                      <span className="text-amber-400">🚀 Entrega:</span>
                      <span>{order.street || ''}, {order.number || ''} - {order.neighborhood || ''}</span>
                    </>
                  ) : order.deliveryType === 'dine_in' ? (
                    <>
                      <Utensils className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-amber-300 font-bold">Consumo Local: Mesa/Comanda {order.tableNumber || 'Salão'}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-amber-400">🏪 Retirada no Balcão</span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-black text-amber-400 block">
                  {formatPrice(order.grandTotal)}
                </span>
                <span className="text-[10px] text-stone-400 uppercase font-mono">
                  {order.paymentMethod.startsWith('pix') ? 'PIX' : order.paymentMethod === 'cash' ? 'Dinheiro' : 'Cartão'}
                </span>
              </div>
            </div>

            {/* Scheduled Tag if applicable */}
            {order.schedule?.isScheduled && (
              <div className="bg-amber-500/20 border border-amber-400/40 p-2.5 rounded-xl text-amber-200 text-[11px] flex items-center gap-1.5 font-bold">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Agendado para: {order.schedule.displayLabel}</span>
              </div>
            )}

            {/* Items snippet */}
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 text-[11px] text-stone-300 max-h-24 overflow-y-auto custom-scrollbar">
              <span className="text-stone-400 font-bold block mb-1">Itens do Pedido ({order.items.length}):</span>
              <ul className="space-y-1">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-center text-stone-200">
                    <span>
                      <strong className="text-amber-300">{item.quantity}x</strong> {item.productName}
                      {item.size ? ` (${item.size})` : ''}
                    </span>
                    <span className="font-mono text-stone-400">{formatPrice(item.totalPrice)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Immediate Action Buttons */}
            <div className="space-y-2 pt-1">
              
              {/* Primary: Confirm on WhatsApp & Kitchen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleConfirmOnWhatsApp}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 px-3 rounded-2xl shadow-lg transition active:scale-98 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-emerald-600 shrink-0" />
                  <span>Confirmar no WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndSendToKitchen}
                  className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs py-3 px-3 rounded-2xl shadow-lg transition active:scale-98 cursor-pointer"
                >
                  <ChefHat className="w-4 h-4 shrink-0" />
                  <span>Emitir Comanda / Preparo</span>
                </button>
              </div>

              {/* Secondary actions: View Receipt / Cancel with WhatsApp notice */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenReceipt(order)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 font-bold text-xs transition cursor-pointer border border-white/10"
                >
                  <Receipt className="w-3.5 h-3.5 text-stone-400" />
                  <span>Ver Comanda</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs transition cursor-pointer border border-rose-500/30"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Cancelar / Falta</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order with WhatsApp Notice Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in text-left">
          <div className="bg-stone-900 border-2 border-rose-500/50 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Cancelar Pedido {order.orderNumber}?</h3>
                <p className="text-xs text-stone-400 mt-0.5">Avise o cliente no WhatsApp sobre a falta ou motivo</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-300 block">
                Motivo do cancelamento / falta de produto:
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Tivemos falta dos ingredientes frescos para o nhoque caprese hoje..."
                className="w-full bg-stone-950 border border-white/15 rounded-2xl p-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 px-3 rounded-full bg-white/10 hover:bg-white/15 text-stone-300 font-bold text-xs transition cursor-pointer"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={handleCancelOrderWithWhatsApp}
                className="flex-1 py-3 px-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Cancelar & Avisar no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
