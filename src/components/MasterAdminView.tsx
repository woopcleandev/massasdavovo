import React, { useState, useRef } from 'react';
import { useCompany } from '../context/CompanyContext';
import { CategoryId, Order, OrderStatus, Product } from '../types';
import { CATEGORIES } from '../data';
import { OrderReceiptModal } from './OrderReceiptModal';
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
  DollarSign
} from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Settings form state
  const [companyForm, setCompanyForm] = useState({
    whatsappNumber: settings.whatsappNumber,
    phone: settings.phone,
    pixKey: settings.pixKey,
    pixKeyType: settings.pixKeyType,
    pixBeneficiary: settings.pixBeneficiary,
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

    // Check size limit (compress if large)
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = Math.min(img.width, MAX_WIDTH);
        canvas.height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setProductForm(prev => ({ ...prev, image: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle Product Save
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.price) {
      alert('Por favor, preencha o nome e o preço do item.');
      return;
    }

    const priceNum = parseFloat(productForm.price.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Preço inválido.');
      return;
    }

    const defaultImg = 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=800';

    if (editingProductId) {
      await updateProduct(editingProductId, {
        name: productForm.name,
        categoryId: productForm.categoryId,
        description: productForm.description,
        price: priceNum,
        image: productForm.image || defaultImg,
        isPopular: productForm.isPopular,
      });
    } else {
      await addProduct({
        name: productForm.name,
        categoryId: productForm.categoryId,
        description: productForm.description,
        price: priceNum,
        image: productForm.image || defaultImg,
        isPopular: productForm.isPopular,
      });
    }

    setIsProductModalOpen(false);
    setEditingProductId(null);
    setProductForm({
      name: '',
      categoryId: CategoryId.LASANHAS,
      description: '',
      price: '',
      image: '',
      isPopular: false,
    });
  };

  // Open Edit Product Modal
  const openEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setProductForm({
      name: prod.name,
      categoryId: prod.categoryId,
      description: prod.description,
      price: prod.price.toString(),
      image: prod.image,
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
    });
    setSettingsSuccess('Configurações atualizadas com sucesso!');
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

  // 1. If not authenticated, show Master Login Card
  if (!isMasterAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b1c3f] via-[#09152e] to-black flex items-center justify-center p-4 text-gray-800">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 text-left animate-scale-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#0b1c3f]/10 text-[#0b1c3f] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Painel Master</h1>
            <p className="text-xs text-gray-500 mt-1">Acesso Administrativo Massas da Vovó</p>
          </div>

          {loginError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Usuário</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ex: Admin"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-[#0b1c3f] focus:border-[#0b1c3f] outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-[#0b1c3f] focus:border-[#0b1c3f] outline-hidden"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-[#0b1c3f] hover:bg-[#07132c] text-[#d4af37] border border-[#d4af37]/20 font-black rounded-xl text-sm shadow-md transition-all active:scale-98"
            >
              Entrar no Painel Master
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <button
              onClick={onBackToMenu}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 font-bold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Cardápio do Cliente</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Master Dashboard
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 text-left pb-16">
      {/* Admin Top Navbar */}
      <header className="bg-[#0b1c3f] text-white sticky top-0 z-30 shadow-md border-b border-[#d4af37]/30">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#d4af37]/20 text-[#d4af37] rounded-xl border border-[#d4af37]/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-wide">PAINEL MASTER</span>
                <span className="text-[10px] bg-[#d4af37] text-[#0b1c3f] font-extrabold px-2 py-0.5 rounded-full">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-gray-300">Massas da Vovó • Gestão Completa</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToMenu}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2 px-3.5 rounded-xl border border-white/10 transition"
              title="Ir para o cardápio público dos clientes"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver Cardápio</span>
            </button>

            <button
              onClick={logoutMaster}
              className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition"
              title="Sair do painel administrativo"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="max-w-6xl mx-auto px-4 flex border-t border-white/10 gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setAdminTab('sales')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition ${
              adminTab === 'sales'
                ? 'border-[#d4af37] text-[#d4af37] bg-white/5'
                : 'border-transparent text-gray-300 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Histórico de Vendas & Comandas</span>
            {pendingOrders > 0 && (
              <span className="bg-yellow-400 text-gray-900 font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
                {pendingOrders}
              </span>
            )}
          </button>

          <button
            onClick={() => setAdminTab('menu')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition ${
              adminTab === 'menu'
                ? 'border-[#d4af37] text-[#d4af37] bg-white/5'
                : 'border-transparent text-gray-300 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Gerenciar Cardápio & Novos Pratos</span>
          </button>

          <button
            onClick={() => setAdminTab('settings')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition ${
              adminTab === 'settings'
                ? 'border-[#d4af37] text-[#d4af37] bg-white/5'
                : 'border-transparent text-gray-300 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configurações & Chave PIX</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        
        {/* ============================================================ */}
        {/* TAB 1: HISTÓRICO DE VENDAS & COMANDAS */}
        {/* ============================================================ */}
        {adminTab === 'sales' && (
          <div className="space-y-6 animate-fade-in">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-50 text-[#0b1c3f]">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Total de Pedidos</span>
                  <p className="text-2xl font-black text-gray-900">{orders.length}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Faturamento Registrado</span>
                  <p className="text-2xl font-black text-emerald-600">{formatPrice(totalRevenue)}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Pedidos Pendentes</span>
                  <p className="text-2xl font-black text-amber-600">{pendingOrders}</p>
                </div>
              </div>
            </div>

            {/* Orders Header & Filters */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-gray-900">Pedidos Recebidos</h2>
                <p className="text-xs text-gray-500">Acompanhamento e impressão de comandas em tempo real</p>
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {['todos', 'novo', 'preparo', 'entrega', 'concluido', 'cancelado'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                      statusFilter === st
                        ? 'bg-[#0b1c3f] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st === 'todos' ? 'Todos' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-2">
                <Receipt className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="text-sm font-black text-gray-700">Nenhum pedido encontrado nesta categoria</h3>
                <p className="text-xs text-gray-400">Os pedidos finalizados pelos clientes aparecerão aqui instantaneamente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:border-[#0b1c3f]/30 transition space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-base text-[#0b1c3f]">{ord.orderNumber}</span>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            ord.status === 'novo' ? 'bg-amber-100 text-amber-800' :
                            ord.status === 'preparo' ? 'bg-blue-100 text-blue-800' :
                            ord.status === 'entrega' ? 'bg-purple-100 text-purple-800' :
                            ord.status === 'concluido' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {ord.status}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            ord.deliveryType === 'delivery' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                          }`}>
                            {ord.deliveryType === 'delivery' ? '🚀 Entrega' : '🏪 Retirada'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Cliente: <strong className="text-gray-900">{ord.customerName}</strong> • {ord.customerPhone} • {formatDate(ord.createdAt)}
                        </p>
                      </div>

                      {/* Right Action: Comanda Button & Total */}
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 block font-bold">TOTAL</span>
                          <span className="text-base font-black text-[#0b1c3f]">{formatPrice(ord.grandTotal)}</span>
                        </div>
                        <button
                          onClick={() => setReceiptOrder(ord)}
                          className="flex items-center gap-1.5 bg-[#0b1c3f] hover:bg-[#07132c] text-[#d4af37] border border-[#d4af37]/20 font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs transition"
                        >
                          <Receipt className="w-4 h-4" />
                          <span>Ver Comanda</span>
                        </button>
                      </div>
                    </div>

                    {/* Middle: Details summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-gray-50 p-2.5 rounded-xl space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Itens do Pedido ({ord.items.length})</span>
                        <div className="space-y-0.5">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="text-gray-700 truncate">
                              <strong>{it.quantity}x</strong> {it.productName}
                              {it.notes && <span className="text-red-500 italic ml-1">("{it.notes}")</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-2.5 rounded-xl space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Pagamento & Local</span>
                        <p className="text-gray-800">
                          <strong>Forma:</strong> {
                            ord.paymentMethod === 'pix_now' ? '🌀 PIX Antecipado' :
                            ord.paymentMethod === 'pix_delivery' ? '📱 PIX QR Code na Entrega' :
                            ord.paymentMethod === 'cash' ? `💵 Dinheiro (Troco: ${ord.changeFor || 'Não'})` :
                            ord.paymentMethod === 'credit' ? '💳 Cartão Crédito' : '💳 Cartão Débito'
                          }
                        </p>
                        {ord.deliveryType === 'delivery' && (
                          <p className="text-gray-600 truncate">
                            <strong>Endereço:</strong> {ord.street}, {ord.number} ({ord.neighborhood})
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Status Changer */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-gray-500 font-semibold">Alterar Status:</span>
                      <div className="flex gap-1.5">
                        {(['novo', 'preparo', 'entrega', 'concluido', 'cancelado'] as OrderStatus[]).map(st => (
                          <button
                            key={st}
                            onClick={() => updateOrderStatus(ord.id, st)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition ${
                              ord.status === st
                                ? 'bg-[#0b1c3f] text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: GERENCIAR CARDÁPIO & NOVOS PRATOS */}
        {/* ============================================================ */}
        {adminTab === 'menu' && (
          <div className="space-y-6 animate-fade-in">
            {/* Action Bar */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-gray-900">Cardápio do Restaurante</h2>
                <p className="text-xs text-gray-500">Adicione novos itens com fotos da internet ou direto do seu aparelho</p>
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
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Novo Prato</span>
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {allProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-40 bg-gray-100">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=800';
                        }}
                      />
                      <span className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white font-extrabold text-xs px-2.5 py-1 rounded-lg">
                        {formatPrice(prod.price)}
                      </span>
                      {prod.isPopular && (
                        <span className="absolute top-2.5 left-2.5 bg-yellow-400 text-gray-950 font-black text-[10px] px-2 py-0.5 rounded-md shadow-xs">
                          ★ Mais Pedido
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-gray-400">
                        {CATEGORIES.find(c => c.id === prod.categoryId)?.name || prod.categoryId}
                      </span>
                      <h3 className="font-extrabold text-sm text-gray-900 leading-tight">{prod.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{prod.description}</p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center gap-2">
                    <button
                      onClick={() => openEditProduct(prod)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir o item "${prod.name}" do cardápio?`)) {
                          deleteProduct(prod.id);
                        }
                      }}
                      className="p-2 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition"
                      title="Excluir item"
                    >
                      <Trash2 className="w-4 h-4" />
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
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {settingsSuccess && (
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{settingsSuccess}</span>
              </div>
            )}

            {/* WhatsApp & PIX form */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-5">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#0b1c3f]" />
                  <span>WhatsApp & Recebimento de Pedidos</span>
                </h2>
                <p className="text-xs text-gray-500">Configuração do contato da empresa para receber os pedidos dos clientes</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Número do WhatsApp da Empresa (Apenas dígitos com DDD)
                  </label>
                  <input
                    type="text"
                    value={companyForm.whatsappNumber}
                    onChange={(e) => setCompanyForm({ ...companyForm, whatsappNumber: e.target.value })}
                    placeholder="Ex: 5566996523006"
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm font-mono focus:ring-[#0b1c3f] focus:border-[#0b1c3f] outline-hidden"
                    required
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Todos os pedidos enviados pelo carrinho irão diretamente para este WhatsApp.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Telefone para exibição no rodapé e comanda
                  </label>
                  <input
                    type="text"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    placeholder="Ex: (66) 99652-3006"
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:ring-[#0b1c3f] focus:border-[#0b1c3f] outline-hidden"
                    required
                  />
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-3 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Dados da Chave PIX</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Tipo de Chave</label>
                      <select
                        value={companyForm.pixKeyType}
                        onChange={(e) => setCompanyForm({ ...companyForm, pixKeyType: e.target.value })}
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-white outline-hidden"
                      >
                        <option value="Celular">Celular</option>
                        <option value="CNPJ">CNPJ</option>
                        <option value="CPF">CPF</option>
                        <option value="E-mail">E-mail</option>
                        <option value="Chave Aleatória">Chave Aleatória</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Chave PIX</label>
                      <input
                        type="text"
                        value={companyForm.pixKey}
                        onChange={(e) => setCompanyForm({ ...companyForm, pixKey: e.target.value })}
                        placeholder="Ex: 66996523006"
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm font-mono outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="text-xs font-bold text-gray-700 block mb-1">Nome do Titular / Favorecido</label>
                    <input
                      type="text"
                      value={companyForm.pixBeneficiary}
                      onChange={(e) => setCompanyForm({ ...companyForm, pixBeneficiary: e.target.value })}
                      placeholder="Ex: Massas da Vovó"
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-hidden"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-[#0b1c3f] hover:bg-[#07132c] text-[#d4af37] border border-[#d4af37]/20 font-black rounded-xl text-sm shadow-md transition active:scale-98"
                >
                  Salvar WhatsApp e Chave PIX
                </button>
              </form>
            </div>

            {/* Master Credentials Box */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-600" />
                  <span>Segurança Master (Alterar Usuário e Senha)</span>
                </h2>
                <p className="text-xs text-gray-500">Altere as credenciais de acesso a esta área administrativa</p>
              </div>

              {credMessage.text && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  credMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {credMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                  <span>{credMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveCredentials} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Nome de Usuário Master</label>
                  <input
                    type="text"
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Nova Senha</label>
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-hidden"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gray-900 hover:bg-black text-white font-extrabold rounded-xl text-xs shadow-sm transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="fixed inset-0 -z-10" onClick={() => setIsProductModalOpen(false)} />

          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 my-8 border border-gray-100 animate-scale-in text-left">
            <h2 className="text-lg font-black text-gray-900 mb-1">
              {editingProductId ? 'Editar Prato' : 'Adicionar Novo Prato ao Cardápio'}
            </h2>
            <p className="text-xs text-gray-500 mb-4">Preencha os detalhes e adicione fotos por URL ou do seu dispositivo</p>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Nome do Prato</label>
                <input
                  type="text"
                  placeholder="Ex: Canelone aos 4 Queijos (500g)"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Categoria</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value as CategoryId })}
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-white outline-hidden"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Preço (R$)</label>
                  <input
                    type="text"
                    placeholder="Ex: 58,90"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Descrição dos Ingredientes</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Massa fresca artesanal, ricota cremosa, provolone defumado e molho da casa..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-hidden"
                />
              </div>

              {/* Photo Input: URL or Device File */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-700 block">Foto do Prato</label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Cole o link/URL da imagem..."
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                    className="flex-1 p-2.5 rounded-xl border border-gray-200 text-xs outline-hidden"
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
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition shrink-0"
                    title="Escolher arquivo de imagem direto do seu celular ou computador"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Do Dispositivo</span>
                  </button>
                </div>

                {/* Photo Preview */}
                {productForm.image && (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 mt-2">
                    <img
                      src={productForm.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={productForm.isPopular}
                  onChange={(e) => setProductForm({ ...productForm, isPopular: e.target.checked })}
                  className="rounded text-[#0b1c3f] h-4 w-4"
                />
                <span className="text-xs text-gray-700 font-bold">Marcar como "Mais Pedido / Destaque"</span>
              </label>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-[#0b1c3f] hover:bg-[#07132c] text-[#d4af37] border border-[#d4af37]/20 font-black rounded-xl text-xs shadow-md transition"
                >
                  Salvar Prato
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
