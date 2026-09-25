import React, { useState, useMemo } from 'react';
import { useCompany } from '../context/CompanyContext';
import { Order, Product, CashMovement } from '../types';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  CreditCard, 
  QrCode, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Minus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Store, 
  Bike, 
  Calendar, 
  Percent, 
  Layers, 
  RotateCcw,
  Sparkles,
  BarChart3,
  Archive,
  ArrowRight,
  Search,
  PauseCircle,
  PlayCircle,
  Check
} from 'lucide-react';

export const ErpDashboardView: React.FC = () => {
  const { 
    orders, 
    allProducts, 
    toggleProductStockStatus, 
    updateProductStockQuantity,
    cashMovements,
    addCashMovement
  } = useCompany();

  // Period filter for metrics
  const [periodFilter, setPeriodFilter] = useState<'today' | '7days' | 'month' | 'all'>('all');

  // Sub-tabs in ERP: 'overview' | 'availability' | 'cash'
  const [erpTab, setErpTab] = useState<'overview' | 'availability' | 'cash'>('overview');
  const [availabilitySearch, setAvailabilitySearch] = useState('');

  // Cash movement modal state
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashType, setCashType] = useState<'suprimento' | 'sangria'>('suprimento');
  const [cashAmount, setCashAmount] = useState('');
  const [cashReason, setCashReason] = useState('');

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
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  // Filter orders by period
  const filteredOrders = useMemo(() => {
    if (periodFilter === 'all') return orders;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - (7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return orders.filter(o => {
      const orderTime = new Date(o.createdAt).getTime();
      if (periodFilter === 'today') return orderTime >= startOfToday;
      if (periodFilter === '7days') return orderTime >= sevenDaysAgo;
      if (periodFilter === 'month') return orderTime >= startOfMonth;
      return true;
    });
  }, [orders, periodFilter]);

  // Financial Metrics Calculation
  const metrics = useMemo(() => {
    let totalGrossRevenue = 0;
    let posRevenue = 0;
    let deliveryRevenue = 0;
    let posCount = 0;
    let deliveryCount = 0;

    let pixRevenue = 0;
    let cashRevenue = 0;
    let cardRevenue = 0;

    const productSalesMap = new Map<string, { name: string; quantity: number; totalRevenue: number }>();

    filteredOrders.forEach(o => {
      // Exclude cancelled orders from gross revenue
      if (o.status === 'cancelado') return;

      const orderTotal = Number(o.grandTotal) || 0;
      totalGrossRevenue += orderTotal;

      // Channel breakdown (POS/Balcão vs Online/Delivery)
      if (o.origin === 'pos' || o.deliveryType === 'takeaway' || o.deliveryType === 'dine_in') {
        posRevenue += orderTotal;
        posCount += 1;
      } else {
        deliveryRevenue += orderTotal;
        deliveryCount += 1;
      }

      // Payment method breakdown
      if (o.paymentMethod.startsWith('pix')) {
        pixRevenue += orderTotal;
      } else if (o.paymentMethod === 'cash') {
        cashRevenue += orderTotal;
      } else {
        cardRevenue += orderTotal;
      }

      // Item sales ranking
      if (Array.isArray(o.items)) {
        o.items.forEach(it => {
          const key = it.productName;
          const current = productSalesMap.get(key) || { name: key, quantity: 0, totalRevenue: 0 };
          current.quantity += it.quantity;
          current.totalRevenue += it.totalPrice;
          productSalesMap.set(key, current);
        });
      }
    });

    const totalOrdersCount = posCount + deliveryCount;
    const averageTicket = totalOrdersCount > 0 ? totalGrossRevenue / totalOrdersCount : 0;

    // Top products ranking
    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);

    // Cash Drawer Balance (Dinheiro em Caixa)
    let totalCashDrawer = cashRevenue;
    cashMovements.forEach(m => {
      if (m.type === 'suprimento') totalCashDrawer += m.amount;
      if (m.type === 'sangria') totalCashDrawer -= m.amount;
    });

    return {
      totalGrossRevenue,
      posRevenue,
      deliveryRevenue,
      posCount,
      deliveryCount,
      totalOrdersCount,
      averageTicket,
      pixRevenue,
      cashRevenue,
      cardRevenue,
      topProducts,
      totalCashDrawer,
    };
  }, [filteredOrders, cashMovements]);

  // Handle cash movement submission
  const handleAddCashMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(cashAmount);
    if (!amount || amount <= 0 || !cashReason.trim()) return;

    await addCashMovement(cashType, amount, cashReason);
    setCashAmount('');
    setCashReason('');
    setIsCashModalOpen(false);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      
      {/* ERP Header Bar */}
      <div className="dark-glass-panel p-5 rounded-3xl border border-stone-200 dark:border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <span>Módulo de Gestão ERP & Inteligência de Negócio</span>
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
            DRE executivo, fluxo de caixa, controle de pausa de pratos e comparativo balcão vs delivery
          </p>
        </div>

        {/* Sub-nav Buttons */}
        <div className="flex bg-stone-100 dark:bg-black/40 p-1 rounded-2xl border border-stone-200 dark:border-white/10 gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'DRE & Finanças', icon: TrendingUp },
            { id: 'availability', label: 'Disponibilidade (Pausa)', icon: Package },
            { id: 'cash', label: 'Frente de Caixa', icon: DollarSign },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setErpTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  erpTab === tab.id
                    ? 'bg-amber-400 text-stone-950 font-black shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DRE & FINANÇAS */}
      {/* ========================================================= */}
      {erpTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Period Filter Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
              Filtrar Indicadores por Período:
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'today', label: 'Hoje' },
                { id: '7days', label: 'Últimos 7 dias' },
                { id: 'month', label: 'Este Mês' },
                { id: 'all', label: 'Todo o Histórico' },
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriodFilter(p.id as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    periodFilter === p.id
                      ? 'bg-amber-400 text-stone-950 font-black shadow-md'
                      : 'bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/10'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Top Big Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1: Total Revenue */}
            <div className="dark-glass-panel p-5 rounded-3xl border border-stone-200 dark:border-white/10 shadow-lg space-y-1">
              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                Faturamento Bruto
              </span>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {formatPrice(metrics.totalGrossRevenue)}
              </p>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block pt-1">
                {metrics.totalOrdersCount} pedidos confirmados
              </span>
            </div>

            {/* Metric 2: Balcão / Local */}
            <div className="dark-glass-panel p-5 rounded-3xl border border-stone-200 dark:border-white/10 shadow-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                  Vendas no Balcão / Salão
                </span>
                <Store className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-400">
                {formatPrice(metrics.posRevenue)}
              </p>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block pt-1">
                {metrics.posCount} comandas ({metrics.totalOrdersCount > 0 ? Math.round((metrics.posCount / metrics.totalOrdersCount) * 100) : 0}% do volume)
              </span>
            </div>

            {/* Metric 3: Delivery */}
            <div className="dark-glass-panel p-5 rounded-3xl border border-stone-200 dark:border-white/10 shadow-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                  Vendas Online / Delivery
                </span>
                <Bike className="w-4 h-4 text-sky-500" />
              </div>
              <p className="text-2xl font-black text-sky-700 dark:text-sky-400">
                {formatPrice(metrics.deliveryRevenue)}
              </p>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block pt-1">
                {metrics.deliveryCount} pedidos ({metrics.totalOrdersCount > 0 ? Math.round((metrics.deliveryCount / metrics.totalOrdersCount) * 100) : 0}% do volume)
              </span>
            </div>

            {/* Metric 4: Ticket Médio */}
            <div className="dark-glass-panel p-5 rounded-3xl border border-stone-200 dark:border-white/10 shadow-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                  Ticket Médio
                </span>
                <Percent className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-black text-purple-700 dark:text-purple-400">
                {formatPrice(metrics.averageTicket)}
              </p>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block pt-1">
                Média gasta por cliente
              </span>
            </div>

          </div>

          {/* Breakdown Rows: Payment Methods & Top Sold Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Payment Methods Breakdown */}
            <div className="dark-glass-panel p-5 rounded-3xl border border-stone-200 dark:border-white/10 shadow-xl space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                <span>Recebimentos por Forma de Pagamento</span>
              </h3>

              <div className="space-y-3">
                {[
                  { label: 'PIX (Instantâneo / Entrega)', value: metrics.pixRevenue, color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Cartões (Crédito & Débito)', value: metrics.cardRevenue, color: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400' },
                  { label: 'Dinheiro em Espécie', value: metrics.cashRevenue, color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
                ].map((pm, idx) => {
                  const pct = metrics.totalGrossRevenue > 0 ? (pm.value / metrics.totalGrossRevenue) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-stone-700 dark:text-stone-300">{pm.label}</span>
                        <span className={pm.text}>{formatPrice(pm.value)} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-white/10 overflow-hidden">
                        <div 
                          className={`h-full ${pm.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Sold Products */}
            <div className="dark-glass-panel p-5 rounded-3xl border border-stone-200 dark:border-white/10 shadow-xl space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <span>Pratos Mais Vendidos (Volume & Receita)</span>
              </h3>

              {metrics.topProducts.length === 0 ? (
                <p className="text-xs text-stone-400 py-6 text-center">Nenhuma venda registrada no período.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {metrics.topProducts.map((prod, idx) => (
                    <div 
                      key={idx}
                      className="bg-stone-50 dark:bg-black/30 p-2.5 rounded-2xl border border-stone-200 dark:border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-black text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-stone-900 dark:text-white truncate">
                          {prod.name}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-stone-900 dark:text-white block">
                          {prod.quantity} porções
                        </span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                          {formatPrice(prod.totalRevenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CONTROLE DE DISPONIBILIDADE DO CARDÁPIO (PAUSA DE PRATOS) */}
      {/* ========================================================= */}
      {erpTab === 'availability' && (
        <div className="space-y-4">
          
          {/* Header Explanation Banner */}
          <div className="dark-glass-panel p-5 rounded-3xl border border-stone-200 dark:border-white/10 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-500" />
                  <span>Disponibilidade do Cardápio para Delivery (Sob Demanda)</span>
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                  No delivery gastronômico os pratos são preparados sob demanda e <strong>não possuem limites numéricos de estoque</strong>. 
                  Todos os itens ativos aceitam pedidos ilimitados. Use o botão de <strong>Pausa Rápida</strong> apenas quando faltar algum insumo ou ingrediente específico na cozinha hoje.
                </p>
              </div>

              {/* Status Counters */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1.5 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase">Disponíveis</span>
                  <span className="text-sm font-black text-emerald-800 dark:text-emerald-300">
                    {allProducts.filter(p => !p.isOutOfStock).length} pratos
                  </span>
                </div>
                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 px-3 py-1.5 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 block uppercase">Pausados</span>
                  <span className="text-sm font-black text-rose-800 dark:text-rose-300">
                    {allProducts.filter(p => p.isOutOfStock).length} pratos
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative pt-2">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={availabilitySearch}
                onChange={(e) => setAvailabilitySearch(e.target.value)}
                placeholder="Filtrar prato por nome para pausar ou reativar..."
                className="w-full bg-stone-100 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-2xl py-2 pl-10 pr-4 text-xs font-medium text-stone-900 dark:text-white focus:outline-none focus:border-amber-400 transition"
              />
              {availabilitySearch && (
                <button
                  type="button"
                  onClick={() => setAvailabilitySearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-white font-bold"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Dishes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {allProducts
              .filter(prod => {
                if (!availabilitySearch) return true;
                const query = availabilitySearch.toLowerCase();
                return prod.name.toLowerCase().includes(query) || (prod.description || '').toLowerCase().includes(query);
              })
              .map(prod => {
                const isOut = prod.isOutOfStock;

                return (
                  <div
                    key={prod.id}
                    className={`dark-glass-card rounded-2xl border p-4 flex flex-col justify-between gap-3 text-left transition ${
                      isOut 
                        ? 'border-rose-400/50 bg-rose-50/20 dark:bg-rose-950/20 shadow-none' 
                        : 'border-stone-200 dark:border-white/10 hover:border-amber-400/40 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-800 shrink-0">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className={`w-full h-full object-cover transition ${isOut ? 'grayscale opacity-60' : ''}`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&q=80&w=200';
                          }}
                        />
                        {isOut && (
                          <div className="absolute inset-0 bg-stone-950/70 flex items-center justify-center">
                            <span className="text-[9px] font-black text-rose-300 uppercase px-1 text-center">
                              Pausado
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-stone-900 dark:text-white truncate">
                          {prod.name}
                        </h4>
                        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                          {formatPrice(prod.price)}
                        </p>
                        
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isOut 
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300' 
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                          }`}>
                            {isOut ? '❌ Pausado / Esgotado' : '🟢 Disponível (Ilimitado)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                      {isOut 
                        ? 'Item bloqueado para pedidos no site e balcão. Reative quando houver insumos.' 
                        : 'Prato liberado para receber pedidos online e no caixa sem travas de quantidade.'}
                    </p>

                    {/* Fast Toggle Action Button */}
                    <div className="pt-2 border-t border-stone-200 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => toggleProductStockStatus(prod.id, !isOut)}
                        className={`w-full py-2 px-3 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98 ${
                          isOut
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                            : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
                        }`}
                      >
                        {isOut ? (
                          <>
                            <PlayCircle className="w-4 h-4" />
                            <span>Reativar Prato (Disponibilizar)</span>
                          </>
                        ) : (
                          <>
                            <PauseCircle className="w-4 h-4" />
                            <span>Pausar Prato (Esgotou Insumo)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: FRENTE DE CAIXA & MOVIMENTAÇÕES */}
      {/* ========================================================= */}
      {erpTab === 'cash' && (
        <div className="space-y-6">
          
          {/* Cash Summary Banner */}
          <div className="dark-glass-panel p-6 rounded-3xl border-2 border-amber-400/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                Saldo Atual em Dinheiro no Caixa
              </span>
              <p className="text-3xl font-black text-amber-700 dark:text-amber-400 mt-1">
                {formatPrice(metrics.totalCashDrawer)}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Vendas em espécie + Suprimentos - Sangrias realizadas
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setCashType('suprimento');
                  setIsCashModalOpen(true);
                }}
                className="py-2.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>+ Suprimento (Troco)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCashType('sangria');
                  setIsCashModalOpen(true);
                }}
                className="py-2.5 px-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>- Sangria (Retirada)</span>
              </button>
            </div>
          </div>

          {/* Cash Movements History */}
          <div className="dark-glass-panel p-5 rounded-3xl border border-stone-200 dark:border-white/10 shadow-xl space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-500" />
              <span>Histórico de Movimentações de Caixa</span>
            </h3>

            {cashMovements.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">Nenhum suprimento ou sangria registrado.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {cashMovements.map(mov => (
                  <div
                    key={mov.id}
                    className="bg-stone-50 dark:bg-black/30 p-3 rounded-2xl border border-stone-200 dark:border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        mov.type === 'suprimento'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                      }`}>
                        {mov.type === 'suprimento' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="font-bold text-stone-900 dark:text-white block">
                          {mov.type === 'suprimento' ? 'Suprimento de Caixa' : 'Sangria de Caixa'}
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          {mov.reason} • {formatDate(mov.createdAt)}
                        </span>
                      </div>
                    </div>

                    <span className={`font-black text-sm ${
                      mov.type === 'suprimento' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {mov.type === 'suprimento' ? '+' : '-'}{formatPrice(mov.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Cash Movement Modal */}
      {isCashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
              {cashType === 'suprimento' ? (
                <>
                  <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                  <span>Registrar Suprimento (Aporte / Troco)</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-5 h-5 text-rose-500" />
                  <span>Registrar Sangria (Retirada)</span>
                </>
              )}
            </h3>

            <form onSubmit={handleAddCashMovement} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Valor (R$):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-stone-100 dark:bg-black/40 border border-stone-300 dark:border-white/10 rounded-2xl py-2 px-3 text-sm font-black text-stone-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Motivo / Observação:
                </label>
                <input
                  type="text"
                  required
                  value={cashReason}
                  onChange={(e) => setCashReason(e.target.value)}
                  placeholder={cashType === 'suprimento' ? 'Ex: Troco inicial da manhã' : 'Ex: Pagamento do fornecedor de verduras'}
                  className="w-full bg-stone-100 dark:bg-black/40 border border-stone-300 dark:border-white/10 rounded-2xl py-2 px-3 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCashModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-full bg-stone-100 dark:bg-white/10 text-stone-800 dark:text-white font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 px-3 rounded-full text-white font-black shadow-md ${
                    cashType === 'suprimento' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
