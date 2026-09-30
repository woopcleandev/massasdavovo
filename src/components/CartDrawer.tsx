import React, { useState, useEffect, useMemo } from 'react';
import { CartItem, CustomerInfo, NEIGHBORHOODS, PaymentMethod, Order, OrderItem, OrderSchedule } from '../types';
import { RESTAURANT_INFO } from '../data';
import { 
  X, Minus, Plus, Trash2, ShoppingCart, Send, MapPin, 
  CreditCard, Clock, CheckCircle, Home, Briefcase, Tag, 
  AlertCircle, Copy, Check, ChevronRight, ShieldCheck, Sparkles,
  Calendar, Zap, BellRing, Utensils
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { OrderSuccessModal } from './OrderSuccessModal';
import { getBusinessStatus, getAvailableScheduleSlots, DayScheduleOption } from '../utils/businessHours';

interface CartDrawerProps {
  cartItems: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  cartItems,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const { currentUser, userProfile, savedAddresses, addSavedAddress } = useAuth();
  const { settings, createOrder } = useCompany();
  const [selectedAddressId, setSelectedAddressId] = useState<string>('custom');
  const [saveThisAddress, setSaveThisAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Business Status & Scheduling Options
  const businessStatus = useMemo(() => getBusinessStatus(settings.operatingHours), [settings.operatingHours]);
  const scheduleOptions = useMemo(() => getAvailableScheduleSlots(settings.operatingHours), [settings.operatingHours]);

  // If closed, forced to schedule mode
  const [isSchedulingMode, setIsSchedulingMode] = useState<boolean>(!businessStatus.isOpen);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return scheduleOptions[0]?.dateStr || businessStatus.nextOpening.dateStr;
  });
  const [selectedTimeStr, setSelectedTimeStr] = useState<string>(() => {
    return scheduleOptions[0]?.times[0] || businessStatus.nextOpening.timeStr;
  });

  // Sync state if business hours change
  useEffect(() => {
    if (!businessStatus.isOpen) {
      setIsSchedulingMode(true);
    }
    if (scheduleOptions.length > 0) {
      const dayExists = scheduleOptions.find(d => d.dateStr === selectedDateStr);
      if (!dayExists) {
        setSelectedDateStr(scheduleOptions[0].dateStr);
        setSelectedTimeStr(scheduleOptions[0].times[0] || '18:00');
      } else if (!dayExists.times.includes(selectedTimeStr)) {
        setSelectedTimeStr(dayExists.times[0] || '18:00');
      }
    }
  }, [businessStatus.isOpen, scheduleOptions]);

  // Selected day object
  const activeScheduleDay = scheduleOptions.find(d => d.dateStr === selectedDateStr) || scheduleOptions[0];

  // Success state for completed order
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [completedWaUrl, setCompletedWaUrl] = useState<string>('');

  // Try to load saved customer info from localStorage
  const [customer, setCustomer] = useState<CustomerInfo>(() => {
    try {
      const saved = localStorage.getItem('vovo_customer_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        let pMethod: PaymentMethod = parsed.paymentMethod || 'pix_now';
        if (pMethod === 'pix') pMethod = 'pix_now';
        return {
          name: parsed.name || '',
          phone: parsed.phone || '',
          deliveryType: parsed.deliveryType || 'delivery',
          street: parsed.street || '',
          number: parsed.number || '',
          neighborhood: parsed.neighborhood || NEIGHBORHOODS[0].name,
          reference: parsed.reference || '',
          paymentMethod: pMethod,
          changeFor: parsed.changeFor || '',
        };
      }
    } catch (e) {
      console.error(e);
    }
    return {
      name: '',
      phone: '',
      deliveryType: 'delivery',
      street: '',
      number: '',
      neighborhood: NEIGHBORHOODS[0].name,
      reference: '',
      paymentMethod: 'pix_now',
      changeFor: '',
    };
  });

  // Pre-fill user profile info if logged in
  useEffect(() => {
    if (userProfile) {
      setCustomer(prev => ({
        ...prev,
        name: prev.name || userProfile.name || '',
        phone: prev.phone || userProfile.whatsapp || '',
      }));
    }
  }, [userProfile]);

  // Handle saved address quick select selection
  const handleSelectSavedAddress = (addrId: string) => {
    setSelectedAddressId(addrId);
    if (addrId === 'custom') {
      setCustomer(prev => ({
        ...prev,
        street: '',
        number: '',
        neighborhood: NEIGHBORHOODS[0].name,
      }));
    } else {
      const addr = savedAddresses.find(a => a.id === addrId);
      if (addr) {
        setCustomer(prev => ({
          ...prev,
          street: addr.street,
          number: addr.number,
          neighborhood: addr.neighborhood,
        }));
      }
    }
  };

  // Keep track of validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Get active delivery fee
  const activeNeighborhood = NEIGHBORHOODS.find(n => n.name === customer.neighborhood);
  const deliveryFee = customer.deliveryType === 'delivery' ? (activeNeighborhood?.fee || 0) : 0;

  // Calculate Subtotal
  const itemsSubtotal = cartItems.reduce((acc, curr) => acc + curr.totalUnitPrice * curr.quantity, 0);
  const grandTotal = itemsSubtotal + deliveryFee;

  // Update localStorage when customer changes
  useEffect(() => {
    localStorage.setItem('vovo_customer_info', JSON.stringify(customer));
  }, [customer]);

  const validateFormDirect = () => {
    const errs: Record<string, string> = {};
    if (!customer.name.trim()) errs.name = 'Nome é obrigatório';
    if (!customer.phone.trim()) errs.phone = 'WhatsApp de contato é obrigatório';

    if (customer.deliveryType === 'delivery') {
      if (!customer.street?.trim()) errs.street = 'Rua é obrigatória';
      if (!customer.number?.trim()) errs.number = 'Número é obrigatório';
      if (!customer.neighborhood) errs.neighborhood = 'Bairro é obrigatório';
    }

    if (customer.deliveryType === 'dine_in') {
      if (!customer.tableNumber?.trim()) errs.tableNumber = 'Digite o número da sua mesa ou comanda';
    }

    if (isSchedulingMode) {
      if (!selectedDateStr) errs.scheduleDate = 'Selecione o dia do agendamento';
      if (!selectedTimeStr) errs.scheduleTime = 'Selecione o horário do agendamento';
    }

    return errs;
  };

  const handleSendOrder = async () => {
    const errs = validateFormDirect();
    setErrors(errs);

    const errorKeys = Object.keys(errs);
    if (errorKeys.length > 0) {
      const firstField = errorKeys[0];
      const element = document.getElementById(`field-${firstField}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    // Save to firebase database if checked and user is logged in
    if (currentUser && customer.deliveryType === 'delivery' && selectedAddressId === 'custom' && saveThisAddress && customer.street && customer.number && customer.neighborhood) {
      addSavedAddress({
        street: customer.street,
        number: customer.number,
        neighborhood: customer.neighborhood,
        label: 'casa'
      }).catch(e => console.error("Error saving address on checkout:", e));
    }

    // Convert cartItems to OrderItems
    const orderItems: OrderItem[] = cartItems.map(item => ({
      id: item.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.totalUnitPrice,
      totalPrice: item.totalUnitPrice * item.quantity,
      size: item.customization?.selectedSize?.name,
      pasta: item.customization?.selectedPasta?.name,
      sauce: item.customization?.selectedSauce?.name,
      toppings: item.customization?.selectedToppings?.map(t => t.name),
      notes: item.notes,
    }));

    // Normalize paymentMethod
    const pMethod = (customer.paymentMethod === 'pix' ? 'pix_now' : customer.paymentMethod) as PaymentMethod;

    // Build schedule object if scheduling mode is active
    const scheduleData: OrderSchedule | undefined = isSchedulingMode ? {
      isScheduled: true,
      date: selectedDateStr,
      time: selectedTimeStr,
      displayLabel: activeScheduleDay ? `${activeScheduleDay.label} às ${selectedTimeStr}` : `${selectedDateStr} às ${selectedTimeStr}`
    } : undefined;

    // Create Order in Firestore and LocalStorage
    let savedOrder: Order;
    try {
      savedOrder = await createOrder({
        customerName: customer.name,
        customerPhone: customer.phone,
        customerId: currentUser?.uid,
        deliveryType: customer.deliveryType,
        tableNumber: customer.tableNumber,
        posIdentifierValue: customer.tableNumber || customer.posIdentifierValue,
        street: customer.street,
        number: customer.number,
        neighborhood: customer.neighborhood,
        reference: customer.reference,
        paymentMethod: pMethod,
        changeFor: customer.changeFor,
        items: orderItems,
        itemsSubtotal,
        deliveryFee,
        grandTotal,
        schedule: scheduleData,
      });
    } catch (e) {
      console.error("Order creation fallback:", e);
      savedOrder = {
        id: 'order-' + Date.now(),
        orderNumber: `#MV-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: customer.name,
        customerPhone: customer.phone,
        deliveryType: customer.deliveryType,
        tableNumber: customer.tableNumber,
        posIdentifierValue: customer.tableNumber || customer.posIdentifierValue,
        street: customer.street,
        number: customer.number,
        neighborhood: customer.neighborhood,
        reference: customer.reference,
        paymentMethod: pMethod,
        changeFor: customer.changeFor,
        items: orderItems,
        itemsSubtotal,
        deliveryFee,
        grandTotal,
        status: 'novo',
        schedule: scheduleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Always fetch latest Master Admin WhatsApp Number
    const activeMasterWhatsapp = (settings.whatsappNumber || RESTAURANT_INFO.whatsappNumber).replace(/\D/g, '');

    // Compile complete WhatsApp message
    let message = `*🍝 NOVO PEDIDO - MASSAS DA VOVÓ*\n`;
    message += `*Comanda:* ${savedOrder.orderNumber}\n`;
    message += `----------------------------------------\n`;
    
    if (isSchedulingMode && scheduleData) {
      message += `*⏰ TIPO: 📅 PEDIDO AGENDADO COM ANTECEDÊNCIA*\n`;
      message += `*Data e Horário Marcados:* ${scheduleData.displayLabel}\n`;
      if (!businessStatus.isOpen) {
        message += `_(Pedido realizado fora do expediente para preparo na abertura da casa)_\n`;
      }
    } else {
      message += `*⚡ TIPO:* Preparo Imediato (30-50 min)\n`;
    }
    
    message += `----------------------------------------\n`;
    message += `*Cliente:* ${customer.name}\n`;
    message += `*Contato:* ${customer.phone}\n`;
    message += `*Método:* ${
      customer.deliveryType === 'delivery'
        ? '🚀 Entrega em Domicílio'
        : customer.deliveryType === 'dine_in'
        ? `🍽️ Consumo no Local (Mesa/Comanda: ${customer.tableNumber || 'Salão'})`
        : '🏪 Retirar no Local'
    }\n`;
    message += `----------------------------------------\n\n`;

    message += `*ITENS DO PEDIDO:*\n`;
    cartItems.forEach((item, index) => {
      message += `${index + 1}. *${item.quantity}x ${item.product.name}*\n`;
      
      const parts: string[] = [];
      if (item.customization?.selectedSize) {
        parts.push(`Tamanho: ${item.customization.selectedSize.name}`);
      }
      if (item.customization?.selectedPasta) {
        parts.push(`Massa: ${item.customization.selectedPasta.name}`);
      }
      if (item.customization?.selectedSauce) {
        parts.push(`Molho: ${item.customization.selectedSauce.name}`);
      }
      if (item.customization?.selectedToppings && item.customization.selectedToppings.length > 0) {
        const tops = item.customization.selectedToppings.map(t => t.name).join(', ');
        parts.push(`Adicionais: ${tops}`);
      }
      if (item.notes) {
        parts.push(`Obs: "${item.notes}"`);
      }

      if (parts.length > 0) {
        message += `   _${parts.join(' | ')}_\n`;
      }
      message += `   *Subtotal:* ${formatPrice(item.totalUnitPrice * item.quantity)}\n\n`;
    });

    message += `----------------------------------------\n`;
    message += `*RESUMO FINANCEIRO:*\n`;
    message += `• Subtotal itens: ${formatPrice(itemsSubtotal)}\n`;
    if (customer.deliveryType === 'delivery') {
      message += `• Taxa de Entrega (${customer.neighborhood}): ${formatPrice(deliveryFee)}\n`;
    }
    message += `• *TOTAL DO PEDIDO: ${formatPrice(grandTotal)}*\n`;
    message += `----------------------------------------\n\n`;

    message += `*FORMA DE PAGAMENTO:*\n`;
    if (pMethod === 'pix_now') {
      message += `• *PIX AGORA (Chave Pix)*\n`;
      message += `  Chave PIX (${settings.pixKeyType}): *${settings.pixKey}*\n`;
      message += `  Favorecido: ${settings.pixBeneficiary}\n`;
      message += `  Valor: ${formatPrice(grandTotal)}\n\n`;
      message += `⚠️ *ATENÇÃO:* Por favor, envie o comprovante do Pix aqui nesta conversa para a Vovó iniciar o preparo imediatamente!\n\n`;
    } else if (pMethod === 'pix_delivery') {
      message += `• *PIX NA ENTREGA (QR Code)*\n`;
      message += `  O entregador levará a maquininha/celular com QR Code Pix no momento da entrega.\n\n`;
    } else if (pMethod === 'credit') {
      message += `• *Cartão de Crédito na Entrega* (Levar maquininha)\n\n`;
    } else if (pMethod === 'debit') {
      message += `• *Cartão de Débito na Entrega* (Levar maquininha)\n\n`;
    } else if (pMethod === 'cash') {
      message += `• *Dinheiro na Entrega* (Troco para ${customer.changeFor || 'Não precisa de troco'})\n\n`;
    }

    if (customer.deliveryType === 'delivery') {
      message += `*ENDEREÇO DE ENTREGA:*\n`;
      message += `• *Rua/Av:* ${customer.street}, Nº ${customer.number}\n`;
      message += `• *Bairro:* ${customer.neighborhood}\n`;
      if (customer.reference?.trim()) {
        message += `• *Referência:* ${customer.reference}\n`;
      }
      message += `----------------------------------------\n`;
    }

    message += `_Pedido realizado pelo Cardápio Digital Massas da Vovó_ 👵❤\n`;
    message += `🌐 Acompanhe e peça novamente em: https://massasdavovo.vercel.app/`;

    const cleanText = encodeURIComponent(message);
    const waUrl = `https://api.whatsapp.com/send?phone=${activeMasterWhatsapp}&text=${cleanText}`;

    // Safely trigger WhatsApp
    try {
      const link = document.createElement('a');
      link.href = waUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(waUrl, '_blank');
    }

    // Set order completion state
    setCompletedOrder(savedOrder);
    setCompletedWaUrl(waUrl);
    setIsSubmitting(false);

    // Empty cart
    onClearCart();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md">
      {/* Click outside to close */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Cart Drawer Panel - Responsive & High Contrast */}
      <div
        id="cart-panel-drawer"
        className="w-full max-w-lg bg-white dark:bg-[#12141a] text-stone-900 dark:text-white h-full flex flex-col shadow-2xl relative animate-slide-left overflow-hidden border-l border-stone-200 dark:border-white/10"
      >
        {/* Drawer Header */}
        <div className="bg-stone-50/90 dark:bg-[#12141a] border-b border-stone-200 dark:border-white/10 p-4 sm:p-5 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-stone-900 dark:text-white">Sua Sacola de Massas</h2>
              <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">
                {cartItems.length} {cartItems.length === 1 ? 'item artesanal' : 'itens artesanais'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-cart"
            onClick={onClose}
            className="p-2.5 rounded-full bg-stone-200/80 dark:bg-white/10 hover:bg-stone-300 dark:hover:bg-white/20 text-stone-700 dark:text-gray-200 transition cursor-pointer"
            title="Fechar sacola"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 no-scrollbar">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-amber-400/15 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5 border border-amber-400/30">
                <ShoppingCart className="w-9 h-9" />
              </div>
              <h3 className="text-base font-extrabold text-stone-900 dark:text-white">Sua sacola está vazia</h3>
              <p className="mt-2 text-xs text-stone-500 dark:text-gray-400 max-w-xs leading-relaxed">
                Navegue pelas massas artesanais da vovó e monte sua refeição com muito carinho.
              </p>
              <button
                onClick={onClose}
                className="mt-6 rounded-full dark-glass-button-gold font-bold text-xs py-3 px-6 shadow-md transition cursor-pointer"
              >
                Ver Cardápio
              </button>
            </div>
          ) : (
            <>
              {/* Order Items List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 dark:text-gray-400">Itens Escolhidos</h3>
                <div className="space-y-2.5">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3 shadow-xs"
                    >
                      {/* Product Thumbnail */}
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-xl object-cover bg-stone-200 dark:bg-black/40 shrink-0 border border-stone-200 dark:border-white/10"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600';
                        }}
                      />

                      {/* Info & Adjusters */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-sm font-bold leading-tight truncate text-stone-900 dark:text-white">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition shrink-0 cursor-pointer"
                            title="Remover item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Customization Badges */}
                        {(item.customization?.selectedSize ||
                          item.customization?.selectedPasta ||
                          item.customization?.selectedSauce ||
                          (item.customization?.selectedToppings && item.customization.selectedToppings.length > 0) ||
                          item.notes) && (
                          <div className="mt-1.5 flex flex-col gap-0.5 text-[11px] text-stone-700 dark:text-gray-300 leading-snug bg-white/80 dark:bg-white/5 rounded-lg p-2 border border-stone-200 dark:border-white/5">
                            {item.customization?.selectedSize && (
                              <div><strong className="text-amber-600 dark:text-amber-400">Tamanho:</strong> {item.customization.selectedSize.name}</div>
                            )}
                            {item.customization?.selectedPasta && (
                              <div><strong className="text-amber-600 dark:text-amber-400">Massa:</strong> {item.customization.selectedPasta.name}</div>
                            )}
                            {item.customization?.selectedSauce && (
                              <div><strong className="text-amber-600 dark:text-amber-400">Molho:</strong> {item.customization.selectedSauce.name}</div>
                            )}
                            {item.customization?.selectedToppings && (
                              <div>
                                <strong className="text-amber-600 dark:text-amber-400">Adicionais:</strong>{' '}
                                {item.customization.selectedToppings.map(t => t.name).join(', ')}
                              </div>
                            )}
                            {item.notes && (
                              <div className="italic"><strong className="text-amber-600 dark:text-amber-400">Obs:</strong> "{item.notes}"</div>
                            )}
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
                            {formatPrice(item.totalUnitPrice * item.quantity)}
                          </span>

                          <div className="flex items-center gap-2 border border-stone-200 dark:border-white/10 rounded-full bg-white dark:bg-white/5 p-1">
                            <button
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="p-1 rounded-full bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/20 text-stone-700 dark:text-white transition cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-black w-4 text-center text-stone-900 dark:text-white">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="p-1 rounded-full bg-amber-400 text-black hover:bg-amber-300 transition cursor-pointer"
                            >
                              <Plus className="w-3 h-3 stroke-[3]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1. Timing & Scheduling Card */}
              <div className={`space-y-3.5 rounded-2xl p-4 border shadow-xs text-left transition-all ${
                !businessStatus.isOpen 
                  ? 'border-amber-300 dark:border-amber-400/30 bg-amber-50/70 dark:bg-amber-950/20' 
                  : 'border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/5'
              }`}>
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-stone-800 dark:text-gray-200">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Horário do Pedido</span>
                  </h3>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    businessStatus.isOpen
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30'
                  }`}>
                    {businessStatus.isOpen ? '🟢 Cozinha Aberta' : '⏰ Fora do Horário'}
                  </span>
                </div>

                {/* If Store is Closed Notice */}
                {!businessStatus.isOpen ? (
                  <div className="bg-white dark:bg-amber-500/15 border border-amber-200 dark:border-amber-400/30 rounded-xl p-3 text-xs space-y-1.5 text-stone-800 dark:text-amber-200">
                    <div className="flex items-center gap-1.5 font-black text-amber-700 dark:text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Restaurante Fechado no Momento</span>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-amber-200/90 leading-relaxed font-normal">
                      Nosso horário é de <strong>Terça a Domingo das {settings.operatingHours?.openTime || '18:00'} às {settings.operatingHours?.closeTime || '23:00'}</strong>.
                      Você pode realizar o <strong>Agendamento do Pedido</strong> para a próxima abertura da casa!
                    </p>
                  </div>
                ) : (
                  /* If Store is Open: Options to choose Immediate or Scheduled */
                  <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 dark:bg-white/5 rounded-2xl border border-stone-200 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => setIsSchedulingMode(false)}
                      className={`py-2 px-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        !isSchedulingMode
                          ? 'bg-amber-400 text-black shadow-xs font-black'
                          : 'text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Preparo Imediato</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSchedulingMode(true)}
                      className={`py-2 px-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSchedulingMode
                          ? 'bg-amber-400 text-black shadow-xs font-black'
                          : 'text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Agendar Pedido</span>
                    </button>
                  </div>
                )}

                {/* When Scheduling is Active: Date & Time Selectors */}
                {isSchedulingMode && (
                  <div className="space-y-3 pt-1 animate-fade-in">
                    {/* 1. Date Selector (Days available) */}
                    <div id="field-scheduleDate">
                      <label className="text-xs font-bold block mb-1.5 text-stone-800 dark:text-gray-200 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Dia Desejado</span>
                        </span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">Próximos dias abertos</span>
                      </label>

                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {scheduleOptions.map((day) => {
                          const isSelected = selectedDateStr === day.dateStr;
                          return (
                            <button
                              key={day.dateStr}
                              type="button"
                              onClick={() => {
                                setSelectedDateStr(day.dateStr);
                                if (!day.times.includes(selectedTimeStr)) {
                                  setSelectedTimeStr(day.times[0] || '18:00');
                                }
                                if (errors.scheduleDate) setErrors({ ...errors, scheduleDate: '' });
                              }}
                              className={`py-2 px-3 rounded-xl border text-xs font-bold shrink-0 transition-all cursor-pointer text-left ${
                                isSelected
                                  ? 'border-amber-500 bg-amber-100 text-amber-900 dark:border-amber-400 dark:bg-amber-400/25 dark:text-amber-300 ring-1 ring-amber-400 shadow-xs'
                                  : 'border-stone-200 dark:border-white/10 bg-white dark:bg-white/5 text-stone-700 dark:text-gray-300 hover:border-stone-300'
                              }`}
                            >
                              <div className="text-[10px] font-black uppercase tracking-wider">{day.shortLabel}</div>
                              <div className="text-xs font-extrabold mt-0.5">{day.dayName.split('-')[0]}</div>
                            </button>
                          );
                        })}
                      </div>
                      {errors.scheduleDate && (
                        <span className="text-[11px] text-red-500 mt-1 block font-medium">{errors.scheduleDate}</span>
                      )}
                    </div>

                    {/* 2. Time Slot Selector */}
                    <div id="field-scheduleTime">
                      <label className="text-xs font-bold block mb-1.5 text-stone-800 dark:text-gray-200 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Horário de {customer.deliveryType === 'delivery' ? 'Entrega' : 'Retirada'}</span>
                        </span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold font-mono">{selectedTimeStr}</span>
                      </label>

                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                        {activeScheduleDay?.times?.map((time) => {
                          const isSelected = selectedTimeStr === time;
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => {
                                setSelectedTimeStr(time);
                                if (errors.scheduleTime) setErrors({ ...errors, scheduleTime: '' });
                              }}
                              className={`py-2 px-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                                isSelected
                                  ? 'border-amber-500 bg-amber-400 text-black shadow-xs font-black'
                                  : 'border-stone-200 dark:border-white/10 bg-white dark:bg-white/5 text-stone-700 dark:text-gray-300 hover:border-stone-300'
                              }`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                      {errors.scheduleTime && (
                        <span className="text-[11px] text-red-500 mt-1 block font-medium">{errors.scheduleTime}</span>
                      )}

                      <div className="text-[11px] text-stone-700 dark:text-gray-300 mt-2 bg-stone-100 dark:bg-black/30 p-2.5 rounded-xl border border-stone-200 dark:border-white/5 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>
                          Pedido marcado para: <strong className="text-amber-700 dark:text-amber-300 font-bold">{activeScheduleDay?.label} às {selectedTimeStr}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Settings Card */}
              <div className="space-y-4 bg-stone-50 dark:bg-white/5 rounded-2xl p-4 border border-stone-200 dark:border-white/10 shadow-xs text-left">
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 dark:border-white/10 pb-2.5 text-stone-800 dark:text-gray-200">
                  <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Método de Entrega</span>
                </h3>

                {/* Delivery tabs (3 modes: Entregar, Retirar, Mesa) */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 dark:bg-white/5 rounded-2xl border border-stone-200 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setCustomer({ ...customer, deliveryType: 'delivery' })}
                    className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      customer.deliveryType === 'delivery'
                        ? 'bg-amber-400 text-black shadow-xs font-black'
                        : 'text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    <span>🚀 Entrega</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomer({ ...customer, deliveryType: 'takeaway' })}
                    className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      customer.deliveryType === 'takeaway'
                        ? 'bg-amber-400 text-black shadow-xs font-black'
                        : 'text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    <span>🏪 Retirada</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomer({ ...customer, deliveryType: 'dine_in' })}
                    className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      customer.deliveryType === 'dine_in'
                        ? 'bg-amber-400 text-black shadow-xs font-black'
                        : 'text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    <span>🍽️ Na Mesa</span>
                  </button>
                </div>

                {/* Local Dine-In / Mesa Input (Customer Digits Table Number / Details) */}
                {customer.deliveryType === 'dine_in' && (
                  <div id="field-tableNumber" className="bg-amber-50 dark:bg-amber-500/10 text-stone-800 dark:text-amber-200 p-3.5 rounded-2xl border-2 border-amber-400/50 space-y-2 text-xs animate-fade-in">
                    <div className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-300">
                      <Utensils className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Consumo no Restaurante (Mesa ou Comanda)</span>
                    </div>
                    <div>
                      <label className="text-xs font-bold block mb-1 text-stone-700 dark:text-gray-300">
                        ✍️ Digite o Número da Mesa / Comanda ou Detalhe:
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Mesa 04, Comanda 12, Varanda Mesa 2, Assento 3..."
                        value={customer.tableNumber || ''}
                        onChange={(e) => {
                          setCustomer({
                            ...customer,
                            tableNumber: e.target.value,
                            posIdentifierValue: e.target.value
                          });
                          if (errors.tableNumber) setErrors({ ...errors, tableNumber: '' });
                        }}
                        className={`w-full rounded-xl bg-white dark:bg-black/40 border-2 p-3 text-sm font-black text-stone-900 dark:text-white placeholder-stone-400 focus:border-amber-500 outline-none shadow-inner ${
                          errors.tableNumber ? 'border-red-500 bg-red-50 dark:bg-red-500/10' : 'border-amber-400/60'
                        }`}
                        autoFocus
                      />
                      {errors.tableNumber && (
                        <span className="text-[11px] text-red-500 mt-1 block font-bold">{errors.tableNumber}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-gray-300 leading-snug">
                      Digite o número onde você está sentado para a nossa equipe levar o prato até você!
                    </p>
                  </div>
                )}

                {/* Local Pickup Notice */}
                {customer.deliveryType === 'takeaway' && (
                  <div className="bg-amber-50 dark:bg-amber-500/10 text-stone-800 dark:text-amber-300 p-3 rounded-xl border border-amber-300 dark:border-amber-400/20 text-xs flex gap-2">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-700 dark:text-amber-400">Retirada em 30-45 minutos!</span>
                      <p className="mt-0.5 leading-snug text-[11px] text-stone-600 dark:text-gray-300">
                        Prepare-se para retirar seu pedido quentinho no nosso endereço: <br />
                        <span className="font-semibold underline">{RESTAURANT_INFO.address}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Contact and address form fields */}
                <div className="space-y-3.5 text-left">
                  {/* Name */}
                  <div id="field-name">
                    <label className="text-xs font-bold block mb-1 text-stone-700 dark:text-gray-300">Seu Nome</label>
                    <input
                      type="text"
                      placeholder="Ex: Maria Souza"
                      value={customer.name}
                      onChange={(e) => {
                        setCustomer({ ...customer, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      className={`w-full rounded-xl bg-white dark:bg-black/40 border p-3 text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:border-amber-500 outline-none ${
                        errors.name ? 'border-red-500 bg-red-50 dark:bg-red-500/10' : 'border-stone-300 dark:border-white/10'
                      }`}
                    />
                    {errors.name && <span className="text-[11px] text-red-500 mt-1 block font-medium">{errors.name}</span>}
                  </div>

                  {/* Phone */}
                  <div id="field-phone">
                    <label className="text-xs font-bold block mb-1 text-stone-700 dark:text-gray-300">WhatsApp de Contato</label>
                    <input
                      type="tel"
                      placeholder="Ex: (66) 99652-3006"
                      value={customer.phone}
                      onChange={(e) => {
                        setCustomer({ ...customer, phone: e.target.value });
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                      }}
                      className={`w-full rounded-xl bg-white dark:bg-black/40 border p-3 text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:border-amber-500 outline-none ${
                        errors.phone ? 'border-red-500 bg-red-50 dark:bg-red-500/10' : 'border-stone-300 dark:border-white/10'
                      }`}
                    />
                    {errors.phone && <span className="text-[11px] text-red-500 mt-1 block font-medium">{errors.phone}</span>}
                  </div>

                  {/* Delivery Specific Fields */}
                  {customer.deliveryType === 'delivery' && (
                    <div className="space-y-3.5 animate-fade-in">
                      {/* Saved addresses selector if user has saved addresses */}
                      {currentUser && savedAddresses.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <label className="text-xs font-bold block text-stone-700 dark:text-gray-300">Seus Endereços Salvos</label>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                            {savedAddresses.map((addr) => (
                              <label
                                key={addr.id}
                                className={`flex items-start gap-2.5 p-3 rounded-xl border transition text-left cursor-pointer ${
                                  selectedAddressId === addr.id
                                    ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-400/10 ring-1 ring-amber-400'
                                    : 'border-stone-200 dark:border-white/10 hover:border-stone-300 bg-white dark:bg-white/5'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="saved-address"
                                  checked={selectedAddressId === addr.id}
                                  onChange={() => handleSelectSavedAddress(addr.id)}
                                  className="mt-0.5 accent-amber-500 text-amber-600 focus:ring-amber-400"
                                />
                                <div className="text-[11px] leading-snug">
                                  <span className="font-extrabold capitalize text-amber-700 dark:text-amber-400">{addr.label}:</span>{' '}
                                  <span className="font-semibold text-stone-800 dark:text-stone-200">{addr.street}, {addr.number} ({addr.neighborhood})</span>
                                </div>
                              </label>
                            ))}

                            <label
                              className={`flex items-center gap-2.5 p-3 rounded-xl border transition text-left cursor-pointer ${
                                selectedAddressId === 'custom'
                                  ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-400/10 ring-1 ring-amber-400'
                                  : 'border-stone-200 dark:border-white/10 hover:border-stone-300 bg-white dark:bg-white/5'
                              }`}
                            >
                              <input
                                type="radio"
                                name="saved-address"
                                checked={selectedAddressId === 'custom'}
                                onChange={() => handleSelectSavedAddress('custom')}
                                className="accent-amber-500 text-amber-600 focus:ring-amber-400"
                              />
                              <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300">➕ Outro Endereço / Digitar Manualmente</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Display read-only card if saved address is selected */}
                      {currentUser && selectedAddressId !== 'custom' && (
                        <div className="bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl p-3 text-xs flex items-center justify-between">
                          <div>
                            <span className="text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[9px]">Entregando em</span>
                            <p className="font-extrabold text-amber-700 dark:text-amber-400 mt-0.5">
                              {customer.street}, {customer.number}
                            </p>
                            <p className="text-stone-600 dark:text-gray-300 mt-0.5">{customer.neighborhood}</p>
                          </div>
                          <span className="p-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-lg font-bold text-[10px]">
                            Endereço Salvo ✓
                          </span>
                        </div>
                      )}

                      {/* Manual inputs if no logged-in saved address or custom selected */}
                      {(!currentUser || selectedAddressId === 'custom') && (
                        <>
                          {/* Neighborhood / Bairro selector */}
                          <div id="field-neighborhood">
                            <label className="text-xs font-bold block mb-1 text-stone-700 dark:text-gray-300">Seu Bairro (Primavera do Leste)</label>
                            <select
                              value={customer.neighborhood}
                              onChange={(e) => {
                                setCustomer({ ...customer, neighborhood: e.target.value });
                                if (errors.neighborhood) setErrors({ ...errors, neighborhood: '' });
                              }}
                              className={`w-full rounded-xl border p-3 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:border-amber-500 outline-none ${
                                errors.neighborhood ? 'border-red-500 bg-red-50 dark:bg-red-500/10' : 'border-stone-300 dark:border-white/10'
                              }`}
                            >
                              <optgroup label="📍 Faixa R$ 10,00">
                                {NEIGHBORHOODS.filter(n => n.fee === 10).map((n) => (
                                  <option key={n.name} value={n.name} className="bg-white dark:bg-gray-900 text-stone-900 dark:text-white">
                                    {n.name} — {formatPrice(n.fee)}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="📍 Faixa R$ 15,00">
                                {NEIGHBORHOODS.filter(n => n.fee === 15).map((n) => (
                                  <option key={n.name} value={n.name} className="bg-white dark:bg-gray-900 text-stone-900 dark:text-white">
                                    {n.name} — {formatPrice(n.fee)}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="📍 Faixa R$ 20,00">
                                {NEIGHBORHOODS.filter(n => n.fee === 20).map((n) => (
                                  <option key={n.name} value={n.name} className="bg-white dark:bg-gray-900 text-stone-900 dark:text-white">
                                    {n.name} — {formatPrice(n.fee)}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          </div>

                          {/* Street & Number in grid */}
                          <div className="grid grid-cols-3 gap-2.5">
                            <div className="col-span-2 text-left" id="field-street">
                              <label className="text-xs font-bold block mb-1 text-stone-700 dark:text-gray-300">Rua / Avenida</label>
                              <input
                                type="text"
                                placeholder="Ex: Av. Porto Alegre"
                                value={customer.street}
                                onChange={(e) => {
                                  setCustomer({ ...customer, street: e.target.value });
                                  if (errors.street) setErrors({ ...errors, street: '' });
                                }}
                                className={`w-full rounded-xl bg-white dark:bg-black/40 border p-3 text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:border-amber-500 outline-none ${
                                  errors.street ? 'border-red-500 bg-red-50 dark:bg-red-500/10' : 'border-stone-300 dark:border-white/10'
                                }`}
                              />
                              {errors.street && <span className="text-[11px] text-red-500 mt-1 block font-medium">{errors.street}</span>}
                            </div>

                            <div className="text-left" id="field-number">
                              <label className="text-xs font-bold block mb-1 text-stone-700 dark:text-gray-300">Número</label>
                              <input
                                type="text"
                                placeholder="Ex: 145"
                                value={customer.number}
                                onChange={(e) => {
                                  setCustomer({ ...customer, number: e.target.value });
                                  if (errors.number) setErrors({ ...errors, number: '' });
                                }}
                                className={`w-full rounded-xl bg-white dark:bg-black/40 border p-3 text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:border-amber-500 outline-none ${
                                  errors.number ? 'border-red-500 bg-red-50 dark:bg-red-500/10' : 'border-stone-300 dark:border-white/10'
                                }`}
                              />
                              {errors.number && <span className="text-[11px] text-red-500 mt-1 block font-medium">{errors.number}</span>}
                            </div>
                          </div>

                          {/* Save address checkbox option for logged-in user */}
                          {currentUser && (
                            <label className="flex items-center gap-2 cursor-pointer py-1 text-left">
                              <input
                                type="checkbox"
                                checked={saveThisAddress}
                                onChange={(e) => setSaveThisAddress(e.target.checked)}
                                className="rounded accent-amber-500 text-amber-600 focus:ring-amber-400 h-4 w-4"
                              />
                              <span className="text-[10px] text-stone-700 dark:text-gray-300 font-bold select-none">
                                💾 Salvar este endereço na minha conta para os próximos pedidos
                              </span>
                            </label>
                          )}
                        </>
                      )}

                      {/* Log in prompt banner for guest checkout */}
                      {!currentUser && (
                        <div className="bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 rounded-xl p-3 text-[11px] text-amber-800 dark:text-amber-300 leading-snug text-left font-semibold">
                          🔑 <span className="font-extrabold text-stone-900 dark:text-white">Dica:</span> Crie uma conta ou entre em <strong>Minha Conta</strong> para salvar seus endereços e ver o histórico de pedidos em tempo real!
                        </div>
                      )}

                      {/* Reference point */}
                      <div className="text-left">
                        <label className="text-xs font-bold block mb-1 text-stone-700 dark:text-gray-300">Ponto de Referência (Opcional)</label>
                        <input
                          type="text"
                          placeholder="Ex: Próximo à praça de eventos"
                          value={customer.reference}
                          onChange={(e) => setCustomer({ ...customer, reference: e.target.value })}
                          className="w-full rounded-xl bg-white dark:bg-black/40 border border-stone-300 dark:border-white/10 p-3 text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:border-amber-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Methods Card */}
              <div className="space-y-4 bg-stone-50 dark:bg-white/5 rounded-2xl p-4 border border-stone-200 dark:border-white/10 shadow-xs text-left">
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 dark:border-white/10 pb-2.5 text-stone-800 dark:text-gray-200">
                  <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Forma de Pagamento</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Pix Agora */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                      customer.paymentMethod === 'pix_now' || customer.paymentMethod === 'pix'
                        ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-400/15 ring-1 ring-amber-400'
                        : 'border-stone-200 dark:border-white/10 hover:border-stone-300 bg-white dark:bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      checked={customer.paymentMethod === 'pix_now' || customer.paymentMethod === 'pix'}
                      onChange={() => setCustomer({ ...customer, paymentMethod: 'pix_now' })}
                      className="mt-0.5 w-4 h-4 accent-amber-500 text-amber-600 focus:ring-amber-400"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold leading-none text-stone-900 dark:text-white">🌀 Pix Agora (Chave Pix)</span>
                      <span className="text-[10px] text-stone-500 dark:text-gray-400 mt-1 leading-snug">
                        Pague agora e envie o comprovante no WhatsApp
                      </span>
                    </div>
                  </label>

                  {/* Pix na Entrega */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                      customer.paymentMethod === 'pix_delivery'
                        ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-400/15 ring-1 ring-amber-400'
                        : 'border-stone-200 dark:border-white/10 hover:border-stone-300 bg-white dark:bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      checked={customer.paymentMethod === 'pix_delivery'}
                      onChange={() => setCustomer({ ...customer, paymentMethod: 'pix_delivery' })}
                      className="mt-0.5 w-4 h-4 accent-amber-500 text-amber-600 focus:ring-amber-400"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold leading-none text-stone-900 dark:text-white">📱 Pix na Entrega (QR Code)</span>
                      <span className="text-[10px] text-stone-500 dark:text-gray-400 mt-1 leading-snug">
                        Entregador leva o QR Code na maquininha
                      </span>
                    </div>
                  </label>

                  {/* Dinheiro */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                      customer.paymentMethod === 'cash'
                        ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-400/15 ring-1 ring-amber-400'
                        : 'border-stone-200 dark:border-white/10 hover:border-stone-300 bg-white dark:bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      checked={customer.paymentMethod === 'cash'}
                      onChange={() => setCustomer({ ...customer, paymentMethod: 'cash' })}
                      className="mt-0.5 w-4 h-4 accent-amber-500 text-amber-600 focus:ring-amber-400"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold leading-none text-stone-900 dark:text-white">💵 Dinheiro</span>
                      <span className="text-[10px] text-stone-500 dark:text-gray-400 mt-1 leading-snug">Pagar em espécie na entrega</span>
                    </div>
                  </label>

                  {/* Cartão de Crédito */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                      customer.paymentMethod === 'credit'
                        ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-400/15 ring-1 ring-amber-400'
                        : 'border-stone-200 dark:border-white/10 hover:border-stone-300 bg-white dark:bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      checked={customer.paymentMethod === 'credit'}
                      onChange={() => setCustomer({ ...customer, paymentMethod: 'credit' })}
                      className="mt-0.5 w-4 h-4 accent-amber-500 text-amber-600 focus:ring-amber-400"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold leading-none text-stone-900 dark:text-white">💳 Cartão de Crédito</span>
                      <span className="text-[10px] text-stone-500 dark:text-gray-400 mt-1 leading-snug">Levar maquininha na entrega</span>
                    </div>
                  </label>

                  {/* Cartão de Débito */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                      customer.paymentMethod === 'debit'
                        ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-400/15 ring-1 ring-amber-400'
                        : 'border-stone-200 dark:border-white/10 hover:border-stone-300 bg-white dark:bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      checked={customer.paymentMethod === 'debit'}
                      onChange={() => setCustomer({ ...customer, paymentMethod: 'debit' })}
                      className="mt-0.5 w-4 h-4 accent-amber-500 text-amber-600 focus:ring-amber-400"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold leading-none text-stone-900 dark:text-white">💳 Cartão de Débito</span>
                      <span className="text-[10px] text-stone-500 dark:text-gray-400 mt-1 leading-snug">Levar maquininha na entrega</span>
                    </div>
                  </label>
                </div>

                {/* Pix Agora details info box */}
                {(customer.paymentMethod === 'pix_now' || customer.paymentMethod === 'pix') && (
                  <div className="bg-amber-50 dark:bg-amber-500/10 text-stone-800 dark:text-amber-200 p-3.5 rounded-xl border border-amber-300 dark:border-amber-400/20 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                      <CheckCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Chave PIX da Vovó ({settings.pixKeyType}):</span>
                    </div>
                    <div className="bg-white dark:bg-black/40 p-2.5 rounded-lg border border-amber-300 dark:border-amber-400/30 flex items-center justify-between font-mono font-bold text-xs text-amber-700 dark:text-amber-300">
                      <span className="select-all">{settings.pixKey}</span>
                      <span className="text-[10px] text-stone-500 dark:text-gray-400 font-sans font-medium">{settings.pixBeneficiary}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-gray-300 leading-tight">
                      Ao clicar em finalizar, a mensagem já incluirá os dados do PIX e aguardaremos o comprovante no WhatsApp para iniciar o preparo!
                    </p>
                  </div>
                )}

                {/* Pix na Entrega details info box */}
                {customer.paymentMethod === 'pix_delivery' && (
                  <div className="bg-blue-50 dark:bg-blue-500/10 text-stone-800 dark:text-blue-300 p-3.5 rounded-xl border border-blue-200 dark:border-blue-400/20 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400">
                      <span className="text-sm">📱</span>
                      <span>QR Code Pix com o Entregador</span>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-gray-300 leading-tight">
                      O entregador levará a maquininha ou o celular com o QR Code Pix pronto para você escanear e pagar na entrega.
                    </p>
                  </div>
                )}

                {/* Cash change field */}
                {customer.paymentMethod === 'cash' && (
                  <div className="mt-3 text-left animate-fade-in">
                    <label className="text-xs font-bold block mb-1 text-stone-700 dark:text-gray-300">Precisa de troco para quanto?</label>
                    <input
                      type="text"
                      placeholder="Ex: R$ 50, R$ 100 (ou deixe em branco se não precisar)"
                      value={customer.changeFor}
                      onChange={(e) => setCustomer({ ...customer, changeFor: e.target.value })}
                      className="w-full rounded-xl bg-white dark:bg-black/40 border border-stone-300 dark:border-white/10 p-3 text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:border-amber-500 outline-none"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer Summary & Send Button */}
        {cartItems.length > 0 && (
          <div className="bg-stone-50 dark:bg-[#0e1017] border-t border-stone-200 dark:border-white/10 p-4 sm:p-5 shrink-0 space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between text-stone-600 dark:text-gray-400">
                <span>Subtotal dos itens</span>
                <span className="font-mono font-medium">{formatPrice(itemsSubtotal)}</span>
              </div>
              {customer.deliveryType === 'delivery' && (
                <div className="flex items-center justify-between text-stone-600 dark:text-gray-400">
                  <span>Taxa de Entrega ({customer.neighborhood})</span>
                  <span className="font-mono font-medium">{formatPrice(deliveryFee)}</span>
                </div>
              )}
              <div className="pt-2.5 border-t border-stone-200 dark:border-white/10 flex items-center justify-between font-black text-lg">
                <span className="text-stone-900 dark:text-white">Total do Pedido</span>
                <span className="text-amber-600 dark:text-amber-400 font-mono text-xl font-black">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Tem certeza de que deseja esvaziar a sacola?')) {
                    onClearCart();
                  }
                }}
                className="text-xs text-stone-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 underline font-medium transition cursor-pointer"
              >
                Limpar sacola
              </button>
            </div>

            <button
              id="btn-send-whatsapp-order"
              disabled={isSubmitting}
              onClick={handleSendOrder}
              className={`w-full flex items-center justify-center gap-2.5 rounded-full disabled:opacity-50 py-4 px-6 text-sm font-black transition shadow-lg active:scale-98 transform hover:scale-[1.01] cursor-pointer ${
                isSchedulingMode
                  ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-400/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              {isSchedulingMode ? (
                <Calendar className="w-4 h-4 text-black" />
              ) : (
                <Send className="w-4 h-4 fill-white" />
              )}
              <span>
                {isSubmitting
                  ? 'Gerando Comanda...'
                  : isSchedulingMode
                  ? `Agendar Pedido para ${selectedTimeStr} via WhatsApp`
                  : 'Finalizar e Enviar Pedido pelo WhatsApp'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {completedOrder && (
        <OrderSuccessModal
          order={completedOrder}
          whatsappUrl={completedWaUrl}
          onClose={() => {
            setCompletedOrder(null);
            setCompletedWaUrl('');
            onClose();
          }}
        />
      )}
    </div>
  );
};
