import React, { useState, useMemo } from 'react';
import { useCompany } from '../context/CompanyContext';
import { Product, CategoryId, OrderItem, PaymentMethod, Order } from '../types';
import { CATEGORIES } from '../data';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  DollarSign, 
  CreditCard, 
  QrCode, 
  Receipt, 
  Utensils, 
  Check, 
  RotateCcw, 
  Sparkles, 
  User, 
  Phone, 
  ChefHat, 
  Bike, 
  Store, 
  Coffee, 
  AlertCircle,
  Clock,
  Printer,
  X,
  Volume2
} from 'lucide-react';

interface PosDirectSaleViewProps {
  onSaleCompleted: (order: Order) => void;
}

// Sound effect for POS sale completion (Cash Register bell chime via Web Audio)
const playPosSuccessSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Two pleasant high bell tones (C6 -> G6)
    [1046.50, 1567.98].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.35);
    });
  } catch (e) {
    console.warn('Audio not available:', e);
  }
};

export const PosDirectSaleView: React.FC<PosDirectSaleViewProps> = ({ onSaleCompleted }) => {
  const { allProducts, createDirectSale, settings } = useCompany();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // POS Order Form State
  const [saleType, setSaleType] = useState<'takeaway' | 'dine_in'>('takeaway');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Cart / Items on Ticket
  const [ticketItems, setTicketItems] = useState<{
    product: Product;
    quantity: number;
    sizeName?: string;
    unitPrice: number;
    notes?: string;
  }[]>([]);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix_now');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saleSuccessMessage, setSaleSuccessMessage] = useState('');

  // Filter products for display
  const filteredProducts = useMemo(() => {
    return allProducts.filter(prod => {
      const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (prod.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'all' || prod.categoryId === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [allProducts, searchQuery, selectedCategory]);

  // Financial calculations
  const subtotal = useMemo(() => {
    return ticketItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  }, [ticketItems]);

  const discount = Math.max(0, parseFloat(discountAmount) || 0);
  const grandTotal = Math.max(0, subtotal - discount);

  const numCashReceived = parseFloat(cashReceived) || 0;
  const changeAmount = numCashReceived > grandTotal ? numCashReceived - grandTotal : 0;

  const formatPrice = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Add product to ticket
  const handleAddItem = (product: Product, sizeOption?: { name: string; price: number }) => {
    const unitPrice = sizeOption ? sizeOption.price : product.price;
    const sizeName = sizeOption ? sizeOption.name : undefined;

    setTicketItems(prev => {
      const existingIndex = prev.findIndex(item => 
        item.product.id === product.id && item.sizeName === sizeName
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }

      return [
        ...prev,
        {
          product,
          quantity: 1,
          sizeName,
          unitPrice,
          notes: ''
        }
      ];
    });
  };

  // Adjust item quantity
  const handleUpdateQuantity = (index: number, delta: number) => {
    setTicketItems(prev => {
      const item = prev[index];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, idx) => idx !== index);
      }
      const updated = [...prev];
      updated[index] = { ...item, quantity: newQty };
      return updated;
    });
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setTicketItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Clear ticket
  const handleClearTicket = () => {
    setTicketItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setTableNumber('');
    setOrderNotes('');
    setCashReceived('');
    setDiscountAmount('0');
  };

  // Quick cash buttons
  const handleSetQuickCash = (amount: number) => {
    setCashReceived(amount.toString());
  };

  // Finalize Sale
  const handleCompleteSale = async (status: 'concluido' | 'preparo') => {
    if (ticketItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const orderItems: OrderItem[] = ticketItems.map((item, idx) => ({
        id: `item-${idx}-${Date.now()}`,
        productName: item.sizeName ? `${item.product.name} (${item.sizeName})` : item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
        size: item.sizeName,
        notes: item.notes,
      }));

      let changeNote = '';
      if (paymentMethod === 'cash') {
        if (numCashReceived > grandTotal) {
          changeNote = `Recebido: ${formatPrice(numCashReceived)} | Troco: ${formatPrice(changeAmount)}`;
        } else if (numCashReceived === grandTotal) {
          changeNote = `Valor exato: ${formatPrice(grandTotal)}`;
        }
      }

      const createdOrder = await createDirectSale({
        customerName: customerName.trim() || (saleType === 'dine_in' ? `Mesa ${tableNumber || 'Balcão'}` : 'Cliente Balcão'),
        customerPhone: customerPhone.trim(),
        deliveryType: saleType,
        tableNumber: saleType === 'dine_in' ? tableNumber : undefined,
        paymentMethod,
        changeFor: changeNote || undefined,
        items: orderItems,
        itemsSubtotal: subtotal,
        grandTotal,
        notes: orderNotes.trim() ? (changeNote ? `${orderNotes.trim()} (${changeNote})` : orderNotes.trim()) : (changeNote || undefined),
        status,
      });

      playPosSuccessSound();
      setSaleSuccessMessage(`Venda ${createdOrder.orderNumber} finalizada com sucesso!`);
      setTimeout(() => setSaleSuccessMessage(''), 4000);

      // Clean up form
      handleClearTicket();

      // Trigger receipt callback
      onSaleCompleted(createdOrder);
    } catch (err) {
      console.error('Erro ao finalizar venda:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 text-left animate-fade-in">
      {/* Top Notification */}
      {saleSuccessMessage && (
        <div className="bg-emerald-500 text-white p-4 rounded-3xl shadow-xl flex items-center justify-between text-xs font-black animate-bounce-short">
          <div className="flex items-center gap-2.5">
            <Check className="w-5 h-5" />
            <span>{saleSuccessMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSaleSuccessMessage('')}
            className="p-1 hover:bg-black/10 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main POS Container: Grid with Left Catalog and Right Fast Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: CATALOG & QUICK ADD (7 cols) */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Header & Search */}
          <div className="dark-glass-panel p-4 rounded-3xl border border-stone-200 dark:border-white/10 shadow-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-amber-500" />
                  <span>Terminal de Venda Direta / Balcão (PDV)</span>
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Lançamento rápido de pedidos presenciais, salão e balcão
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Caixa Aberto</span>
                </span>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produto por nome ou ingrediente..."
                className="w-full bg-stone-100 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-medium text-stone-900 dark:text-white focus:outline-none focus:border-amber-400 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-amber-400 text-stone-950 font-black shadow-sm'
                    : 'bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/10'
                }`}
              >
                Todos ({allProducts.length})
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-amber-400 text-stone-950 font-black shadow-sm'
                      : 'bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/10'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center text-stone-400 dark:text-stone-500 text-xs">
                Nenhum produto encontrado com o filtro atual.
              </div>
            ) : (
              filteredProducts.map(prod => {
                const isOutOfStock = prod.isOutOfStock;
                return (
                  <div
                    key={prod.id}
                    className={`group dark-glass-card rounded-2xl border p-3 flex flex-col justify-between transition relative overflow-hidden text-left ${
                      isOutOfStock 
                        ? 'opacity-60 border-stone-300 dark:border-white/5 bg-stone-100/50 dark:bg-black/40' 
                        : 'border-stone-200 dark:border-white/10 hover:border-amber-400/60 shadow-md hover:shadow-xl'
                    }`}
                  >
                    {/* Image and Badges */}
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-800 mb-2">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&q=80&w=400';
                        }}
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-stone-950/70 flex items-center justify-center">
                          <span className="text-[10px] font-black uppercase text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-500/40">
                            Esgotado
                          </span>
                        </div>
                      )}
                      {prod.stock !== undefined && prod.stock > 0 && !isOutOfStock && (
                        <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-black/70 text-amber-300 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                          {prod.stock} un
                        </span>
                      )}
                    </div>

                    {/* Name and Price */}
                    <div className="space-y-1 mb-2">
                      <h4 className="text-xs font-black text-stone-900 dark:text-white line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                        {formatPrice(prod.price)}
                      </p>
                    </div>

                    {/* Sizes Selection or Simple Add Button */}
                    {prod.sizes && prod.sizes.length > 0 ? (
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-stone-400 block uppercase">Tamanhos:</span>
                        <div className="grid grid-cols-2 gap-1">
                          {prod.sizes.map((s, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => handleAddItem(prod, s)}
                              className="bg-stone-100 dark:bg-white/10 hover:bg-amber-400 hover:text-stone-950 text-stone-800 dark:text-white py-1 px-1.5 rounded-lg text-[10px] font-bold text-center transition cursor-pointer"
                            >
                              <span className="block truncate">{s.name}</span>
                              <span className="text-[9px] opacity-80">{formatPrice(s.price)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddItem(prod)}
                        className="w-full py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs transition flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Adicionar</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: FAST TICKET & CHECKOUT (5 cols) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="dark-glass-panel p-5 rounded-3xl border-2 border-amber-400/40 dark:border-amber-400/30 shadow-2xl space-y-4">
            
            {/* Ticket Header & Type Selector */}
            <div className="space-y-3 pb-3 border-b border-stone-200 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4" />
                  <span>Comanda Balcão</span>
                </span>
                {ticketItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearTicket}
                    className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Limpar Comanda</span>
                  </button>
                )}
              </div>

              {/* Service Type Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSaleType('takeaway')}
                  className={`py-2 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                    saleType === 'takeaway'
                      ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-md'
                      : 'bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-white/10'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Balcão / Retirada</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSaleType('dine_in')}
                  className={`py-2 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                    saleType === 'dine_in'
                      ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-md'
                      : 'bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-white/10'
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Mesa / Consumo Local</span>
                </button>
              </div>

              {/* Conditional Dine In Table Number */}
              {saleType === 'dine_in' && (
                <div className="flex items-center gap-2 animate-fade-in">
                  <label className="text-xs font-bold text-stone-600 dark:text-stone-300 whitespace-nowrap">
                    Nº da Mesa:
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ex: 04"
                    className="w-24 bg-stone-100 dark:bg-black/40 border border-stone-300 dark:border-white/15 rounded-xl py-1 px-3 text-xs font-black text-stone-900 dark:text-white text-center focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {/* Optional Customer Identification */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase block mb-1">
                    Cliente (Opcional):
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nome do cliente"
                    className="w-full bg-stone-100 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl py-1.5 px-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase block mb-1">
                    WhatsApp (Opcional):
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(66) 99999-9999"
                    className="w-full bg-stone-100 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl py-1.5 px-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Items List in Ticket */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {ticketItems.length === 0 ? (
                <div className="py-8 text-center text-stone-400 dark:text-stone-500 text-xs space-y-1">
                  <ShoppingBag className="w-8 h-8 mx-auto opacity-40 mb-1" />
                  <p className="font-bold">Comanda vazia</p>
                  <p className="text-[11px]">Toque nos produtos ao lado para adicionar ao pedido</p>
                </div>
              ) : (
                ticketItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-stone-50 dark:bg-black/30 p-2.5 rounded-2xl border border-stone-200 dark:border-white/5 flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-stone-900 dark:text-white truncate">
                        {item.product.name}
                        {item.sizeName && <span className="text-[11px] text-amber-700 dark:text-amber-400 font-normal"> ({item.sizeName})</span>}
                      </h5>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400">
                        {formatPrice(item.unitPrice)} un • Total: <strong>{formatPrice(item.unitPrice * item.quantity)}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(idx, -1)}
                        className="w-6 h-6 rounded-lg bg-stone-200 dark:bg-white/10 text-stone-800 dark:text-white flex items-center justify-center hover:bg-stone-300 dark:hover:bg-white/20 transition cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-black w-5 text-center text-stone-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(idx, 1)}
                        className="w-6 h-6 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center hover:bg-amber-300 transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-stone-400 hover:text-rose-500 p-1 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment Method Selector */}
            {ticketItems.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-white/10">
                <span className="text-[11px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                  Forma de Pagamento:
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'pix_now', label: 'PIX Imediato', icon: QrCode },
                    { id: 'cash', label: 'Dinheiro', icon: DollarSign },
                    { id: 'debit', label: 'Cartão Débito', icon: CreditCard },
                    { id: 'credit', label: 'Cartão Crédito', icon: CreditCard },
                  ].map(method => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                        className={`p-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer border ${
                          paymentMethod === method.id
                            ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-md font-black'
                            : 'bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-white/5 hover:bg-stone-200 dark:hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{method.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Cash Calculator & Change */}
                {paymentMethod === 'cash' && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-300 dark:border-amber-500/30 space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-900 dark:text-amber-300">Valor Recebido (R$):</span>
                      <input
                        type="number"
                        step="0.01"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder={grandTotal.toFixed(2)}
                        className="w-28 bg-white dark:bg-black/60 border border-amber-400 rounded-xl py-1 px-2.5 text-right font-black text-sm text-stone-950 dark:text-amber-300 focus:outline-none"
                      />
                    </div>

                    {/* Quick values buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleSetQuickCash(grandTotal)}
                        className="text-[10px] font-bold bg-amber-200 dark:bg-amber-500/30 text-amber-950 dark:text-amber-200 px-2 py-1 rounded-lg"
                      >
                        Exato ({formatPrice(grandTotal)})
                      </button>
                      {[20, 50, 100, 200].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleSetQuickCash(val)}
                          className="text-[10px] font-bold bg-stone-200 dark:bg-white/10 text-stone-800 dark:text-white px-2 py-1 rounded-lg hover:bg-amber-300 transition"
                        >
                          R$ {val}
                        </button>
                      ))}
                    </div>

                    {/* Calculated Change */}
                    <div className="flex items-center justify-between pt-1 border-t border-amber-200 dark:border-amber-500/20 text-xs">
                      <span className="font-bold text-stone-700 dark:text-stone-300">Troco a Devolver:</span>
                      <span className={`font-black text-sm ${changeAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-stone-900 dark:text-white'}`}>
                        {formatPrice(changeAmount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Subtotal, Discount, Grand Total */}
                <div className="space-y-1.5 pt-2 text-xs">
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Subtotal:</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                    <span className="flex items-center gap-1">
                      <span>Desconto (R$):</span>
                    </span>
                    <input
                      type="number"
                      step="0.50"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="w-20 bg-stone-100 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-lg py-0.5 px-2 text-right text-xs font-bold text-stone-900 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-between items-baseline pt-2 border-t border-stone-200 dark:border-white/10">
                    <span className="text-sm font-black text-stone-900 dark:text-white uppercase">Total a Pagar:</span>
                    <span className="text-2xl font-black text-amber-700 dark:text-amber-400">{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleCompleteSale('preparo')}
                    className="py-3 px-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    title="Envia para a cozinha em preparo e emite a comanda"
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>Lançar Cozinha</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleCompleteSale('concluido')}
                    className="py-3 px-3 rounded-2xl dark-glass-button-gold font-black text-xs transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    title="Conclui a venda no caixa e imprime a comanda"
                  >
                    <Check className="w-4 h-4 text-stone-950 stroke-[3]" />
                    <span>Concluir Venda</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
