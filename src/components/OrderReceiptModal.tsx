import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Order } from '../types';
import { useCompany } from '../context/CompanyContext';
import { formatExactDateTime } from '../utils/date';
import { Printer, Copy, Check, X, Phone, MapPin, Calendar, Clock, ShoppingBag, Star, ExternalLink, Trash2, Utensils, AlertCircle } from 'lucide-react';

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

  const totalItemsCount = order.items.reduce((acc, i) => acc + i.quantity, 0);

  const getPlainTextReceipt = () => {
    let txt = `========================================\n`;
    txt += `       MASSAS DA VOVÓ - ARTESANAL       \n`;
    txt += `          COMANDA DE PRODUÇÃO           \n`;
    txt += `========================================\n`;
    txt += `COMANDA Nº: ${order.orderNumber}\n`;
    txt += `EMISSÃO: ${formatDate(order.createdAt)}\n`;
    
    if (order.schedule?.isScheduled) {
      txt += `\n*** PEDIDO AGENDADO: ${order.schedule.displayLabel} ***\n`;
    }

    txt += `----------------------------------------\n`;
    if (order.deliveryType === 'dine_in') {
      txt += `🍽️ ATENDIMENTO: CONSUMO NO LOCAL\n`;
      txt += `📌 IDENTIFICADOR: ${order.tableNumber ? `MESA / COMANDA ${order.tableNumber}` : (order.posIdentifierValue || 'SALÃO')}\n`;
    } else if (order.deliveryType === 'delivery') {
      txt += `🚀 ATENDIMENTO: ENTREGA EM DOMICÍLIO\n`;
      txt += `📍 ENDEREÇO: ${order.street || ''}, Nº ${order.number || ''}\n`;
      txt += `📍 BAIRRO: ${order.neighborhood || ''}\n`;
      if (order.reference) txt += `📍 REF: ${order.reference}\n`;
    } else {
      txt += `🏪 ATENDIMENTO: RETIRADA NO BALCÃO\n`;
    }

    txt += `CLIENTE: ${order.customerName}\n`;
    if (order.customerPhone) txt += `FONE: ${order.customerPhone}\n`;
    txt += `========================================\n`;
    txt += `         ITENS PARA PREPARO             \n`;
    txt += `========================================\n\n`;

    order.items.forEach((it, idx) => {
      txt += `[ ${it.quantity}x ] ${it.productName.toUpperCase()}\n`;
      if (it.size) txt += `   * Tamanho: ${it.size}\n`;
      if (it.pasta) txt += `   * Massa: ${it.pasta}\n`;
      if (it.sauce) txt += `   * Molho: ${it.sauce}\n`;
      if (it.toppings && it.toppings.length > 0) txt += `   * Adicionais: ${it.toppings.join(', ')}\n`;
      if (it.notes) {
        txt += `   >> OBS COZINHA: "${it.notes}" <<\n`;
      }
      txt += `\n`;
    });

    txt += `----------------------------------------\n`;
    txt += `TOTAL DE VOLUMES: ${totalItemsCount} item(ns)\n`;
    txt += `PAGAMENTO: ${getPaymentLabel()}\n`;
    txt += `VALOR TOTAL: ${formatPrice(order.grandTotal)}\n`;
    txt += `Cardápio Online: https://massasdavovo.vercel.app/\n`;
    txt += `========================================\n`;
    txt += `        *** BOM TRABALHO! ***           \n`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="fixed inset-0 -z-10 print:hidden" onClick={onClose} />

      <div className="dark-glass-panel rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in my-auto border border-white/10 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none print:m-0 print:p-0 print:rounded-none">
        
        {/* Modal Top Bar (Hidden on Print) */}
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between shrink-0 border-b border-white/10 print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🖨️</span>
            <div>
              <h3 className="text-sm font-black tracking-wide">Comanda Térmica de Produção</h3>
              <p className="text-[11px] text-amber-400 font-mono">Pedido {order.orderNumber} • Foco na Cozinha</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Kitchen Ticket Area (Thermal Paper Design) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-100 dark:bg-stone-950 text-left print:p-0 print:bg-white print:overflow-visible" id="printable-order-receipt">
          
          <div className="bg-white text-black p-5 sm:p-6 rounded-2xl border-2 border-dashed border-stone-300 shadow-md font-mono text-xs space-y-3.5 print:border-none print:shadow-none print:p-2 print:rounded-none print:w-[76mm] print:mx-auto">
            
            {/* Ticket Header */}
            <div className="text-center pb-3 border-b-2 border-dashed border-black space-y-1">
              <h2 className="font-black text-base sm:text-lg tracking-wider uppercase font-sans text-black">
                🍝 MASSAS DA VOVÓ
              </h2>
              <p className="text-[11px] font-bold text-stone-800 tracking-wide">*** COMANDA DE PRODUÇÃO ***</p>
              <div className="flex items-center justify-between text-[11px] font-bold pt-1 text-stone-700">
                <span>Nº: {order.orderNumber}</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
            </div>

            {/* Scheduled Tag */}
            {order.schedule?.isScheduled && (
              <div className="bg-amber-100 border-2 border-black p-2.5 rounded-xl font-sans text-black text-center space-y-0.5">
                <span className="font-black text-xs block uppercase">📅 PEDIDO AGENDADO COM ANTECEDÊNCIA</span>
                <p className="text-sm font-black text-amber-900">{order.schedule.displayLabel}</p>
              </div>
            )}

            {/* Service & Destination Prominent Box (Mesa / Entrega / Balcão) */}
            <div className="border-2 border-black p-3 rounded-xl bg-stone-50 space-y-1 text-black font-sans">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-stone-600">Destino do Pedido:</span>
                <span className="text-xs font-black uppercase px-2 py-0.5 bg-black text-white rounded">
                  {order.deliveryType === 'dine_in' ? '🍽️ MESA / LOCAL' : order.deliveryType === 'delivery' ? '🚀 ENTREGA' : '🏪 RETIRADA BALCÃO'}
                </span>
              </div>

              {order.deliveryType === 'dine_in' && (
                <div className="pt-1">
                  <span className="text-base font-black text-black block">
                    📌 {order.tableNumber ? `MESA / COMANDA: ${order.tableNumber}` : (order.posIdentifierValue ? `MESA: ${order.posIdentifierValue}` : 'SALÃO')}
                  </span>
                </div>
              )}

              {order.deliveryType === 'delivery' && (
                <div className="pt-1 text-xs space-y-0.5 font-bold">
                  <p>📍 {order.street || ''}, Nº {order.number || ''}</p>
                  <p>📍 Bairro: {order.neighborhood || ''}</p>
                  {order.reference && <p className="text-amber-950 font-extrabold">📍 Ref: {order.reference}</p>}
                </div>
              )}

              <div className="pt-1 border-t border-dashed border-stone-300 flex items-center justify-between text-[11px]">
                <span><strong>Cliente:</strong> {order.customerName}</span>
                {order.customerPhone && <span><strong>Tel:</strong> {order.customerPhone}</span>}
              </div>
            </div>

            {/* KITCHEN ITEMS SECTION (Primary Focus) */}
            <div className="pt-2 space-y-3">
              <div className="bg-black text-white text-center py-1 font-black text-xs uppercase tracking-wider rounded">
                ITENS PARA PREPARO ({totalItemsCount})
              </div>

              <div className="space-y-3.5 divide-y-2 divide-dashed divide-stone-300">
                {order.items.map((item, idx) => (
                  <div key={idx} className="pt-3 first:pt-0 space-y-1.5">
                    
                    {/* Big Item Title & Quantity */}
                    <div className="flex items-start gap-2">
                      <span className="bg-black text-white font-black text-sm sm:text-base px-2 py-0.5 rounded shrink-0">
                        {item.quantity}x
                      </span>
                      <span className="font-black text-sm sm:text-base text-black font-sans leading-tight">
                        {item.productName}
                      </span>
                    </div>

                    {/* Customization Details */}
                    {(item.size || item.pasta || item.sauce || (item.toppings && item.toppings.length > 0)) && (
                      <div className="text-[11px] font-bold text-stone-900 pl-3 border-l-3 border-black space-y-0.5">
                        {item.size && <div>• <strong>Tamanho:</strong> {item.size}</div>}
                        {item.pasta && <div>• <strong>Massa:</strong> {item.pasta}</div>}
                        {item.sauce && <div>• <strong>Molho:</strong> {item.sauce}</div>}
                        {item.toppings && item.toppings.length > 0 && (
                          <div>• <strong>Adicionais:</strong> {item.toppings.join(', ')}</div>
                        )}
                      </div>
                    )}

                    {/* High-Visibility Kitchen Observation Note */}
                    {item.notes && (
                      <div className="border-2 border-black bg-stone-100 text-black p-2 rounded-lg text-xs font-black flex items-start gap-1.5 mt-1">
                        <AlertCircle className="w-4 h-4 text-black shrink-0 mt-0.5" />
                        <span>OBS: "{item.notes}"</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* General Order Observation if any */}
            {order.notes && (
              <div className="border-2 border-black bg-amber-50 p-2.5 rounded-xl font-bold text-xs">
                <strong>OBS GERAL:</strong> "{order.notes}"
              </div>
            )}

            {/* Compact Bottom Summary (Subtle Cashier / Payment Reference) */}
            <div className="pt-3 border-t-2 border-dashed border-black space-y-1 text-[11px]">
              <div className="flex justify-between font-bold">
                <span>Total de Volumes:</span>
                <span>{totalItemsCount} prato(s)</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Pagamento:</span>
                <span className="font-black">{getPaymentLabel()}</span>
              </div>
              <div className="flex justify-between font-black text-xs pt-1 border-t border-stone-300">
                <span>VALOR TOTAL:</span>
                <span>{formatPrice(order.grandTotal)}</span>
              </div>
            </div>

            {/* Footer Ticket Cut */}
            <div className="text-center pt-2 border-t-2 border-dashed border-black text-[10px] text-stone-600 font-sans space-y-0.5">
              <p className="font-bold">🌐 https://massasdavovo.vercel.app/</p>
              <p className="font-black text-black">*** BOM TRABALHO / COZINHA ***</p>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer (Hidden on Print) */}
        <div className="p-3.5 bg-stone-900 border-t border-white/10 flex items-center gap-2 shrink-0 print:hidden">
          {onDeleteOrder && (
            <button
              type="button"
              onClick={() => onDeleteOrder(order)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs transition cursor-pointer"
              title="Excluir este pedido"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Excluir</span>
            </button>
          )}

          <button
            onClick={handleCopyText}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-white/15 text-stone-200 font-bold text-xs hover:bg-white/10 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Térmica (80mm/58mm)</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* EXCLUSIVE THERMAL RECEIPT PRINT CONTAINER (DIRECT CHILD OF BODY) */}
      {/* ============================================================ */}
      {typeof document !== 'undefined' && createPortal(
        <div id="comanda-impressao" aria-hidden="true">
          {/* Header */}
          <div style={{ textAlign: 'center', paddingBottom: '6px', borderBottom: '2px dashed #000', marginBottom: '8px' }}>
            <div style={{ fontSize: '16px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '2px', fontFamily: 'sans-serif' }}>
              🍝 MASSAS DA VOVÓ
            </div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' }}>
              *** COMANDA DE PRODUÇÃO ***
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginTop: '6px' }}>
              <span>Nº: {order.orderNumber}</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
          </div>

          {/* Scheduled Tag */}
          {order.schedule?.isScheduled && (
            <div style={{ border: '2px solid #000', padding: '6px', textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                📅 PEDIDO AGENDADO COM ANTECEDÊNCIA
              </div>
              <div style={{ fontSize: '12px', fontWeight: '900', marginTop: '2px' }}>
                {order.schedule.displayLabel}
              </div>
            </div>
          )}

          {/* Destination & Customer Box */}
          <div style={{ border: '2px solid #000', padding: '6px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              <span>DESTINO DO PEDIDO:</span>
              <span style={{ background: '#000', color: '#fff', padding: '1px 5px', fontSize: '10px' }}>
                {order.deliveryType === 'dine_in' ? 'MESA / LOCAL' : order.deliveryType === 'delivery' ? 'ENTREGA' : 'BALCÃO'}
              </span>
            </div>

            {order.deliveryType === 'dine_in' && (
              <div style={{ fontSize: '14px', fontWeight: '900', marginTop: '4px' }}>
                📌 MESA / COMANDA: {order.tableNumber || order.posIdentifierValue || '01'}
              </div>
            )}

            {order.deliveryType === 'delivery' && (
              <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '4px' }}>
                <div>📍 Rua: {order.street || ''}, Nº {order.number || ''}</div>
                <div>📍 Bairro: {order.neighborhood || ''}</div>
                {order.reference && <div>📍 Ref: {order.reference}</div>}
              </div>
            )}

            <div style={{ borderTop: '1px dashed #666', marginTop: '6px', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span><strong>Cliente:</strong> {order.customerName}</span>
              {order.customerPhone && <span><strong>Tel:</strong> {order.customerPhone}</span>}
            </div>
          </div>

          {/* Items Section */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ background: '#000', color: '#fff', textAlign: 'center', padding: '3px 0', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
              ITENS PARA PREPARO ({totalItemsCount})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {order.items.map((item, idx) => (
                <div key={idx} style={{ borderBottom: idx < order.items.length - 1 ? '1px dashed #999' : 'none', paddingBottom: idx < order.items.length - 1 ? '6px' : '0' }}>
                  {/* Quantity & Product Name with automatic line-wrap */}
                  <div style={{ fontSize: '13px', fontWeight: '900', lineHeight: '1.25', wordBreak: 'break-word' }}>
                    <span style={{ background: '#000', color: '#fff', padding: '1px 5px', marginRight: '6px', fontSize: '12px' }}>
                      {item.quantity}x
                    </span>
                    <span>{item.productName}</span>
                  </div>

                  {/* Customizations */}
                  {(item.size || item.pasta || item.sauce || (item.toppings && item.toppings.length > 0)) && (
                    <div style={{ fontSize: '11px', fontWeight: 'bold', marginLeft: '6px', marginTop: '3px', borderLeft: '2px solid #000', paddingLeft: '6px' }}>
                      {item.size && <div>• Tamanho: {item.size}</div>}
                      {item.pasta && <div>• Massa: {item.pasta}</div>}
                      {item.sauce && <div>• Molho: {item.sauce}</div>}
                      {item.toppings && item.toppings.length > 0 && (
                        <div>• Adicionais: {item.toppings.join(', ')}</div>
                      )}
                    </div>
                  )}

                  {/* Kitchen Observation */}
                  {item.notes && (
                    <div style={{ border: '2px solid #000', padding: '4px 6px', fontSize: '11px', fontWeight: '900', marginTop: '4px', background: '#e5e5e5', wordBreak: 'break-word' }}>
                      &gt;&gt; OBS COZINHA: "{item.notes}" &lt;&lt;
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* General Order Observation */}
          {order.notes && (
            <div style={{ border: '2px solid #000', padding: '6px', fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', background: '#f0f0f0', wordBreak: 'break-word' }}>
              <strong>OBS GERAL DO PEDIDO:</strong> "{order.notes}"
            </div>
          )}

          {/* Summary / Total */}
          <div style={{ borderTop: '2px dashed #000', paddingTop: '6px', marginBottom: '8px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Total de Volumes:</span>
              <span>{totalItemsCount} prato(s)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '2px' }}>
              <span>Pagamento:</span>
              <span style={{ fontWeight: '900' }}>{getPaymentLabel()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '900', borderTop: '1px solid #aaa', marginTop: '4px', paddingTop: '4px' }}>
              <span>VALOR TOTAL:</span>
              <span>{formatPrice(order.grandTotal)}</span>
            </div>
          </div>

          {/* Ticket Footer */}
          <div style={{ borderTop: '2px dashed #000', paddingTop: '6px', textAlign: 'center', fontSize: '10px' }}>
            <div style={{ fontWeight: 'bold' }}>🌐 https://massasdavovo.vercel.app/</div>
            <div style={{ fontWeight: '900', marginTop: '2px' }}>*** BOM TRABALHO / COZINHA ***</div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
