import React, { useState, useEffect } from 'react';
import { CartItem, CustomerInfo, NEIGHBORHOODS, PaymentMethod } from '../types';
import { RESTAURANT_INFO } from '../data';
import { X, Minus, Plus, Trash2, ShoppingCart, Send, MapPin, CreditCard, Clock, CheckCircle, Home, Briefcase, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';


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
  const [selectedAddressId, setSelectedAddressId] = useState<string>('custom');
  const [saveThisAddress, setSaveThisAddress] = useState(false);

  // Try to load saved customer info from localStorage
  const [customer, setCustomer] = useState<CustomerInfo>(() => {
    try {
      const saved = localStorage.getItem('vovo_customer_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || '',
          phone: parsed.phone || '',
          deliveryType: parsed.deliveryType || 'delivery',
          street: parsed.street || '',
          number: parsed.number || '',
          neighborhood: parsed.neighborhood || NEIGHBORHOODS[0].name,
          reference: parsed.reference || '',
          paymentMethod: parsed.paymentMethod || 'pix',
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
      paymentMethod: 'pix',
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

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!customer.name.trim()) errs.name = 'Nome é obrigatório';
    if (!customer.phone.trim()) errs.phone = 'Telefone é obrigatório';

    if (customer.deliveryType === 'delivery') {
      if (!customer.street?.trim()) errs.street = 'Rua é obrigatória';
      if (!customer.number?.trim()) errs.number = 'Número é obrigatório';
      if (!customer.neighborhood) errs.neighborhood = 'Bairro é obrigatório';
    }

    if (customer.paymentMethod === 'cash' && !customer.changeFor?.trim()) {
      // optional or required if cash? Usually good to check if they need change.
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSendOrder = () => {
    if (!validateForm()) {
      // scroll to first error
      const errorField = Object.keys(errors)[0];
      const element = document.getElementById(`field-${errorField}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Save to firebase database if checked and user is logged in
    if (currentUser && customer.deliveryType === 'delivery' && selectedAddressId === 'custom' && saveThisAddress && customer.street && customer.number && customer.neighborhood) {
      addSavedAddress({
        street: customer.street,
        number: customer.number,
        neighborhood: customer.neighborhood,
        label: 'casa'
      }).catch(e => console.error("Error saving address on checkout:", e));
    }

    // Compile order message in "Anota Aí" style
    let message = `*🍝 NOVO PEDIDO - MASSAS DA VOVÓ*\n`;
    message += `----------------------------------------\n`;
    message += `*Cliente:* ${customer.name}\n`;
    message += `*Contato:* ${customer.phone}\n`;
    message += `*Método:* ${customer.deliveryType === 'delivery' ? '🚀 Entrega' : '🏪 Retirar no Local'}\n`;
    message += `----------------------------------------\n\n`;

    message += `*Itens do Pedido:*\n`;
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
    message += `*Resumo dos Valores:*\n`;
    message += `• Subtotal itens: ${formatPrice(itemsSubtotal)}\n`;
    if (customer.deliveryType === 'delivery') {
      message += `• Taxa de Entrega (${customer.neighborhood}): ${formatPrice(deliveryFee)}\n`;
    }
    message += `• *TOTAL DO PEDIDO: ${formatPrice(grandTotal)}*\n`;
    message += `----------------------------------------\n\n`;

    message += `*Forma de Pagamento:*\n`;
    let paymentText = '';
    switch (customer.paymentMethod) {
      case 'pix':
        paymentText = 'Pix (Chave celular no fechamento)';
        break;
      case 'credit':
        paymentText = 'Cartão de Crédito (Levar maquininha)';
        break;
      case 'debit':
        paymentText = 'Cartão de Débito (Levar maquininha)';
        break;
      case 'cash':
        paymentText = `Dinheiro (Troco para ${customer.changeFor || 'Não precisa'})`;
        break;
    }
    message += `• ${paymentText}\n\n`;

    if (customer.deliveryType === 'delivery') {
      message += `*Endereço para Entrega:*\n`;
      message += `• *Rua/Av:* ${customer.street}, Nº ${customer.number}\n`;
      message += `• *Bairro:* ${customer.neighborhood}\n`;
      if (customer.reference?.trim()) {
        message += `• *Referência:* ${customer.reference}\n`;
      }
      message += `----------------------------------------\n`;
    }

    message += `_Pedido feito através do nosso Cardápio Digital PWA_ 👵❤`;

    // Encode URL and trigger redirect
    const cleanText = encodeURIComponent(message);
    const waUrl = `https://api.whatsapp.com/send?phone=${RESTAURANT_INFO.whatsappNumber}&text=${cleanText}`;
    
    // Open WhatsApp
    window.open(waUrl, '_blank');

    // Optionally clear cart and close
    // We can show a success page or keep cart for reference
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      {/* Click outside to close */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Cart Drawer Panel */}
      <div
        id="cart-panel-drawer"
        className="w-full max-w-lg bg-gray-50 h-full flex flex-col shadow-2xl relative animate-slide-left overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="bg-white border-b border-gray-100 p-5 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0b1c3f]/10 text-[#0b1c3f]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Seu Carrinho</h2>
              <p className="text-xs text-gray-400">
                {cartItems.length} {cartItems.length === 1 ? 'item selecionado' : 'itens selecionados'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-cart"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-[#0b1c3f]/10 flex items-center justify-center text-[#0b1c3f] mb-5 animate-pulse">
                <ShoppingCart className="w-9 h-9" />
              </div>
              <h3 className="text-base font-extrabold text-gray-800">Carrinho Vazio</h3>
              <p className="mt-2 text-xs text-gray-400 max-w-xs leading-relaxed">
                Navegue pelas nossas massas artesanais da vovó e adicione seus pratos favoritos ao pedido.
              </p>
              <button
                onClick={onClose}
                className="mt-6 rounded-full bg-[#0b1c3f] hover:bg-[#07132c] text-[#d4af37] border border-[#d4af37]/20 font-bold text-sm py-3 px-6 shadow-xs transition"
              >
                Ver Cardápio
              </button>
            </div>
          ) : (
            <>
              {/* Order Items List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Itens Escolhidos</h3>
                <div className="space-y-2.5">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-100 rounded-2xl p-4 flex items-start gap-3 shadow-xs"
                    >
                      {/* Product Thumbnail */}
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-xl object-cover bg-gray-50 shrink-0 border border-gray-50"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600';
                        }}
                      />

                      {/* Info & Adjusters */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-sm font-bold text-gray-900 leading-tight truncate">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="p-1 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                            title="Remover item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Customization Details */}
                        {(item.customization?.selectedSize ||
                          item.customization?.selectedPasta ||
                          item.customization?.selectedSauce ||
                          (item.customization?.selectedToppings && item.customization.selectedToppings.length > 0) ||
                          item.notes) && (
                          <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-gray-500 leading-snug bg-gray-50 rounded-lg p-2 border border-gray-50/50">
                            {item.customization?.selectedSize && (
                              <div><strong>Tamanho:</strong> {item.customization.selectedSize.name}</div>
                            )}
                            {item.customization?.selectedPasta && (
                              <div><strong>Massa:</strong> {item.customization.selectedPasta.name}</div>
                            )}
                            {item.customization?.selectedSauce && (
                              <div><strong>Molho:</strong> {item.customization.selectedSauce.name}</div>
                            )}
                            {item.customization?.selectedToppings && (
                              <div>
                                <strong>Adicionais:</strong>{' '}
                                {item.customization.selectedToppings.map(t => t.name).join(', ')}
                              </div>
                            )}
                            {item.notes && (
                              <div className="text-[#0b1c3f]/80 italic"><strong>Obs:</strong> "{item.notes}"</div>
                            )}
                          </div>
                        )}

                        <div className="mt-3.5 flex items-center justify-between">
                          {/* Item unit subtotal */}
                          <span className="text-sm font-extrabold text-[#0b1c3f]">
                            {formatPrice(item.totalUnitPrice * item.quantity)}
                          </span>

                          {/* Adjust Quantity Buttons */}
                          <div className="flex items-center gap-2.5 border border-gray-100 rounded-full bg-gray-50/50 p-1">
                            <button
                              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="p-1 rounded-full bg-white hover:bg-gray-100 text-gray-600 shadow-xs transition"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-gray-800 w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="p-1 rounded-full bg-white hover:bg-gray-100 text-gray-600 shadow-xs transition"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Settings */}
              <div className="space-y-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-50 pb-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>Método de Entrega</span>
                </h3>

                {/* Delivery tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    onClick={() => setCustomer({ ...customer, deliveryType: 'delivery' })}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                      customer.deliveryType === 'delivery'
                        ? 'bg-white text-[#0b1c3f] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🚀 Entregar em Casa
                  </button>
                  <button
                    onClick={() => setCustomer({ ...customer, deliveryType: 'takeaway' })}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                      customer.deliveryType === 'takeaway'
                        ? 'bg-white text-[#0b1c3f] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🏪 Retirar no Local
                  </button>
                </div>

                {/* Local Pickup Notice */}
                {customer.deliveryType === 'takeaway' && (
                  <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-100 text-xs flex gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Retirada em 30-45 minutos!</span>
                      <p className="mt-0.5 leading-snug">
                        Prepare-se para retirar seu pedido quentinho no nosso endereço: <br />
                        <span className="font-semibold underline text-amber-900">{RESTAURANT_INFO.address}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Contact and address form fields */}
                <div className="space-y-3 text-left">
                  {/* Name */}
                  <div id="field-name">
                    <label className="text-xs font-bold text-gray-700 block mb-1">Seu Nome</label>
                    <input
                      type="text"
                      placeholder="Ex: Maria Souza"
                      value={customer.name}
                      onChange={(e) => {
                        setCustomer({ ...customer, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      className={`w-full rounded-xl border p-3 text-sm focus:ring-red-500 focus:border-red-500 outline-hidden ${
                        errors.name ? 'border-red-500 bg-red-50/10' : 'border-gray-200'
                      }`}
                    />
                    {errors.name && <span className="text-[11px] text-red-500 mt-1 block font-medium">{errors.name}</span>}
                  </div>

                  {/* Phone */}
                  <div id="field-phone">
                    <label className="text-xs font-bold text-gray-700 block mb-1">WhatsApp de Contato</label>
                    <input
                      type="tel"
                      placeholder="Ex: (66) 99652-3006"
                      value={customer.phone}
                      onChange={(e) => {
                        setCustomer({ ...customer, phone: e.target.value });
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                      }}
                      className={`w-full rounded-xl border p-3 text-sm focus:ring-red-500 focus:border-red-500 outline-hidden ${
                        errors.phone ? 'border-red-500 bg-red-50/10' : 'border-gray-200'
                      }`}
                    />
                    {errors.phone && <span className="text-[11px] text-red-500 mt-1 block font-medium">{errors.phone}</span>}
                  </div>

                  {/* Delivery Specific Fields */}
                  {customer.deliveryType === 'delivery' && (
                    <div className="space-y-3 animate-fade-in">
                      {/* Saved addresses selector if user has saved addresses */}
                      {currentUser && savedAddresses.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <label className="text-xs font-bold text-gray-700 block">Seus Endereços Salvos</label>
                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                            {savedAddresses.map((addr) => (
                              <label
                                key={addr.id}
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition text-left ${
                                  selectedAddressId === addr.id
                                    ? 'border-[#0b1c3f] bg-[#0b1c3f]/5 ring-1 ring-[#0b1c3f]'
                                    : 'border-gray-100 hover:border-gray-200 bg-white'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="saved-address"
                                  checked={selectedAddressId === addr.id}
                                  onChange={() => handleSelectSavedAddress(addr.id)}
                                  className="mt-0.5 text-[#0b1c3f] focus:ring-[#0b1c3f]"
                                />
                                <div className="text-[11px] leading-snug">
                                  <span className="font-extrabold capitalize text-[#0b1c3f]">{addr.label}:</span>{' '}
                                  <span className="font-semibold text-gray-700">{addr.street}, {addr.number} ({addr.neighborhood})</span>
                                </div>
                              </label>
                            ))}

                            <label
                              className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition text-left ${
                                selectedAddressId === 'custom'
                                  ? 'border-[#0b1c3f] bg-[#0b1c3f]/5 ring-1 ring-[#0b1c3f]'
                                  : 'border-gray-100 hover:border-gray-200 bg-white'
                              }`}
                            >
                              <input
                                type="radio"
                                name="saved-address"
                                checked={selectedAddressId === 'custom'}
                                onChange={() => handleSelectSavedAddress('custom')}
                                className="text-[#0b1c3f] focus:ring-[#0b1c3f]"
                              />
                              <span className="text-[11px] font-extrabold text-gray-800">➕ Outro Endereço / Digitar Manualmente</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Display read-only card if saved address is selected */}
                      {currentUser && selectedAddressId !== 'custom' && (
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs flex items-center justify-between">
                          <div>
                            <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Entregando em</span>
                            <p className="font-extrabold text-[#0b1c3f] mt-0.5">
                              {customer.street}, {customer.number}
                            </p>
                            <p className="text-gray-500 mt-0.5">{customer.neighborhood}</p>
                          </div>
                          <span className="p-2 bg-white text-emerald-600 border border-emerald-50 rounded-lg font-bold text-[10px]">
                            Endereço Salvo ✓
                          </span>
                        </div>
                      )}

                      {/* Manual inputs if no logged-in saved address or custom selected */}
                      {(!currentUser || selectedAddressId === 'custom') && (
                        <>
                          {/* Neighborhood / Bairro selector */}
                          <div id="field-neighborhood">
                            <label className="text-xs font-bold text-gray-700 block mb-1">Seu Bairro (Primavera do Leste)</label>
                            <select
                              value={customer.neighborhood}
                              onChange={(e) => {
                                setCustomer({ ...customer, neighborhood: e.target.value });
                                if (errors.neighborhood) setErrors({ ...errors, neighborhood: '' });
                              }}
                              className={`w-full rounded-xl border p-3 text-sm bg-white focus:ring-red-500 focus:border-red-500 outline-hidden ${
                                errors.neighborhood ? 'border-red-500 bg-red-50/10' : 'border-gray-200'
                              }`}
                            >
                              {NEIGHBORHOODS.map((n) => (
                                <option key={n.name} value={n.name}>
                                  {n.name} — Taxa: {formatPrice(n.fee)}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Street & Number in grid */}
                          <div className="grid grid-cols-3 gap-2.5">
                            <div className="col-span-2 text-left" id="field-street">
                              <label className="text-xs font-bold text-gray-700 block mb-1">Rua / Avenida</label>
                              <input
                                type="text"
                                placeholder="Ex: Av. Porto Alegre"
                                value={customer.street}
                                onChange={(e) => {
                                  setCustomer({ ...customer, street: e.target.value });
                                  if (errors.street) setErrors({ ...errors, street: '' });
                                }}
                                className={`w-full rounded-xl border p-3 text-sm focus:ring-[#0b1c3f] focus:border-[#0b1c3f] outline-hidden ${
                                  errors.street ? 'border-red-500 bg-red-50/10' : 'border-gray-200'
                                }`}
                              />
                              {errors.street && <span className="text-[11px] text-red-500 mt-1 block font-medium">{errors.street}</span>}
                            </div>

                            <div className="text-left" id="field-number">
                              <label className="text-xs font-bold text-gray-700 block mb-1">Número</label>
                              <input
                                type="text"
                                placeholder="Ex: 145"
                                value={customer.number}
                                onChange={(e) => {
                                  setCustomer({ ...customer, number: e.target.value });
                                  if (errors.number) setErrors({ ...errors, number: '' });
                                }}
                                className={`w-full rounded-xl border p-3 text-sm focus:ring-[#0b1c3f] focus:border-[#0b1c3f] outline-hidden ${
                                  errors.number ? 'border-red-500 bg-red-50/10' : 'border-gray-200'
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
                                className="rounded text-[#0b1c3f] focus:ring-[#0b1c3f] h-4 w-4"
                              />
                              <span className="text-[10px] text-gray-600 font-bold select-none">
                                💾 Salvar este endereço na minha conta para os próximos pedidos
                              </span>
                            </label>
                          )}
                        </>
                      )}

                      {/* Log in prompt banner for guest checkout */}
                      {!currentUser && (
                        <div className="bg-[#0b1c3f]/5 border border-[#d4af37]/20 rounded-xl p-3 text-[11px] text-[#0b1c3f] leading-snug text-left font-semibold">
                          🔑 <span className="font-extrabold">Quer salvar seus endereços?</span> Faça login ou crie uma conta para salvar seus locais favoritos (Casa, Trabalho) e fazer pedidos mais rápido!
                        </div>
                      )}

                      {/* Reference point */}
                      <div className="text-left">
                        <label className="text-xs font-bold text-gray-700 block mb-1">Ponto de Referência</label>
                        <input
                          type="text"
                          placeholder="Ex: Próximo à praça de eventos"
                          value={customer.reference}
                          onChange={(e) => setCustomer({ ...customer, reference: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-red-500 focus:border-red-500 outline-hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-xs text-left">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-55 pb-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span>Forma de Pagamento</span>
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  {/* Pix */}
                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      customer.paymentMethod === 'pix'
                        ? 'border-[#0b1c3f] bg-[#0b1c3f]/5'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      checked={customer.paymentMethod === 'pix'}
                      onChange={() => setCustomer({ ...customer, paymentMethod: 'pix' })}
                      className="w-4 h-4 text-[#0b1c3f] focus:ring-[#0b1c3f]"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-800 leading-none">🌀 Pix</span>
                      <span className="text-[9px] text-gray-400 mt-1 leading-none">Rápido e seguro</span>
                    </div>
                  </label>

                  {/* Dinheiro */}
                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      customer.paymentMethod === 'cash'
                        ? 'border-[#0b1c3f] bg-[#0b1c3f]/5'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      checked={customer.paymentMethod === 'cash'}
                      onChange={() => setCustomer({ ...customer, paymentMethod: 'cash' })}
                      className="w-4 h-4 text-[#0b1c3f] focus:ring-[#0b1c3f]"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-800 leading-none">💵 Dinheiro</span>
                      <span className="text-[9px] text-gray-400 mt-1 leading-none">Pagar na entrega</span>
                    </div>
                  </label>

                  {/* Crédito */}
                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      customer.paymentMethod === 'credit'
                        ? 'border-[#0b1c3f] bg-[#0b1c3f]/5'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      checked={customer.paymentMethod === 'credit'}
                      onChange={() => setCustomer({ ...customer, paymentMethod: 'credit' })}
                      className="w-4 h-4 text-[#0b1c3f] focus:ring-[#0b1c3f]"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-800 leading-none">💳 Crédito</span>
                      <span className="text-[9px] text-gray-400 mt-1 leading-none">Levar maquininha</span>
                    </div>
                  </label>

                  {/* Débito */}
                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      customer.paymentMethod === 'debit'
                        ? 'border-[#0b1c3f] bg-[#0b1c3f]/5'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      checked={customer.paymentMethod === 'debit'}
                      onChange={() => setCustomer({ ...customer, paymentMethod: 'debit' })}
                      className="w-4 h-4 text-[#0b1c3f] focus:ring-[#0b1c3f]"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-800 leading-none">💳 Débito</span>
                      <span className="text-[9px] text-gray-400 mt-1 leading-none">Levar maquininha</span>
                    </div>
                  </label>
                </div>

                {/* Pix instructions */}
                {customer.paymentMethod === 'pix' && (
                  <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 text-xs flex gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Chave Celular Pix da Vovó!</span>
                      <p className="mt-0.5 leading-snug">
                        Após enviar o pedido, enviaremos os dados do Pix. Chave celular para transferência:{' '}
                        <span className="font-bold underline text-emerald-900">{RESTAURANT_INFO.phone}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Cash change field */}
                {customer.paymentMethod === 'cash' && (
                  <div className="mt-3 text-left animate-fade-in">
                    <label className="text-xs font-bold text-gray-700 block mb-1">Precisa de troco para quanto?</label>
                    <input
                      type="text"
                      placeholder="Ex: R$ 50, R$ 100"
                      value={customer.changeFor}
                      onChange={(e) => setCustomer({ ...customer, changeFor: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-red-500 focus:border-red-500 outline-hidden"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer Summary & Send Button */}
        {cartItems.length > 0 && (
          <div className="bg-white border-t border-gray-100 p-5 shrink-0 space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between text-gray-500">
                <span>Subtotal dos itens</span>
                <span>{formatPrice(itemsSubtotal)}</span>
              </div>
              {customer.deliveryType === 'delivery' && (
                <div className="flex items-center justify-between text-gray-500">
                  <span>Taxa de Entrega ({customer.neighborhood})</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
              )}
              <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-gray-900 font-extrabold text-lg">
                <span>Total do Pedido</span>
                <span className="text-[#0b1c3f]">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* Clear Cart link */}
            <div className="text-center">
              <button
                onClick={() => {
                  if (confirm('Tem certeza que deseja esvaziar o carrinho?')) {
                    onClearCart();
                  }
                }}
                className="text-xs text-gray-400 hover:text-[#0b1c3f] underline font-medium transition"
              >
                Limpar carrinho de compras
              </button>
            </div>

            {/* Submit Order to WhatsApp Button */}
            <button
              id="btn-send-whatsapp-order"
              onClick={handleSendOrder}
              className="w-full flex items-center justify-center gap-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 py-4 px-6 text-base font-bold text-white transition shadow-lg active:scale-98 transform hover:scale-101"
            >
              <Send className="w-5 h-5 fill-white" />
              <span>Enviar Pedido pelo WhatsApp</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
