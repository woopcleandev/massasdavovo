import React, { useState, useRef } from 'react';
import { useCompany } from '../context/CompanyContext';
import { CategoryId, Order, OrderStatus, Product } from '../types';
import { CATEGORIES } from '../data';
import { OrderReceiptModal } from './OrderReceiptModal';
import { formatWhatsappDisplay } from '../utils/phone';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  User, 
  LogOut, 
  TrendingUp, 
  ShoppingBag, 
  Plus, 
  Edit3, 
  Trash2, 
  Phone, 
  CreditCard, 
  Settings, 
  Image as ImageIcon, 
  Upload, 
  Eye, 
  Check, 
  AlertCircle, 
  Receipt, 
  ArrowLeft,
  Clock,
  DollarSign,
  Loader2,
  Calendar,
  ChefHat,
  Bike,
  CheckCircle,
  XCircle,
  Sparkles,
  MessageCircle
} from 'lucide-react';

const PRESET_PASTA_IMAGES = [
  { label: 'Lasanha', url: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&q=80&w=600' },
  { label: 'Nhôque', url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=600' },
  { label: 'Sorrentino / Ravioli', url: 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?auto=format&fit=crop&q=80&w=600' },
  { label: 'Capelete', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600' },
  { label: 'Molhos & Carnes', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600' },
];

interface MasterAdminViewProps {
  onBackToMenu: () => void;
}

export const MasterAdminView: React.FC<MasterAdminViewProps> = ({ onBackToMenu }) => {
  const {
    settings,
    updateSettings,
    allProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    orders,
    updateOrderStatus,
    isMasterAuth,
    loginMaster,
    logoutMaster,
    updateMasterCredentials,
  } = useCompany();

  // Login form state
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active Admin Tab
  const [adminTab, setAdminTab] = useState<'sales' | 'menu' | 'settings'>('sales');

  // Selected Order for Receipt view
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Status Filter for Orders
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Menu Category Filter
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('todos');

  // Menu item modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    categoryId: CategoryId.LASANHAS,
    description: '',
    price: '',
    image: '',
    isPopular: false,
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Settings form state
  const [productSuccess, setProductSuccess] = useState('');
  const [companyForm, setCompanyForm] = useState({
    whatsappNumber: settings.whatsappNumber,
    phone: settings.phone,
    pixKey: settings.pixKey,
    pixKeyType: settings.pixKeyType,
    pixBeneficiary: settings.pixBeneficiary,
    openDays: settings.operatingHours?.openDays || [2, 3, 4, 5, 6, 0],
    openTime: settings.operatingHours?.openTime || '18:00',
    closeTime: settings.operatingHours?.closeTime || '23:00',
    forceStatus: settings.operatingHours?.forceStatus || 'auto',
  });
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Credentials change state
  const [newUser, setNewUser] = useState(settings.adminUser || 'Admin');
  const [newPass, setNewPass] = useState(settings.adminPass || '1234');
  const [confirmPass, setConfirmPass] = useState('');
  const [credMessage, setCredMessage] = useState({ text: '', type: '' });

  const formatPrice = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const ok = loginMaster(loginUser, loginPass);
    if (!ok) {
      setLoginError('Usuário ou senha incorretos. (Padrão: Admin / 1234)');
    }
  };

  // Handle Photo Upload from Device
  const handleDeviceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setImageLoadError(false);

    const reader = new FileReader();
    reader.onerror = () => {
      setIsUploadingImage(false);
      setImageLoadError(true);
    };
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProductForm(prev => ({
        ...prev,
        image: base64String
      }));
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProduct(true);
    setProductSuccess('');

    try {
      const numPrice = parseFloat(productForm.price.replace(',', '.'));
      if (isNaN(numPrice) || numPrice <= 0) {
        alert('Por favor, informe um valor de preço válido.');
        setIsSavingProduct(false);
        return;
      }

      const defaultFallbackImage = 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=800';
      const finalImage = productForm.image.trim() || defaultFallbackImage;

      if (editingProductId) {
        await updateProduct(editingProductId, {
          name: productForm.name,
          categoryId: productForm.categoryId,
          description: productForm.description,
          price: numPrice,
          image: finalImage,
          isPopular: productForm.isPopular,
        });
        setProductSuccess(`Prato "${productForm.name}" atualizado com sucesso!`);
      } else {
        await addProduct({
          name: productForm.name,
          categoryId: productForm.categoryId,
          description: productForm.description,
          price: numPrice,
          image: finalImage,
          isPopular: productForm.isPopular,
        });
        setProductSuccess(`Novo prato "${productForm.name}" inserido no cardápio!`);
      }

      setIsProductModalOpen(false);
      setTimeout(() => setProductSuccess(''), 3500);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar prato. Tente novamente.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Open Edit Modal
  const openEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setImageLoadError(false);
    setProductForm({
      name: prod.name,
      categoryId: prod.categoryId,
      description: prod.description || '',
      price: prod.price.toString(),
      image: prod.image || '',
      isPopular: Boolean(prod.isPopular),
    });
    setIsProductModalOpen(true);
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWhatsApp = companyForm.whatsappNumber.replace(/\D/g, '');
    await updateSettings({
      whatsappNumber: cleanWhatsApp,
      phone: companyForm.phone,
      pixKey: companyForm.pixKey,
      pixKeyType: companyForm.pixKeyType,
      pixBeneficiary: companyForm.pixBeneficiary,
      operatingHours: {
        openDays: companyForm.openDays,
        openTime: companyForm.openTime,
        closeTime: companyForm.closeTime,
        forceStatus: companyForm.forceStatus as any,
      },
    });
    setSettingsSuccess('Configurações e Horários atualizados com sucesso!');
    setTimeout(() => setSettingsSuccess(''), 3500);
  };

  // Save Master Credentials
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredMessage({ text: '', type: '' });

    if (!newUser.trim() || !newPass.trim()) {
      setCredMessage({ text: 'Usuário e senha não podem ficar em branco.', type: 'error' });
      return;
    }

    if (newPass !== confirmPass) {
      setCredMessage({ text: 'A confirmação de senha não confere.', type: 'error' });
      return;
    }

    const success = await updateMasterCredentials(newUser, newPass);
    if (success) {
      setCredMessage({ text: 'Usuário e senha Master alterados com sucesso!', type: 'success' });
      setConfirmPass('');
    }
  };

  // Filter Orders
  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'todos') return true;
    return o.status === statusFilter;
  });

  // Calculate stats
  const totalRevenue = orders.reduce((acc, o) => acc + (o.status !== 'cancelado' ? o.grandTotal : 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'novo' || o.status === 'preparo').length;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'novo':
        return {
          label: 'Recebido',
          icon: Clock,
          classes: 'bg-amber-500/20 text-amber-300 border-amber-400/40'
        };
      case 'preparo':
        return {
          label: 'Em Preparo',
          icon: ChefHat,
          classes: 'bg-orange-500/20 text-orange-300 border-orange-400/40'
        };
      case 'entrega':
        return {
          label: 'Saiu p/ Entrega',
          icon: Bike,
          classes: 'bg-sky-500/20 text-sky-300 border-sky-400/40'
        };
      case 'concluido':
        return {
          label: 'Concluído',
          icon: CheckCircle,
          classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
        };
      case 'cancelado':
        return {
          label: 'Cancelado',
          icon: XCircle,
          classes: 'bg-rose-500/20 text-rose-300 border-rose-400/40'
        };
      default:
        return {
          label: status,
          icon: Clock,
          classes: 'bg-stone-500/20 text-stone-300 border-stone-400/40'
        };
    }
  };

  // 1. If not authenticated, show Master Login Card in Main Dark Luxury Style
  if (!isMasterAuth) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="dark-glass-panel rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/10 text-left animate-scale-in relative z-10">
          <div className="text-center mb-6">
            <div className="w-18 h-18 bg-amber-500/15 text-amber-400 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-amber-400/30 shadow-lg shadow-amber-500/10">
              <ShieldCheck className="w-10 h-10 text-amber-400" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Painel Master Admin</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Massas da Vovó</h1>
            <p className="text-xs text-stone-400 mt-1">Gestão Completa • Cozinha & Comandas</p>
          </div>

          {loginError && (
            <div className="bg-rose-500/15 text-rose-300 p-3.5 rounded-2xl border border-rose-400/30 text-xs font-semibold mb-5 flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-stone-300 block mb-1.5">Usuário Master</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ex: Admin"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-stone-500 text-sm focus:border-amber-400 outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-300 block mb-1.5">Senha de Acesso</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-stone-500 text-sm focus:border-amber-400 outline-none transition font-mono tracking-widest"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 dark-glass-button-gold text-black font-black rounded-full text-sm shadow-xl transition-all active:scale-98 mt-2 cursor-pointer"
            >
              Entrar no Painel Master
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <button
              onClick={onBackToMenu}
              className="inline-flex items-center gap-2 text-xs text-stone-400 hover:text-amber-300 font-bold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Cardápio Público</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Master Dashboard in Unified Luxury Style
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 text-left pb-20 relative">
      {/* Background Ambience Glow */}
      <div className="fixed top-0 left-1/3 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Rounded Header */}
      <header className="sticky top-3 z-30 max-w-6xl mx-auto px-4 pt-2">
        <div className="dark-glass-panel rounded-3xl p-4 sm:p-5 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col gap-4">
          
          {/* Top Bar: Brand, Admin Badge & Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/15 text-amber-400 rounded-2xl border border-amber-400/30 shadow-md shadow-amber-500/10 shrink-0">
                <ShieldCheck className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-black tracking-tight text-white">PAINEL MASTER</span>
                  <span className="text-[10px] bg-amber-400 text-black font-black px-2.5 py-0.5 rounded-full shadow-sm">
                    ADMIN
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Tempo Real (Firestore)
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5 font-medium">Massas da Vovó • Gestão da Cozinha & Configurações</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={onBackToMenu}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs py-2.5 px-4 rounded-full border border-white/15 transition shadow-sm cursor-pointer"
                title="Ir para o cardápio público dos clientes"
              >
                <Eye className="w-4 h-4 text-amber-400" />
                <span>Ver Cardápio</span>
              </button>

              <button
                onClick={logoutMaster}
                className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs py-2.5 px-4 rounded-full border border-rose-500/30 transition shadow-sm cursor-pointer"
                title="Sair do painel administrativo"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Sair</span>
              </button>
            </div>
          </div>

          {/* Sub-tabs Navigation: Rounded Pill Bar */}
          <div className="flex bg-black/40 p-1.5 rounded-2xl sm:rounded-full border border-white/10 gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setAdminTab('sales')}
              className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                adminTab === 'sales'
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Histórico de Vendas & Comandas</span>
              {pendingOrders > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${adminTab === 'sales' ? 'bg-black text-amber-300' : 'bg-amber-400 text-black'}`}>
                  {pendingOrders}
                </span>
              )}
            </button>

            <button
              onClick={() => setAdminTab('menu')}
              className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                adminTab === 'menu'
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cardápio & Novos Pratos</span>
            </button>

            <button
              onClick={() => setAdminTab('settings')}
              className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                adminTab === 'settings'
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Configurações & Chave PIX</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-6 mt-2">
        
        {/* ============================================================ */}
        {/* TAB 1: HISTÓRICO DE VENDAS & COMANDAS */}
        {/* ============================================================ */}
        {adminTab === 'sales' && (
          <div className="space-y-6 animate-fade-in">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Stat 1: Total Pedidos */}
              <div className="dark-glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl flex items-center gap-4.5 hover:border-amber-500/30 transition">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-400/30 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
                  <ShoppingBag className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Total de Pedidos</span>
                  <p className="text-3xl font-black text-white mt-0.5">{orders.length}</p>
                </div>
              </div>

              {/* Stat 2: Faturamento */}
              <div className="dark-glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl flex items-center gap-4.5 hover:border-emerald-500/30 transition">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shadow-lg shadow-emerald-500/10 shrink-0">
                  <DollarSign className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Faturamento Registrado</span>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5">{formatPrice(totalRevenue)}</p>
                </div>
              </div>

              {/* Stat 3: Pendentes */}
              <div className="dark-glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl flex items-center gap-4.5 hover:border-orange-500/30 transition">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/15 text-orange-400 border border-orange-400/30 flex items-center justify-center shadow-lg shadow-orange-500/10 shrink-0">
                  <Clock className="w-7 h-7 text-orange-400" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Pedidos Pendentes</span>
                  <p className="text-3xl font-black text-orange-400 mt-0.5">{pendingOrders}</p>
                </div>
              </div>
            </div>

            {/* Orders Header & Filter Bar */}
            <div className="dark-glass-panel p-5 rounded-3xl border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <span>Pedidos Recebidos</span>
                  <span className="text-[10px] font-black bg-amber-400 text-black px-2 py-0.5 rounded-full">
                    {filteredOrders.length}
                  </span>
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">Acompanhamento, alteração de status e impressão de comandas</p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'novo', label: 'Novo' },
                  { id: 'preparo', label: 'Preparo' },
                  { id: 'entrega', label: 'Entrega' },
                  { id: 'concluido', label: 'Concluído' },
                  { id: 'cancelado', label: 'Cancelado' }
                ].map(st => (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                      statusFilter === st.id
                        ? 'bg-amber-400 text-black font-black shadow-md shadow-amber-500/20'
                        : 'bg-white/5 text-stone-300 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="dark-glass-panel p-12 rounded-3xl border border-dashed border-white/10 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-stone-500 border border-white/10">
                  <Receipt className="w-8 h-8 text-stone-400" />
                </div>
                <h3 className="text-sm font-black text-white">Nenhum pedido nesta categoria</h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
                  Os pedidos finalizados pelos clientes aparecerão aqui automaticamente via Firestore em tempo real.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((ord) => {
                  const statusInfo = getStatusBadge(ord.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div
                      key={ord.id}
                      className="dark-glass-card rounded-3xl border border-white/10 p-5 sm:p-6 shadow-xl hover:border-amber-500/40 transition space-y-4 text-left"
                    >
                      {/* Top Bar: Comanda, Status Badge, Delivery Type, Schedule */}
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-base text-amber-400 bg-black/40 px-3 py-1 rounded-xl border border-amber-400/30">
                              {ord.orderNumber}
                            </span>
                            
                            {/* Status Badge */}
                            <span className={`inline-flex items-center gap-1 text-[11px] font-black uppercase px-2.5 py-1 rounded-full border ${statusInfo.classes}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              <span>{statusInfo.label}</span>
                            </span>

                            {/* Delivery or Takeaway */}
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                              ord.deliveryType === 'delivery' 
                                ? 'bg-sky-500/15 text-sky-300 border-sky-400/30' 
                                : 'bg-orange-500/15 text-orange-300 border-orange-400/30'
                            }`}>
                              {ord.deliveryType === 'delivery' ? '🚀 Entrega' : '🏪 Retirada'}
                            </span>

                            {/* Scheduled order highlight */}
                            {ord.schedule?.isScheduled && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full">
                                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                <span>Agendado: {ord.schedule.displayLabel}</span>
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-stone-300 font-medium pt-1 flex items-center gap-2 flex-wrap">
                            <span>Cliente: <strong className="text-white font-bold">{ord.customerName}</strong></span>
                            <span>•</span>
                            <a
                              href={`https://wa.me/55${(ord.customerPhone || '').replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{formatWhatsappDisplay(ord.customerPhone)}</span>
                            </a>
                            <span>•</span>
                            <span className="text-stone-400">{formatDate(ord.createdAt)}</span>
                          </p>
                        </div>

                        {/* Right: Total Amount & Ver Comanda Button */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-stone-400 block font-bold uppercase">Valor Total</span>
                            <span className="text-lg font-black text-amber-400">{formatPrice(ord.grandTotal)}</span>
                          </div>
                          
                          <button
                            onClick={() => setReceiptOrder(ord)}
                            className="flex items-center gap-2 dark-glass-button-gold text-black font-black text-xs py-2.5 px-4 rounded-full shadow-lg transition active:scale-98 cursor-pointer"
                          >
                            <Receipt className="w-4 h-4 text-black" />
                            <span>Ver Comanda</span>
                          </button>
                        </div>
                      </div>

                      {/* Middle: Order Items & Payment/Address details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                        {/* Items */}
                        <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2">
                          <span className="text-[10px] text-amber-400/90 font-black uppercase tracking-wider block">
                            Itens do Pedido ({ord.items.length})
                          </span>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="text-stone-200 leading-snug">
                                <span className="font-bold text-amber-300">{it.quantity}x</span>{' '}
                                <span className="font-semibold text-white">{it.productName}</span>
                                {it.notes && (
                                  <div className="text-rose-300 text-[11px] italic bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                                    Obs: "{it.notes}"
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Payment & Delivery Address */}
                        <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2">
                          <span className="text-[10px] text-amber-400/90 font-black uppercase tracking-wider block">
                            Pagamento & Entrega
                          </span>
                          <div className="space-y-1 text-stone-200">
                            <p>
                              <strong className="text-stone-400">Forma:</strong>{' '}
                              <span className="font-semibold text-white">
                                {ord.paymentMethod === 'pix_now' ? '🌀 PIX Antecipado' :
                                 ord.paymentMethod === 'pix_delivery' ? '📱 PIX na Entrega' :
                                 ord.paymentMethod === 'cash' ? `💵 Dinheiro (Troco: ${ord.changeFor || 'Não'})` :
                                 ord.paymentMethod === 'credit' ? '💳 Cartão de Crédito' : '💳 Cartão de Débito'}
                              </span>
                            </p>
                            {ord.deliveryType === 'delivery' && (
                              <p className="text-stone-300 leading-snug">
                                <strong className="text-stone-400">Endereço:</strong>{' '}
                                {ord.street}, {ord.number} - {ord.neighborhood}
                                {ord.reference && <span className="text-stone-400 block text-[11px] mt-0.5">Ref: {ord.reference}</span>}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom: Fast Status Changer Pills */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
                        <span className="text-stone-400 font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Mudar Status do Pedido:</span>
                        </span>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {([
                            { st: 'novo', label: '1. Recebido' },
                            { st: 'preparo', label: '2. Preparo' },
                            { st: 'entrega', label: '3. Em Rota' },
                            { st: 'concluido', label: '4. Concluído' },
                            { st: 'cancelado', label: 'Cancelar' }
                          ] as { st: OrderStatus; label: string }[]).map(item => (
                            <button
                              key={item.st}
                              onClick={() => updateOrderStatus(ord.id, item.st)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                                ord.status === item.st
                                  ? item.st === 'concluido'
                                    ? 'bg-emerald-400 text-black font-black shadow-md'
                                    : item.st === 'cancelado'
                                    ? 'bg-rose-500 text-white font-black shadow-md'
                                    : 'bg-amber-400 text-black font-black shadow-md'
                                  : 'bg-white/5 hover:bg-white/15 text-stone-300 border border-white/10'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: GERENCIAR CARDÁPIO & NOVOS PRATOS */}
        {/* ============================================================ */}
        {adminTab === 'menu' && (
          <div className="space-y-6 animate-fade-in">
            {productSuccess && (
              <div className="bg-emerald-500/15 text-emerald-300 p-4 rounded-3xl border border-emerald-400/30 text-xs font-bold flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{productSuccess}</span>
              </div>
            )}

            {/* Menu Header & Add Button */}
            <div className="dark-glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-white">Cardápio do Restaurante</h2>
                <p className="text-xs text-stone-400 mt-0.5">Adicione pratos com fotos da galeria, câmera ou links da internet</p>
              </div>

              <button
                onClick={() => {
                  setEditingProductId(null);
                  setProductForm({
                    name: '',
                    categoryId: CategoryId.LASANHAS,
                    description: '',
                    price: '',
                    image: '',
                    isPopular: false,
                  });
                  setIsProductModalOpen(true);
                }}
                className="flex items-center gap-2 dark-glass-button-gold text-black font-black text-xs py-3 px-5 rounded-full shadow-lg transition active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>Adicionar Novo Prato</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setSelectedCategoryFilter('todos')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCategoryFilter === 'todos'
                    ? 'bg-amber-400 text-black font-black shadow-md'
                    : 'bg-white/5 text-stone-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                Todos ({allProducts.length})
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    selectedCategoryFilter === cat.id
                      ? 'bg-amber-400 text-black font-black shadow-md'
                      : 'bg-white/5 text-stone-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4.5">
              {allProducts
                .filter(p => selectedCategoryFilter === 'todos' || p.categoryId === selectedCategoryFilter)
                .map((prod) => (
                <div
                  key={prod.id}
                  className="dark-glass-card rounded-3xl border border-white/10 overflow-hidden shadow-xl flex flex-col justify-between hover:border-amber-500/40 transition text-left"
                >
                  <div>
                    <div className="relative h-44 bg-stone-900 overflow-hidden">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=800';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                      <span className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-amber-300 border border-amber-400/30 font-black text-xs px-3 py-1 rounded-full shadow-lg">
                        {formatPrice(prod.price)}
                      </span>

                      {prod.isPopular && (
                        <span className="absolute top-3 left-3 bg-amber-400 text-black font-black text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 fill-black" />
                          <span>Mais Pedido</span>
                        </span>
                      )}
                    </div>

                    <div className="p-5 space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400/90 block">
                        {CATEGORIES.find(c => c.id === prod.categoryId)?.name || prod.categoryId}
                      </span>
                      <h3 className="font-black text-sm text-white leading-tight">{prod.name}</h3>
                      <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">{prod.description}</p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center gap-2">
                    <button
                      onClick={() => openEditProduct(prod)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Excluir o item "${prod.name}" do cardápio?`)) {
                          deleteProduct(prod.id);
                        }
                      }}
                      className="p-2.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 transition cursor-pointer"
                      title="Excluir prato"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: CONFIGURAÇÕES DA EMPRESA & CHAVE PIX */}
        {/* ============================================================ */}
        {adminTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in text-left">
            {settingsSuccess && (
              <div className="bg-emerald-500/15 text-emerald-300 p-4 rounded-3xl border border-emerald-400/30 text-xs font-bold flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{settingsSuccess}</span>
              </div>
            )}

            {/* WhatsApp & PIX Settings Panel */}
            <div className="dark-glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-base font-black text-white flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-400/30">
                    <Phone className="w-4 h-4 text-amber-400" />
                  </div>
                  <span>WhatsApp & Recebimento de Pedidos</span>
                </h2>
                <p className="text-xs text-stone-400 mt-1">Configuração do contato oficial para receber os pedidos dos clientes</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1.5">
                    Número do WhatsApp da Empresa (Apenas dígitos com DDD)
                  </label>
                  <input
                    type="text"
                    value={companyForm.whatsappNumber}
                    onChange={(e) => setCompanyForm({ ...companyForm, whatsappNumber: e.target.value })}
                    placeholder="Ex: 5566996523006"
                    className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:border-amber-400 outline-none"
                    required
                  />
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    Todos os pedidos enviados pelo carrinho irão diretamente para este WhatsApp.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1.5">
                    Telefone para exibição no rodapé e comandas
                  </label>
                  <input
                    type="text"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    placeholder="Ex: (66) 99652-3006"
                    className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:border-amber-400 outline-none"
                    required
                  />
                </div>

                {/* Operating Hours Configuration Card */}
                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Horário de Funcionamento & Agendamentos</span>
                    </h3>
                    <p className="text-xs text-stone-400">
                      Defina os dias e horários em que a cozinha está aberta para preparo imediato. Fora desse período, os clientes agendam pedidos para a próxima abertura.
                    </p>
                  </div>

                  {/* Open Days Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-300 block">Dias de Abertura:</label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {[
                        { day: 0, label: 'Dom' },
                        { day: 1, label: 'Seg' },
                        { day: 2, label: 'Ter' },
                        { day: 3, label: 'Qua' },
                        { day: 4, label: 'Qui' },
                        { day: 5, label: 'Sex' },
                        { day: 6, label: 'Sáb' },
                      ].map((item) => {
                        const isChecked = companyForm.openDays.includes(item.day);
                        return (
                          <button
                            key={item.day}
                            type="button"
                            onClick={() => {
                              const newDays = isChecked
                                ? companyForm.openDays.filter((d: number) => d !== item.day)
                                : [...companyForm.openDays, item.day];
                              setCompanyForm({ ...companyForm, openDays: newDays });
                            }}
                            className={`py-2.5 px-1 text-center rounded-2xl text-xs font-bold transition border cursor-pointer ${
                              isChecked
                                ? 'bg-amber-400 text-black border-amber-400 font-black shadow-md'
                                : 'bg-white/5 text-stone-400 border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Times Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-stone-300 block mb-1.5">Horário de Abertura</label>
                      <input
                        type="time"
                        value={companyForm.openTime}
                        onChange={(e) => setCompanyForm({ ...companyForm, openTime: e.target.value })}
                        className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-bold focus:border-amber-400 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-300 block mb-1.5">Horário de Fechamento</label>
                      <input
                        type="time"
                        value={companyForm.closeTime}
                        onChange={(e) => setCompanyForm({ ...companyForm, closeTime: e.target.value })}
                        className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-bold focus:border-amber-400 outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Force Status Mode */}
                  <div>
                    <label className="text-xs font-bold text-stone-300 block mb-1.5">Modo de Operação:</label>
                    <select
                      value={companyForm.forceStatus}
                      onChange={(e) => setCompanyForm({ ...companyForm, forceStatus: e.target.value as any })}
                      className="w-full p-3 rounded-2xl bg-stone-900 border border-white/10 text-white text-xs font-bold focus:border-amber-400 outline-none cursor-pointer"
                    >
                      <option value="auto">⏱️ Automático (Conforme relógio e dias de abertura)</option>
                      <option value="force_open">🟢 Forçar Aberto Agora (Aceitar pedidos imediatos)</option>
                      <option value="force_closed">🔴 Forçar Fechado Agora (Permitir apenas agendamentos)</option>
                    </select>
                  </div>
                </div>

                {/* PIX Settings */}
                <div className="pt-4 border-t border-white/10 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Dados da Chave PIX</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-stone-300 block mb-1.5">Tipo de Chave</label>
                      <select
                        value={companyForm.pixKeyType}
                        onChange={(e) => setCompanyForm({ ...companyForm, pixKeyType: e.target.value })}
                        className="w-full p-3 rounded-2xl bg-stone-900 border border-white/10 text-white text-sm focus:border-amber-400 outline-none cursor-pointer"
                      >
                        <option value="Celular">Celular</option>
                        <option value="CNPJ">CNPJ</option>
                        <option value="CPF">CPF</option>
                        <option value="E-mail">E-mail</option>
                        <option value="Chave Aleatória">Chave Aleatória</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-300 block mb-1.5">Chave PIX</label>
                      <input
                        type="text"
                        value={companyForm.pixKey}
                        onChange={(e) => setCompanyForm({ ...companyForm, pixKey: e.target.value })}
                        placeholder="Ex: 66996523006"
                        className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-mono focus:border-amber-400 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-300 block mb-1.5">Nome do Titular / Favorecido</label>
                    <input
                      type="text"
                      value={companyForm.pixBeneficiary}
                      onChange={(e) => setCompanyForm({ ...companyForm, pixBeneficiary: e.target.value })}
                      placeholder="Ex: Massas da Vovó"
                      className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:border-amber-400 outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 px-6 dark-glass-button-gold text-black font-black rounded-full text-sm shadow-xl transition-all active:scale-98 cursor-pointer"
                >
                  Salvar WhatsApp e Chave PIX
                </button>
              </form>
            </div>

            {/* Master Credentials Security Box */}
            <div className="dark-glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-5">
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-base font-black text-white flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-400/30">
                    <Key className="w-4 h-4 text-amber-400" />
                  </div>
                  <span>Segurança Master (Alterar Usuário e Senha)</span>
                </h2>
                <p className="text-xs text-stone-400 mt-1">Altere as credenciais de acesso a esta área administrativa</p>
              </div>

              {credMessage.text && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
                  credMessage.type === 'success' 
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30' 
                    : 'bg-rose-500/15 text-rose-300 border border-rose-400/30'
                }`}>
                  {credMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>{credMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveCredentials} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1.5">Nome de Usuário Master</label>
                  <input
                    type="text"
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:border-amber-400 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-stone-300 block mb-1.5">Nova Senha</label>
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:border-amber-400 outline-none font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-300 block mb-1.5">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:border-amber-400 outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-5 bg-white/10 hover:bg-white/20 text-white border border-white/15 font-black rounded-full text-xs shadow-md transition cursor-pointer"
                >
                  Atualizar Usuário e Senha Master
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Adicionar/Editar Produto */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="fixed inset-0 -z-10" onClick={() => setIsProductModalOpen(false)} />

          <div className="dark-glass-panel rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 my-8 border border-white/10 animate-scale-in text-left text-white">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-black text-white">
                {editingProductId ? 'Editar Prato' : 'Adicionar Novo Prato ao Cardápio'}
              </h2>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-stone-400 mb-5">Preencha os detalhes e adicione fotos por link ou direto do seu aparelho</p>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1.5">Nome do Prato</label>
                <input
                  type="text"
                  placeholder="Ex: Canelone aos 4 Queijos (500g)"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-stone-500 text-sm focus:border-amber-400 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1.5">Categoria</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value as CategoryId })}
                    className="w-full p-3 rounded-2xl bg-stone-900 border border-white/10 text-white text-sm focus:border-amber-400 outline-none cursor-pointer"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1.5">Preço (R$)</label>
                  <input
                    type="text"
                    placeholder="Ex: 58,90"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:border-amber-400 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1.5">Descrição dos Ingredientes</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Massa fresca artesanal, ricota cremosa, provolone defumado e molho da casa..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-stone-500 text-sm focus:border-amber-400 outline-none"
                />
              </div>

              {/* Photo Input: URL or Device File */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-300 block">Foto do Prato</label>
                  <span className="text-[10px] text-stone-400">Link ou Galeria/Câmera</span>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Cole o link/URL da imagem..."
                    value={productForm.image}
                    onChange={(e) => {
                      setProductForm({ ...productForm, image: e.target.value });
                      setImageLoadError(false);
                    }}
                    className="flex-1 p-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-stone-500 text-xs outline-none focus:border-amber-400"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleDeviceImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition shrink-0 disabled:opacity-50 border border-white/15 cursor-pointer"
                    title="Escolher arquivo de imagem direto do celular ou computador"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{isUploadingImage ? 'Enviando...' : 'Do Dispositivo'}</span>
                  </button>
                </div>

                {/* Preset Fast Photos */}
                <div>
                  <span className="text-[10px] font-bold text-stone-400 block mb-1.5">Ou escolha uma foto artesanal pronta:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_PASTA_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setProductForm(prev => ({ ...prev, image: preset.url }));
                          setImageLoadError(false);
                        }}
                        className={`text-[11px] px-3 py-1 rounded-full border font-medium transition cursor-pointer ${
                          productForm.image === preset.url
                            ? 'bg-amber-400 text-black border-amber-400 font-bold'
                            : 'bg-white/5 text-stone-300 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo Preview & Error Warning */}
                {productForm.image ? (
                  <div className="p-3.5 bg-black/40 rounded-2xl border border-white/10 space-y-2 mt-2">
                    <div className="flex items-center gap-3">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/20 bg-stone-900 shrink-0 shadow-md">
                        <img
                          src={productForm.image}
                          alt="Preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onLoad={() => setImageLoadError(false)}
                          onError={() => {
                            setImageLoadError(true);
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        {imageLoadError ? (
                          <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Imagem inacessível</span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-400 block">✓ Foto carregada</span>
                        )}
                        <p className="text-[10px] text-stone-400 truncate mt-0.5 max-w-[200px]">{productForm.image}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm(prev => ({ ...prev, image: '' }));
                            setImageLoadError(false);
                          }}
                          className="text-[10px] text-rose-400 font-bold hover:underline mt-1 cursor-pointer block"
                        >
                          Remover foto
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-400 italic">
                    Nenhuma foto selecionada. Será utilizada a foto padrão de massas da casa.
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={productForm.isPopular}
                  onChange={(e) => setProductForm({ ...productForm, isPopular: e.target.checked })}
                  className="rounded-md text-amber-500 h-4 w-4 bg-white/5 border-white/20 focus:ring-amber-400"
                />
                <span className="text-xs text-stone-200 font-bold">Marcar como "Mais Pedido / Destaque"</span>
              </label>

              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-3.5 px-5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct || isUploadingImage}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 dark-glass-button-gold text-black font-black rounded-full text-xs shadow-xl transition active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingProduct ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Prato</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Comanda */}
      {receiptOrder && (
        <OrderReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
};
