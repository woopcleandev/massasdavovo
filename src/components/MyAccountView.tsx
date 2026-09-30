import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { NEIGHBORHOODS, Order, OrderStatus } from '../types';
import { RESTAURANT_INFO } from '../data';
import { OrderReceiptModal } from './OrderReceiptModal';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { normalizePhoneNumber, arePhonesEqual, formatWhatsappDisplay } from '../utils/phone';
import { formatExactDateTime } from '../utils/date';
import { formatPrice } from '../utils/format';
import { 
  User, Lock, Phone, MapPin, Plus, Trash2, LogOut, 
  Home, Briefcase, Tag, Sparkles, CheckCircle, AlertCircle, Loader2,
  Sun, Moon, Monitor, Palette, Clock, ChefHat, Bike, Check, XCircle,
  Receipt, MessageCircle, ChevronRight, Package, ArrowUpRight, Calendar,
  ShieldCheck, RefreshCw
} from 'lucide-react';

export const MyAccountView: React.FC = () => {
  const { 
    currentUser, 
    userProfile, 
    savedAddresses, 
    registerWithWhatsapp, 
    loginWithWhatsapp, 
    logout, 
    updateUserProfile, 
    addSavedAddress, 
    deleteSavedAddress 
  } = useAuth();

  const { orders, settings } = useCompany();
  const { themeMode, setThemeMode, resolvedTheme } = useTheme();

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Auth Form Fields
  const [whatsapp, setWhatsapp] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [name, setName] = useState('');

  // Address Form Fields
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState(NEIGHBORHOODS[0].name);
  const [label, setLabel] = useState<'casa' | 'trabalho' | 'outro'>('casa');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');

  // Order Receipt Modal
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // General States
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Optional manual phone lookup for guest order tracking
  const [lookupPhone, setLookupPhone] = useState('');

  const formatDate = (iso: string) => {
    return formatExactDateTime(iso);
  };

  // Filter orders relevant to this user
  const userOrders = useMemo(() => {
    let localSavedIds: string[] = [];
    try {
      localSavedIds = JSON.parse(localStorage.getItem('vovo_my_order_ids') || '[]');
    } catch (e) {
      console.error(e);
    }

    const currentWa = userProfile?.whatsapp || '';
    const currentName = (userProfile?.name || '').trim().toLowerCase();
    const queryWa = normalizePhoneNumber(lookupPhone);
    const queryTrimmed = lookupPhone.trim().toLowerCase();

    return orders.filter(o => {
      // 1. If user is logged in and order has their customerId
      if (currentUser?.uid && o.customerId === currentUser.uid) {
        return true;
      }

      // 2. If user is logged in and order matches their registered WhatsApp
      if (currentWa && arePhonesEqual(o.customerPhone, currentWa)) {
        return true;
      }

      // 3. If order ID or orderNumber was generated on this device
      if (localSavedIds.includes(o.id) || localSavedIds.includes(o.orderNumber)) {
        return true;
      }

      // 4. If user is searching by phone or comanda number
      if (queryWa && (normalizePhoneNumber(o.customerPhone) === queryWa || normalizePhoneNumber(o.customerPhone).includes(queryWa))) {
        return true;
      }
      if (queryTrimmed && (o.orderNumber.toLowerCase().includes(queryTrimmed) || o.id.toLowerCase().includes(queryTrimmed))) {
        return true;
      }

      // 5. If user is logged in and name matches
      if (currentName && o.customerName.trim().toLowerCase() === currentName) {
        return true;
      }

      return false;
    });
  }, [orders, currentUser, userProfile, lookupPhone]);

  // Auto-link any past orders made with this phone number to the user's account in Firestore
  useEffect(() => {
    if (!currentUser?.uid || !userProfile?.whatsapp) return;
    const userPhone = userProfile.whatsapp;

    orders.forEach(async (ord) => {
      if (!ord.customerId && arePhonesEqual(ord.customerPhone, userPhone)) {
        try {
          const ordRef = doc(db, 'orders', ord.id);
          await updateDoc(ordRef, { 
            customerId: currentUser.uid,
            customerPhoneClean: normalizePhoneNumber(userPhone)
          });
        } catch (e) {
          // silently continue
        }
      }
    });
  }, [currentUser, userProfile, orders]);

  const clearForm = () => {
    setWhatsapp('');
    setPin('');
    setConfirmPin('');
    setName('');
    setMessage(null);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (authMode === 'login') {
        if (!whatsapp || !pin) {
          throw new Error('Preencha seu WhatsApp e o seu PIN de 4 dígitos.');
        }
        await loginWithWhatsapp(whatsapp, pin);
        clearForm();
      } else {
        if (!name.trim()) {
          throw new Error('Informe seu nome completo.');
        }
        if (!whatsapp || !pin) {
          throw new Error('Preencha o WhatsApp e o PIN de 4 dígitos.');
        }
        if (pin.length !== 4) {
          throw new Error('O PIN de segurança deve ter exatamente 4 números.');
        }
        if (pin !== confirmPin) {
          throw new Error('Os PINs digitados não são idênticos.');
        }

        await registerWithWhatsapp(name, whatsapp, pin);
        clearForm();
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Erro durante a autenticação.' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!editName.trim()) throw new Error('Nome não pode estar vazio.');
      await updateUserProfile(editName, editWhatsapp);
      setIsEditingProfile(false);
      setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao atualizar dados.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!street.trim() || street.length < 3) throw new Error("Insira um endereço válido.");
      if (!number.trim()) throw new Error("Insira o número.");
      
      await addSavedAddress({
        street,
        number,
        complement,
        neighborhood,
        label
      });

      // Reset address fields
      setStreet('');
      setNumber('');
      setComplement('');
      setLabel('casa');
      setIsAddingAddress(false);
      setMessage({ type: 'success', text: 'Novo endereço salvo com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Erro ao salvar endereço." });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este endereço?")) return;
    setLoading(true);
    try {
      await deleteSavedAddress(id);
      setMessage({ type: 'success', text: 'Endereço removido!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: "Erro ao remover endereço." });
    } finally {
      setLoading(false);
    }
  };

  const startEditProfile = () => {
    if (userProfile) {
      setEditName(userProfile.name);
      setEditWhatsapp(userProfile.whatsapp);
      setIsEditingProfile(true);
    }
  };

  // Helper for Order Status Configuration & Multi-Step Progress
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'novo':
        return {
          label: 'Recebido na Cozinha',
          step: 1,
          color: 'text-amber-700 bg-amber-100 border-amber-300 dark:text-amber-400 dark:bg-amber-400/10 dark:border-amber-400/30',
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/40',
          icon: Clock,
          desc: 'Aguardando confirmação do pagamento / preparo.'
        };
      case 'preparo':
        return {
          label: 'Em Preparo Artesanal',
          step: 2,
          color: 'text-orange-700 bg-orange-100 border-orange-300 dark:text-orange-400 dark:bg-orange-400/10 dark:border-orange-400/30',
          badgeBg: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-400/40',
          icon: ChefHat,
          desc: 'Nossa equipe está montando sua massa fresquinha!'
        };
      case 'entrega':
        return {
          label: 'Saiu para Entrega',
          step: 3,
          color: 'text-sky-700 bg-sky-100 border-sky-300 dark:text-sky-400 dark:bg-sky-400/10 dark:border-sky-400/30',
          badgeBg: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-400/40',
          icon: Bike,
          desc: 'O entregador já está a caminho com seu pedido.'
        };
      case 'concluido':
        return {
          label: 'Entregue / Concluído',
          step: 4,
          color: 'text-emerald-700 bg-emerald-100 border-emerald-300 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/30',
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/40',
          icon: Check,
          desc: 'Pedido entregue com carinho. Bom apetite!'
        };
      case 'cancelado':
        return {
          label: 'Cancelado',
          step: 0,
          color: 'text-rose-700 bg-rose-100 border-rose-300 dark:text-red-400 dark:bg-red-400/10 dark:border-red-400/30',
          badgeBg: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-400/40',
          icon: XCircle,
          desc: 'Este pedido foi cancelado.'
        };
      default:
        return {
          label: status,
          step: 1,
          color: 'text-stone-700 bg-stone-100 border-stone-300 dark:text-gray-400 dark:bg-gray-400/10 dark:border-gray-400/30',
          badgeBg: 'bg-stone-100 text-stone-900 border-stone-300 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-400/40',
          icon: Clock,
          desc: ''
        };
    }
  };

  // Reusable Orders History & Real-Time Tracking Panel
  const renderOrdersHistory = () => {
    return (
      <div className="dark-glass-panel rounded-3xl p-5 sm:p-7 border border-stone-200 dark:border-white/10 shadow-xl text-left space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-stone-900 dark:text-white flex items-center gap-2">
                <span>Meus Pedidos & Status em Tempo Real</span>
                <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-400/20 dark:text-amber-300 dark:border-amber-400/30 px-2 py-0.5 rounded-full">
                  {userOrders.length}
                </span>
              </h3>
              <p className="text-xs text-stone-600 dark:text-gray-400 mt-0.5 font-medium">
                Acompanhe o andamento da sua comanda diretamente pela cozinha
              </p>
            </div>
          </div>

          {/* Quick filter by phone if needed */}
          {!currentUser && (
            <div className="w-full sm:w-auto">
              <input
                type="tel"
                placeholder="Buscar por telefone..."
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                className="w-full sm:w-48 rounded-xl bg-white dark:bg-white/5 border border-stone-300 dark:border-white/10 px-3 py-1.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-gray-500 focus:border-amber-500 outline-none"
              />
            </div>
          )}
        </div>

        {/* Guest Tracking Explanation Note */}
        {!currentUser && (
          <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4 text-xs space-y-1.5 text-stone-800 dark:text-amber-200">
            <div className="flex items-center gap-2 font-black text-amber-900 dark:text-amber-300">
              <MessageCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Acompanhamento para Clientes sem Login</span>
            </div>
            <p className="text-[11px] text-stone-700 dark:text-amber-200/90 leading-relaxed">
              Os pedidos realizados por clientes visitantes são salvos diretamente no banco de dados da cozinha e o acompanhamento do preparo/entrega é feito <strong>diretamente no WhatsApp da Massas da Vovó</strong>. Para ter histórico unificado em qualquer aparelho e salvar seus endereços, crie sua conta acima!
            </p>
          </div>
        )}

        {userOrders.length === 0 ? (
          <div className="text-center py-10 dark-glass-card border border-dashed border-stone-200 dark:border-white/10 rounded-2xl p-6">
            <span className="text-4xl block mb-2">🍝</span>
            <h4 className="text-sm font-black text-stone-900 dark:text-white">Nenhum pedido encontrado</h4>
            <p className="text-xs text-stone-600 dark:text-gray-400 mt-1 max-w-xs mx-auto font-medium">
              {currentUser 
                ? 'Você ainda não realizou pedidos com esta conta. Escolha suas massas no cardápio e monte sua refeição!'
                : 'Se você acabou de fazer um pedido pelo WhatsApp ou sacola, busque pelo seu telefone ou número da comanda acima.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {userOrders.map((ord) => {
              const statusCfg = getStatusConfig(ord.status);
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={ord.id}
                  className="dark-glass-card border border-stone-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3.5 transition-all hover:border-amber-500/40"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 dark:border-white/10 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-black text-amber-800 dark:text-amber-400">
                        {ord.orderNumber}
                      </span>
                      <span className="text-xs text-stone-400 dark:text-white/40">•</span>
                      <span className="text-xs text-stone-600 dark:text-gray-300 font-semibold">{formatDate(ord.createdAt)}</span>
                      {ord.schedule?.isScheduled && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/40">
                          <Calendar className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                          <span>Agendado: {ord.schedule.displayLabel}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${statusCfg.badgeBg}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{statusCfg.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Stepper Progress Bar (for active orders) */}
                  {ord.status !== 'cancelado' && (
                    <div className="pt-1">
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center text-[10px] sm:text-[11px] font-bold">
                        <div className={`p-2 rounded-xl border transition-all ${statusCfg.step >= 1 ? 'bg-amber-100 text-amber-950 border-amber-400 font-black dark:bg-amber-400/20 dark:text-amber-300 dark:border-amber-400/40' : 'bg-stone-100 dark:bg-white/5 text-stone-400 dark:text-gray-500 border-stone-200 dark:border-white/5'}`}>
                          1. Recebido
                        </div>
                        <div className={`p-2 rounded-xl border transition-all ${statusCfg.step >= 2 ? 'bg-orange-100 text-orange-950 border-orange-400 font-black dark:bg-orange-400/20 dark:text-orange-300 dark:border-orange-400/40' : 'bg-stone-100 dark:bg-white/5 text-stone-400 dark:text-gray-500 border-stone-200 dark:border-white/5'}`}>
                          2. Preparo
                        </div>
                        <div className={`p-2 rounded-xl border transition-all ${statusCfg.step >= 3 ? 'bg-sky-100 text-sky-950 border-sky-400 font-black dark:bg-sky-400/20 dark:text-sky-300 dark:border-sky-400/40' : 'bg-stone-100 dark:bg-white/5 text-stone-400 dark:text-gray-500 border-stone-200 dark:border-white/5'}`}>
                          3. Em Rota
                        </div>
                        <div className={`p-2 rounded-xl border transition-all ${statusCfg.step >= 4 ? 'bg-emerald-100 text-emerald-950 border-emerald-400 font-black dark:bg-emerald-400/20 dark:text-emerald-300 dark:border-emerald-400/40' : 'bg-stone-100 dark:bg-white/5 text-stone-400 dark:text-gray-500 border-stone-200 dark:border-white/5'}`}>
                          4. Entregue
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-700 dark:text-gray-300 font-medium mt-2 text-center">
                        {statusCfg.desc}
                      </p>
                    </div>
                  )}

                  {/* Items list preview */}
                  <div className="bg-stone-100 dark:bg-black/40 rounded-2xl p-4 border border-stone-200 dark:border-white/10 space-y-2 text-xs">
                    <div className="text-[10px] font-black text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Itens do Pedido:
                    </div>
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2">
                        <span className="truncate text-stone-900 dark:text-stone-100 font-medium">
                          <strong className="text-amber-800 dark:text-amber-400 font-black">{it.quantity}x</strong> {it.productName}
                          {it.size ? ` (${it.size})` : ''}
                        </span>
                        <span className="font-mono text-stone-900 dark:text-amber-300 font-bold shrink-0">
                          {formatPrice(it.totalPrice)}
                        </span>
                      </div>
                    ))}

                    <div className="pt-2 border-t border-stone-300 dark:border-white/10 flex items-center justify-between font-black text-sm text-stone-900 dark:text-white">
                      <span>Total ({ord.deliveryType === 'delivery' ? 'Entrega' : 'Retirada'})</span>
                      <span className="text-amber-800 dark:text-amber-400 font-mono text-base font-black">{formatPrice(ord.grandTotal)}</span>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                      {ord.deliveryType === 'delivery' ? (
                        <span>📍 Entrega em: <strong className="text-stone-900 dark:text-white">{ord.neighborhood}</strong></span>
                      ) : (
                        <span>🏪 Retirada no balcão da Vovó</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedReceiptOrder(ord)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/10 text-xs font-black text-stone-900 dark:text-white transition cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                        <span>Ver Comanda</span>
                      </button>

                      <a
                        href={`https://api.whatsapp.com/send?phone=${(settings.whatsappNumber || RESTAURANT_INFO.whatsappNumber).replace(/\D/g, '')}&text=${encodeURIComponent(`Olá! Gostaria de acompanhar o status da minha comanda *${ord.orderNumber}*.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Reusable Theme Selector Component
  const renderThemeSelector = () => {
    const options: { mode: ThemeMode; label: string; desc: string; icon: any }[] = [
      {
        mode: 'light',
        label: 'Versão Clara',
        desc: 'Tons quentes e suaves de marfim e ouro',
        icon: Sun,
      },
      {
        mode: 'dark',
        label: 'Versão Escura',
        desc: 'Obsidian líquido e vidro escuro refinado',
        icon: Moon,
      },
      {
        mode: 'system',
        label: 'Automático',
        desc: 'Acompanha o tema do seu celular/computador',
        icon: Monitor,
      },
    ];

    return (
      <div className="dark-glass-panel rounded-3xl p-5 sm:p-7 border border-stone-200 dark:border-white/10 shadow-xl text-left">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight text-stone-900 dark:text-white">
              Aparência do Aplicativo
            </h3>
            <p className="text-xs text-stone-600 dark:text-gray-400 mt-0.5 font-medium">
              Escolha a sua versão de visualização favorita (Clara, Escura ou Automática)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = themeMode === opt.mode;

            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => setThemeMode(opt.mode)}
                className={`flex flex-col items-start p-4 rounded-2xl border transition-all cursor-pointer text-left select-none ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/90 dark:bg-amber-400/15 shadow-md ring-2 ring-amber-400/50 text-stone-950 dark:text-white'
                    : 'border-stone-200 dark:border-white/10 bg-stone-50/80 dark:bg-white/5 hover:border-amber-400/50 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`p-2 rounded-xl ${isSelected ? 'bg-amber-400 text-black shadow-xs' : 'bg-stone-200 dark:bg-white/10 text-stone-800 dark:text-white'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 dark:text-amber-300 bg-amber-200 dark:bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/50">
                      Ativo
                    </span>
                  )}
                </div>
                <span className="text-sm font-black text-stone-900 dark:text-white leading-tight">
                  {opt.label}
                </span>
                <span className="text-[11px] text-stone-600 dark:text-gray-400 mt-1 leading-snug font-medium">
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // 1. GUEST VIEW (NOT LOGGED IN)
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 mt-2">
        {/* Auth Box */}
        <div className="dark-glass-panel border border-stone-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-500/10 dark:bg-amber-400/10 text-amber-700 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-stone-900 dark:text-white">
              {authMode === 'login' ? 'Entre na sua Conta' : 'Crie sua Conta Única'}
            </h2>
            <p className="text-xs text-stone-600 dark:text-gray-300 mt-1 max-w-xs mx-auto leading-relaxed font-medium">
              {authMode === 'login' 
                ? 'Sua conta única unifica seus pedidos e endereços ao seu WhatsApp em qualquer celular, computador ou app.' 
                : 'Cadastre-se com seu WhatsApp e crie um PIN de 4 dígitos para acessar seu histórico em qualquer aparelho.'}
            </p>
          </div>

          {message && (
            <div className={`mb-5 p-4 rounded-2xl border flex gap-2.5 text-xs text-left leading-relaxed ${
              message.type === 'success' 
                ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/20' 
                : 'bg-rose-100 dark:bg-red-500/10 text-rose-900 dark:text-red-300 border-rose-300 dark:border-red-500/20'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700 dark:text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700 dark:text-red-400" />}
              <span className="font-semibold">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
            {authMode === 'register' && (
              <div>
                <label className="text-xs font-bold block mb-1 text-stone-800 dark:text-stone-200">Seu Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400 dark:text-stone-500" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Maria Souza"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl bg-white dark:bg-white/5 border border-stone-300 dark:border-white/10 py-3 pl-10 pr-4 text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-gray-500 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* WhatsApp Field */}
            <div>
              <label className="text-xs font-bold block mb-1 text-stone-800 dark:text-stone-200">Seu WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400 dark:text-stone-500" />
                <input
                  type="tel"
                  required
                  placeholder="Ex: (66) 99652-3006"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full rounded-2xl bg-white dark:bg-white/5 border border-stone-300 dark:border-white/10 py-3 pl-10 pr-4 text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-gray-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* PIN de 4 dígitos */}
            <div>
              <label className="text-xs font-bold block mb-1 text-stone-800 dark:text-stone-200">PIN de 4 dígitos</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400 dark:text-stone-500" />
                <input
                  type="password"
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="Ex: 1234"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-2xl bg-white dark:bg-white/5 border border-stone-300 dark:border-white/10 py-3 pl-10 pr-4 text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-gray-500 focus:border-amber-500 outline-none font-mono text-base tracking-widest"
                />
              </div>
            </div>

            {authMode === 'register' && (
              <div>
                <label className="text-xs font-bold block mb-1 text-stone-800 dark:text-stone-200">Confirmar PIN de 4 dígitos</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400 dark:text-stone-500" />
                  <input
                    type="password"
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    placeholder="Ex: 1234"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-2xl bg-white dark:bg-white/5 border border-stone-300 dark:border-white/10 py-3 pl-10 pr-4 text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-gray-500 focus:border-amber-500 outline-none font-mono text-base tracking-widest"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-full dark-glass-button-gold font-black py-3.5 px-6 transition-all shadow-md active:scale-98 mt-6 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
              ) : (
                <span>{authMode === 'login' ? 'Entrar Agora' : 'Criar Conta Grátis'}</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-stone-200 dark:border-white/10 text-center">
            <p className="text-xs text-stone-600 dark:text-gray-400 font-medium">
              {authMode === 'login' ? 'Não possui uma conta?' : 'Já possui uma conta?'}
              <button
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setMessage(null);
                }}
                className="text-amber-800 dark:text-amber-400 hover:underline font-black ml-1.5 cursor-pointer"
              >
                {authMode === 'login' ? 'Cadastre-se aqui' : 'Entre por aqui'}
              </button>
            </p>
          </div>
        </div>

        {/* Orders History & Live Tracking */}
        {renderOrdersHistory()}

        {/* Theme Selector */}
        {renderThemeSelector()}

        {/* Receipt modal */}
        {selectedReceiptOrder && (
          <OrderReceiptModal
            order={selectedReceiptOrder}
            onClose={() => setSelectedReceiptOrder(null)}
          />
        )}
      </div>
    );
  }

  // 2. LOGGED IN CUSTOMER DASHBOARD
  return (
    <div className="max-w-2xl mx-auto space-y-6 mt-2">
      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-2xl border flex gap-2.5 text-xs text-left leading-relaxed ${
          message.type === 'success' 
            ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/20' 
            : 'bg-rose-100 dark:bg-red-500/10 text-rose-900 dark:text-red-300 border-rose-300 dark:border-red-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700 dark:text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700 dark:text-red-400" />}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      {/* Customer profile details panel */}
      <div className="dark-glass-panel rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 dark:bg-amber-400/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-xl shrink-0">
              {userProfile?.name?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || 'V'}
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <h2 className="text-xl font-extrabold text-stone-900 dark:text-white">{userProfile?.name || 'Cliente da Vovó'}</h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/30 rounded-full px-2.5 py-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                  <span>Conta Nuvem Conectada</span>
                </span>
              </div>
              <p className="text-xs text-stone-800 dark:text-stone-200 mt-1 font-bold flex items-center gap-1.5 justify-center sm:justify-start">
                <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>WhatsApp: <strong>{formatWhatsappDisplay(userProfile?.whatsapp || '') || 'Não informado'}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {!isEditingProfile ? (
              <button
                onClick={startEditProfile}
                className="rounded-full border border-stone-300 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/10 font-black text-xs py-2 px-4 transition text-stone-900 dark:text-white cursor-pointer"
              >
                Editar Perfil
              </button>
            ) : (
              <button
                onClick={() => setIsEditingProfile(false)}
                className="rounded-full border border-stone-300 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/10 font-black text-xs py-2 px-4 transition text-stone-900 dark:text-white cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={logout}
              className="rounded-full bg-rose-100 dark:bg-red-500/10 hover:bg-rose-200 dark:hover:bg-red-500/20 text-rose-800 dark:text-red-300 font-black text-xs py-2 px-4 transition flex items-center gap-1.5 border border-rose-300 dark:border-red-500/20 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Editing Profile Form */}
        {isEditingProfile && (
          <form onSubmit={handleProfileUpdate} className="mt-6 pt-6 border-t border-stone-200 dark:border-white/10 space-y-4 text-left">
            <h3 className="text-xs font-black text-stone-500 dark:text-gray-400 uppercase tracking-wider">Atualizar Meus Dados</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold block mb-1 text-stone-800 dark:text-stone-200">Seu Nome</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-2xl bg-white dark:bg-white/5 border border-stone-300 dark:border-white/10 p-3 text-xs text-stone-900 dark:text-white focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold block mb-1 text-stone-800 dark:text-stone-200">WhatsApp para Contato</label>
                <input
                  type="tel"
                  required
                  value={editWhatsapp}
                  onChange={(e) => setEditWhatsapp(e.target.value)}
                  className="w-full rounded-2xl bg-white dark:bg-white/5 border border-stone-300 dark:border-white/10 p-3 text-xs text-stone-900 dark:text-white focus:border-amber-500 outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full dark-glass-button-gold text-xs font-black py-2.5 px-6 transition shadow-md cursor-pointer"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        )}
      </div>

      {/* Orders History & Live Status Section */}
      {renderOrdersHistory()}

      {/* Theme selector section */}
      {renderThemeSelector()}

      {/* Saved addresses manager panel */}
      <div className="dark-glass-panel rounded-3xl p-6 border border-stone-200 dark:border-white/10 shadow-md text-left">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-4 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              <span>Meus Endereços Salvos</span>
            </h3>
            <p className="text-xs text-stone-600 dark:text-gray-400 mt-0.5 font-medium">Gerencie os locais de entrega para agilizar seu pedido</p>
          </div>
          {!isAddingAddress && (
            <button
              onClick={() => setIsAddingAddress(true)}
              className="rounded-full dark-glass-button-gold text-xs font-black py-2.5 px-5 transition flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Adicionar</span>
            </button>
          )}
        </div>

        {/* Add Address Form Panel */}
        {isAddingAddress && (
          <form onSubmit={handleAddAddressSubmit} className="dark-glass-card border border-stone-300 dark:border-white/10 rounded-3xl p-5 mb-5 space-y-4 animate-fade-in text-left">
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-gray-300">Novo Local de Entrega</h4>
            
            <div className="space-y-3">
              {/* Neighborhood selection */}
              <div>
                <label className="text-[11px] font-bold block mb-1 text-stone-800 dark:text-stone-200">Bairro (Primavera do Leste)</label>
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full rounded-2xl border border-stone-300 dark:border-white/10 bg-white dark:bg-black/60 text-stone-900 dark:text-white p-3 text-xs focus:border-amber-500 outline-none font-medium"
                >
                  <optgroup label="📍 Faixa R$ 10,00">
                    {NEIGHBORHOODS.filter(n => n.fee === 10).map((n) => (
                      <option key={n.name} value={n.name} className="bg-stone-50 dark:bg-gray-900 text-stone-900 dark:text-white">
                        {n.name} (R$ 10,00)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="📍 Faixa R$ 15,00">
                    {NEIGHBORHOODS.filter(n => n.fee === 15).map((n) => (
                      <option key={n.name} value={n.name} className="bg-stone-50 dark:bg-gray-900 text-stone-900 dark:text-white">
                        {n.name} (R$ 15,00)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="📍 Faixa R$ 20,00">
                    {NEIGHBORHOODS.filter(n => n.fee === 20).map((n) => (
                      <option key={n.name} value={n.name} className="bg-stone-50 dark:bg-gray-900 text-stone-900 dark:text-white">
                        {n.name} (R$ 20,00)
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Street & Number */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold block mb-1 text-stone-800 dark:text-stone-200">Rua / Avenida</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Av. Porto Alegre"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full rounded-2xl border border-stone-300 dark:border-white/10 bg-white dark:bg-white/5 p-3 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-gray-500 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1 text-stone-800 dark:text-stone-200">Número</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 203"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full rounded-2xl border border-stone-300 dark:border-white/10 bg-white dark:bg-white/5 p-3 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-gray-500 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Complement */}
              <div>
                <label className="text-[11px] font-bold block mb-1 text-stone-800 dark:text-stone-200">Complemento (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Apto 302, Bloco B"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  className="w-full rounded-2xl border border-stone-300 dark:border-white/10 bg-white dark:bg-white/5 p-3 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-gray-500 focus:border-amber-500 outline-none"
                />
              </div>

              {/* Label selector (Casa, Trabalho, Outro) */}
              <div>
                <label className="text-[11px] font-bold block mb-1 text-stone-800 dark:text-stone-200">Identificação / Tipo</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLabel('casa')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 border rounded-full text-xs font-black transition cursor-pointer ${
                      label === 'casa'
                        ? 'dark-glass-button-gold text-black shadow-sm'
                        : 'bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-white/10 hover:border-amber-500/40'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Casa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabel('trabalho')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 border rounded-full text-xs font-black transition cursor-pointer ${
                      label === 'trabalho'
                        ? 'dark-glass-button-gold text-black shadow-sm'
                        : 'bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-white/10 hover:border-amber-500/40'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Trabalho</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabel('outro')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 border rounded-full text-xs font-black transition cursor-pointer ${
                      label === 'outro'
                        ? 'dark-glass-button-gold text-black shadow-sm'
                        : 'bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-white/10 hover:border-amber-500/40'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Outro</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAddingAddress(false)}
                className="rounded-full border border-stone-300 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 font-black text-xs py-2 px-5 text-stone-800 dark:text-white transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-full dark-glass-button-gold font-black text-xs py-2 px-5 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {loading && <Loader2 className="w-3 h-3 animate-spin text-black" />}
                <span>Salvar Local</span>
              </button>
            </div>
          </form>
        )}

        {/* Addresses list */}
        {savedAddresses.length === 0 ? (
          <div className="text-center py-8 dark-glass-card border border-dashed border-stone-300 dark:border-white/10 rounded-3xl p-6">
            <span className="text-3xl block mb-2">🏠</span>
            <p className="text-xs font-black text-stone-800 dark:text-stone-200">Nenhum endereço cadastrado ainda.</p>
            <p className="text-[11px] text-stone-500 dark:text-gray-400 mt-0.5 font-medium">Adicione os locais que você mais pede para agilizar sua entrega.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedAddresses.map((addr) => (
              <div 
                key={addr.id}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-stone-200 dark:border-white/10 dark-glass-card shadow-xs hover:border-amber-500/40 transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-full bg-amber-500/10 dark:bg-amber-400/10 text-amber-700 dark:text-amber-400 shrink-0 border border-amber-500/20">
                    {addr.label === 'casa' && <Home className="w-4 h-4" />}
                    {addr.label === 'trabalho' && <Briefcase className="w-4 h-4" />}
                    {addr.label === 'outro' && <Tag className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black capitalize text-amber-800 dark:text-amber-400">{addr.label}</span>
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                      <span className="text-[10px] text-stone-500 dark:text-gray-400 font-bold">{addr.neighborhood}</span>
                    </div>
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100 mt-0.5 truncate">
                      {addr.street}, Nº {addr.number}
                    </p>
                    {addr.complement && (
                      <p className="text-[10px] text-stone-600 dark:text-gray-400 mt-0.5 font-medium">Compl: {addr.complement}</p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="p-2 rounded-full text-stone-400 hover:text-rose-600 dark:hover:text-red-400 hover:bg-rose-100 dark:hover:bg-red-500/10 transition shrink-0 cursor-pointer"
                  title="Remover endereço"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt modal */}
      {selectedReceiptOrder && (
        <OrderReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
};
