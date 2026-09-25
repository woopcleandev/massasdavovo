import React, { useState } from 'react';
import { Order } from '../types';
import { useCompany } from '../context/CompanyContext';
import { formatExactDateTime } from '../utils/date';
import { Printer, Copy, Check, X, Phone, MapPin, Calendar, Clock, ShoppingBag, Star, ExternalLink, Trash2 } from 'lucide-react';

interface OrderReceiptModalProps {
  order: Order;
  onClose: () => void;
  onDeleteOrder?: (order: Order) => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({ order, onClose, onDeleteOrder }) => {
  const { settings } = useCompany();
  const [copied, setCopied] = useState(false);

  const formatPrice = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (iso: string) => {
    return formatExactDateTime(iso);
  };

  const getPaymentLabel = () => {
    switch (order.paymentMethod) {
      case 'pix_now':
      case 'pix':
        return `PIX Agora (Chave: ${settings.pixKey})`;
      case 'pix_delivery':
        return 'PIX na Entrega (QR Code Maquininha/Celular)';
      case 'credit':
        return 'Cartão de Crédito (Levar maquininha)';
      case 'debit':
        return 'Cartão de Débito (Levar maquininha)';
      case 'cash':
        return `Dinheiro (Troco para ${order.changeFor || 'Não precisa'})`;
      default:
        return order.paymentMethod;
    }
  };

  const getPlainTextReceipt = () => {
    let txt = `========================================\n`;
    txt += `          MASSAS DA VOVÓ ARTESANAL       \n`;
    txt += `          Primavera do Leste - MT        \n`;
    txt += `========================================\n`;
    txt += `COMANDA PEDIDO: ${order.orderNumber}\n`;
    txt += `DATA CRIAÇÃO: ${formatDate(order.createdAt)}\n`;
    if (order.schedule?.isScheduled) {
      txt += `AGENDAMENTO: ${order.schedule.displayLabel}\n`;
    }
    txt += `----------------------------------------\n`;
    txt += `CLIENTE: ${order.customerName}\n`;
    txt += `TELEFONE: ${order.customerPhone}\n`;
    txt += `TIPO: ${order.deliveryType === 'delivery' ? 'ENTREGA EM DOMICÍLIO' : 'RETIRADA NO BALCÃO'}\n`;
    if (order.deliveryType === 'delivery') {
      txt += `ENDEREÇO: ${order.street || ''}, Nº ${order.number || ''}\n`;
      txt += `BAIRRO: ${order.neighborhood || ''}\n`;
      if (order.reference) txt += `REF: ${order.reference}\n`;
    }
    txt += `----------------------------------------\n`;
    txt += `ITENS DO PEDIDO:\n`;
    order.items.forEach((it, idx) => {
      txt += `${idx + 1}. ${it.quantity}x ${it.productName} - ${formatPrice(it.totalPrice)}\n`;
      if (it.size) txt += `   Tamanho: ${it.size}\n`;
      if (it.pasta) txt += `   Massa: ${it.pasta}\n`;
      if (it.sauce) txt += `   Molho: ${it.sauce}\n`;
      if (it.toppings && it.toppings.length > 0) txt += `   Adicionais: ${it.toppings.join(', ')}\n`;
      if (it.notes) txt += `   OBS: ${it.notes}\n`;
    });
    txt += `----------------------------------------\n`;
    txt += `Subtotal: ${formatPrice(order.itemsSubtotal)}\n`;
    if (order.deliveryType === 'delivery') {
      txt += `Taxa Entrega: ${formatPrice(order.deliveryFee)}\n`;
    }
    txt += `TOTAL GERAL: ${formatPrice(order.grandTotal)}\n`;
    txt += `----------------------------------------\n`;
    txt += `PAGAMENTO: ${getPaymentLabel()}\n`;
    txt += `========================================\n`;
    return txt;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(getPlainTextReceipt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="dark-glass-panel rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in my-8 border border-white/10 flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="p-4 bg-gray-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧾</span>
            <div>
              <h3 className="text-sm font-extrabold tracking-wide">Comanda de Produção</h3>
              <p className="text-[10px] text-gray-300">Pedido {order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Kitchen Ticket Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#FCFBF7] text-left" id="printable-order-receipt">
          <div className="bg-white p-5 rounded-2xl border border-dashed border-gray-300 shadow-xs font-mono text-xs text-gray-800 space-y-3">
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-gray-300 space-y-1">
              <h2 className="font-extrabold text-base tracking-wider uppercase text-gray-950 font-sans">
                🍝 MASSAS DA VOVÓ
              </h2>
              <p className="text-[10px] text-gray-500">Culinária Artesanal em Primavera do Leste</p>
              <p className="text-[10px] text-gray-500">WhatsApp: {settings.phone}</p>
            </div>

            {/* Order Badge & Info */}
            <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-200/60 font-sans">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Comanda</span>
                <span className="text-sm font-black text-gray-900">{order.orderNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Emissão</span>
                <span className="text-[11px] font-bold text-gray-700">{formatDate(order.createdAt)}</span>
              </div>
            </div>

            {/* Scheduled Order Highlight on Ticket */}
            {order.schedule?.isScheduled && (
              <div className="bg-amber-100 border border-amber-300 p-2.5 rounded-xl font-sans text-amber-950 space-y-0.5">
                <div className="flex items-center gap-1.5 font-black text-xs text-amber-900 uppercase">
                  <Calendar className="w-3.5 h-3.5 text-amber-800" />
                  <span>PEDIDO AGENDADO</span>
                </div>
                <p className="text-xs font-bold text-amber-950">
                  {order.schedule.displayLabel}
                </p>
              </div>
            )}

            {/* Customer Details */}
            <div className="pt-2 border-t border-dashed border-gray-300 space-y-1">
              <p><strong>CLIENTE:</strong> {order.customerName}</p>
              <p><strong>CONTATO:</strong> {order.customerPhone}</p>
              <p className="flex items-center gap-1 font-bold text-gray-900">
                <span>MÉTODO:</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                  order.deliveryType === 'delivery' 
                    ? 'bg-blue-100 text-blue-900' 
                    : order.deliveryType === 'dine_in'
                    ? 'bg-purple-100 text-purple-900'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {order.deliveryType === 'delivery' 
                    ? '🚀 ENTREGA' 
                    : order.deliveryType === 'dine_in' 
                    ? `🍽️ CONSUMO NO LOCAL (MESA ${order.tableNumber || 'SALÃO'})` 
                    : '🏪 BALCÃO / RETIRADA'}
                </span>
              </p>

              {order.deliveryType === 'delivery' && (
                <div className="mt-1 bg-amber-50/70 p-2 rounded-lg border border-amber-200/50 space-y-0.5">
                  <p><strong>RUA:</strong> {order.street}, Nº {order.number}</p>
                  <p><strong>BAIRRO:</strong> {order.neighborhood}</p>
                  {order.reference && <p><strong>REF:</strong> {order.reference}</p>}
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="pt-2 border-t border-dashed border-gray-300 space-y-2">
              <p className="font-extrabold uppercase text-[11px] text-gray-900 font-sans">
                ITENS ({order.items.reduce((acc, i) => acc + i.quantity, 0)}):
              </p>
              <div className="space-y-2 divide-y divide-gray-100">
                {order.items.map((item, idx) => (
                  <div key={idx} className="pt-1.5 space-y-0.5">
                    <div className="flex justify-between items-start font-bold">
                      <span className="text-gray-950">{item.quantity}x {item.productName}</span>
                      <span>{formatPrice(item.totalPrice)}</span>
                    </div>

                    {/* Options */}
                    {(item.size || item.pasta || item.sauce || (item.toppings && item.toppings.length > 0)) && (
                      <div className="text-[10px] text-gray-600 pl-3 border-l-2 border-gray-300 space-y-0.5">
                        {item.size && <div>• Tamanho: {item.size}</div>}
                        {item.pasta && <div>• Massa: {item.pasta}</div>}
                        {item.sauce && <div>• Molho: {item.sauce}</div>}
                        {item.toppings && item.toppings.length > 0 && (
                          <div>• Adicionais: {item.toppings.join(', ')}</div>
                        )}
                      </div>
                    )}

                    {item.notes && (
                      <div className="text-[10px] bg-red-50 text-red-700 p-1.5 rounded font-bold">
                        OBS: "{item.notes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Totals */}
            <div className="pt-3 border-t-2 border-dashed border-gray-300 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal itens:</span>
                <span>{formatPrice(order.itemsSubtotal)}</span>
              </div>
              {order.deliveryType === 'delivery' && (
                <div className="flex justify-between">
                  <span>Taxa entrega:</span>
                  <span>{formatPrice(order.deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm text-gray-950 pt-1 border-t border-gray-200">
                <span>TOTAL:</span>
                <span>{formatPrice(order.grandTotal)}</span>
              </div>
            </div>

            {/* Payment info */}
            <div className="pt-2 border-t border-dashed border-gray-300 bg-gray-50 p-2.5 rounded-xl font-sans">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Forma de Pagamento:</span>
              <span className="font-extrabold text-gray-900 text-[11px] block mt-0.5">
                {getPaymentLabel()}
              </span>
            </div>

            {/* Google Maps 5-Star Review Callout */}
            <div className="pt-2 text-center font-sans">
              <a
                href="https://maps.app.goo.gl/hecpUqJLLVd8EghW9"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold transition w-full"
              >
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-amber-500 shrink-0" />
                <span>Avaliar com 5 Estrelas no Google</span>
                <ExternalLink className="w-3 h-3 text-amber-700 ml-0.5" />
              </a>
            </div>

            <div className="text-center pt-1 text-[9px] text-gray-400">
              *** Obrigado pela preferência! Bom apetite! ***
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
          {onDeleteOrder && (
            <button
              type="button"
              onClick={() => onDeleteOrder(order)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition cursor-pointer"
              title="Excluir este pedido"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Excluir</span>
            </button>
          )}

          <button
            onClick={handleCopyText}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
