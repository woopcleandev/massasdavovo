/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { CATEGORIES, RESTAURANT_INFO } from './data';
import { CategoryId, Product, CartItem } from './types';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { AboutTab } from './components/AboutTab';
import { PWAInstallButton } from './components/PWAInstallButton';
import { 
  ShoppingBag, Search, Clock, MapPin, Menu, X, Info, Phone, 
  ArrowRight, Heart, User, Plus, Minus, Trash2, Sparkles, Check,
  ExternalLink, ChevronRight, Utensils
} from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { CompanyProvider, useCompany } from './context/CompanyContext';
import { MyAccountView } from './components/MyAccountView';
import { MasterAdminView } from './components/MasterAdminView';

function MainApp() {
  const { allProducts, settings } = useCompany();

  // Navigation & filtering state
  const [activeTab, setActiveTab] = useState<'menu' | 'about' | 'account'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>(CategoryId.LASANHAS);
  const [searchQuery, setSearchQuery] = useState('');

  // Cart state, initialized from localStorage if exists
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('vovo_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  // Modal tracking
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync cart items to localStorage on change
  useEffect(() => {
    localStorage.setItem('vovo_cart_items', JSON.stringify(cartItems));
  }, [cartItems]);

  const handleAddToCart = (newItem: CartItem) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((item) => item.id === newItem.id);
      if (existingItemIndex > -1) {
        const updated = [...prevItems];
        updated[existingItemIndex].quantity += newItem.quantity;
        return updated;
      }
      return [...prevItems, newItem];
    });
  };

  const handleUpdateCartQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveCartItem(id);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item))
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Filter products based on active category AND search query
  const filteredProducts = allProducts.filter((product) => {
    const matchesCategory = activeTab === 'menu' && product.categoryId === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (searchQuery.trim() !== '') {
      return matchesSearch;
    }
    return matchesCategory;
  });

  const cartItemsCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const cartTotalValue = cartItems.reduce((acc, curr) => acc + curr.totalUnitPrice * curr.quantity, 0);

  const activeWhatsApp = settings.whatsappNumber || RESTAURANT_INFO.whatsappNumber;
  const activePhone = settings.phone || RESTAURANT_INFO.phone;

  return (
    <div className="min-h-screen liquid-ambient-bg text-gray-800 antialiased font-sans pb-28 selection:bg-[#0b1c3f]/10 selection:text-[#0b1c3f] relative overflow-x-hidden">
      
      {/* 0. Ambient Light Refraction Orbs (Provides liquid glass optical depth) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-200/25 rounded-full blur-[110px]" />
        <div className="absolute top-1/4 -right-32 w-[32rem] h-[32rem] bg-sky-200/20 rounded-full blur-[130px]" />
        <div className="absolute bottom-20 left-1/3 w-[30rem] h-[30rem] bg-rose-200/15 rounded-full blur-[140px]" />
      </div>

      {/* 1. Floating Desktop & Mobile Liquid Glass Topbar */}
      <header className="sticky top-3 z-40 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-all duration-300">
        <nav className="glass-panel rounded-full px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-6 border border-white/80 shadow-[0_12px_36px_rgba(0,0,0,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
          
          {/* Brand Identity / Logo */}
          <div 
            onClick={() => { setActiveTab('menu'); setSearchQuery(''); }}
            className="flex items-center gap-3 cursor-pointer shrink-0 group"
          >
            <div className="relative p-0.5 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-[#d4af37]/40 group-hover:scale-105 transition-transform duration-300">
              <img
                src={RESTAURANT_INFO.logo}
                alt={RESTAURANT_INFO.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
              />
              <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white" />
              </span>
            </div>
            
            <div className="flex flex-col text-left">
              <span className="text-sm sm:text-base font-black text-gray-950 tracking-tight leading-none group-hover:text-[#0b1c3f] transition-colors flex items-center gap-1.5">
                <span>{RESTAURANT_INFO.name}</span>
                <span className="hidden sm:inline-flex items-center text-[10px] font-extrabold text-[#d4af37] bg-[#0b1c3f] px-1.5 py-0.2 rounded-full">
                  Artesanal
                </span>
              </span>
              <span className="text-[10px] sm:text-[11px] text-gray-400 font-semibold tracking-wide leading-none mt-1 truncate max-w-[130px] sm:max-w-none">
                Primavera do Leste - MT • Aberto
              </span>
            </div>
          </div>

          {/* Desktop Central Liquid Glass Navigation Capsule */}
          <div className="hidden md:flex items-center gap-1 p-1 rounded-full glass-panel-subtle border border-white/70 shadow-xs">
            <button
              onClick={() => {
                setActiveTab('menu');
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-white text-[#0b1c3f] shadow-sm border border-white/90 scale-102'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Cardápio Digital</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === 'about'
                  ? 'bg-white text-[#0b1c3f] shadow-sm border border-white/90 scale-102'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Quem Somos</span>
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === 'account'
                  ? 'bg-white text-[#0b1c3f] shadow-sm border border-white/90 scale-102'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Minha Conta</span>
            </button>
          </div>

          {/* Right Action Island: Search + WhatsApp + Sacola */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Desktop Instant Search Pill */}
            {activeTab === 'menu' && (
              <div className="relative hidden sm:flex items-center">
                <Search className="absolute left-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar massas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-search rounded-full py-1.5 pl-8.5 pr-7 text-xs text-gray-800 placeholder-gray-400 w-32 md:w-44 lg:w-56 focus:w-64 outline-hidden border border-white/80 transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 p-0.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Quick WhatsApp Contact Pill */}
            <a
              href={`https://wa.me/${activeWhatsApp}`}
              target="_blank"
              rel="noreferrer"
              className="glass-pill hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-emerald-800 hover:text-emerald-900"
              title="Falar no WhatsApp"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>

            {/* Sacola Trigger Button */}
            <button
              id="btn-nav-cart"
              onClick={() => setIsCartOpen(true)}
              className="glass-button-primary rounded-full px-3.5 sm:px-4 py-2 text-xs font-black flex items-center gap-2 shadow-md cursor-pointer hover:scale-102 transition-transform shrink-0"
              title="Abrir Sacola"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-[#f6e09e]" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[9px] font-black text-[#0b1c3f] shadow-xs">
                    {cartItemsCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">Sacola</span>
              {cartItemsCount > 0 && (
                <span className="hidden xl:inline text-[#f6e09e] font-mono">
                  • {formatPrice(cartTotalValue)}
                </span>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Segmented Row (When on mobile screens) */}
        <div className="flex md:hidden mt-2.5 p-1 rounded-full glass-panel border border-white/80 shadow-sm justify-between">
          <button
            onClick={() => {
              setActiveTab('menu');
              setSearchQuery('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-white text-[#0b1c3f] shadow-xs border border-white/90'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Cardápio</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              activeTab === 'about'
                ? 'bg-white text-[#0b1c3f] shadow-xs border border-white/90'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Sobre</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              activeTab === 'account'
                ? 'bg-white text-[#0b1c3f] shadow-xs border border-white/90'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Conta</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 relative z-10">
        
        {/* TAB 1: CARDÁPIO (MENU) */}
        {activeTab === 'menu' && (
          <div className="space-y-6">

            {/* A. Hero Showcase Banner with iOS Liquid Glass Depth */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 lg:p-10 border border-white/80 shadow-xl overflow-hidden relative">
              {/* Subtle ambient lighting vignette inside banner */}
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 hidden lg:block pointer-events-none">
                <img
                  src="https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=1200"
                  alt="Massas"
                  className="w-full h-full object-cover object-center mask-radial"
                />
              </div>

              <div className="relative z-10 max-w-2xl text-left">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="glass-pill inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black text-[#0b1c3f]">
                    <Heart className="w-3.5 h-3.5 fill-[#0b1c3f]" />
                    <span>Feito com Tradição & Amor de Família</span>
                  </span>
                  <span className="glass-pill inline-flex items-center gap-1 px-2.5 py-1 text-xs font-extrabold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Primavera do Leste - MT</span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-950 tracking-tight leading-tight">
                  Massas Frescas e Molhos Artesanais da Vovó
                </h1>

                <p className="mt-2.5 text-xs sm:text-sm text-gray-600 leading-relaxed font-normal max-w-xl">
                  {RESTAURANT_INFO.description} Monte seu prato artesanal, escolha tamanhos, molhos caseiros e receba quentinho no conforto da sua casa.
                </p>

                {/* Feature Highlights Row */}
                <div className="mt-5 pt-4 border-t border-white/60 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-gray-700">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#0b1c3f]" />
                    <span>{RESTAURANT_INFO.hours}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#0b1c3f]" />
                    <a
                      href={RESTAURANT_INFO.googleMapsLink}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-[#0b1c3f] underline transition"
                    >
                      {RESTAURANT_INFO.address}
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Sem Conservantes • Ingredientes Nobres</span>
                  </div>
                </div>
              </div>
            </div>

            {/* B. Mobile Search Bar (Only visible on small screens) */}
            <div className="sm:hidden relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar no cardápio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full glass-search py-2.5 pl-10 pr-4 text-xs text-gray-800 placeholder-gray-400 border border-white/80 outline-hidden font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* C. Split Workspace: Left (Catalog) + Right (Desktop Sticky Cart) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Category Pills + Dish Grid (Spans 8 cols on desktop) */}
              <div className="lg:col-span-8 space-y-6">

                {/* Category Pills Navigation (Horizontal Liquid Glass Track) */}
                <div className="w-full overflow-hidden">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
                    {CATEGORIES.map((category) => {
                      const isSelected = selectedCategory === category.id && searchQuery === '';
                      return (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setSearchQuery('');
                          }}
                          className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-black whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                            isSelected
                              ? 'glass-button-primary scale-102 shadow-md'
                              : 'glass-pill text-gray-700 hover:text-gray-950'
                          }`}
                        >
                          <span className="text-sm leading-none">{category.icon}</span>
                          <span>{category.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Search feedback indicator */}
                {searchQuery.trim() !== '' && (
                  <div className="text-xs text-gray-600 flex items-center justify-between glass-panel p-3.5 rounded-2xl border border-white/80">
                    <div className="flex items-center gap-1.5">
                      <span>Resultados para:</span>
                      <strong className="text-gray-950 font-black">"{searchQuery}"</strong>
                      <span className="text-gray-400">•</span>
                      <span>{filteredProducts.length} pratos encontrados</span>
                    </div>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-[#0b1c3f] hover:underline font-extrabold cursor-pointer"
                    >
                      Limpar busca
                    </button>
                  </div>
                )}

                {/* Product Dishes Grid */}
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16 glass-panel rounded-3xl p-8 border border-white/80 shadow-sm">
                    <div className="text-4xl mb-3">🍝</div>
                    <h3 className="text-base font-black text-gray-900">Nenhum prato encontrado</h3>
                    <p className="mt-1 text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                      Não encontramos pratos correspondentes aos termos digitados. Tente outra busca ou selecione outra categoria.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory(CategoryId.LASANHAS);
                      }}
                      className="mt-4 glass-button-primary rounded-full px-4 py-2 text-xs font-black"
                    >
                      Ver Lasanhas da Vovó
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onSelect={(p) => setSelectedProduct(p)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Desktop Persistent Liquid Glass Order Comanda (Spans 4 cols on desktop) */}
              <div className="hidden lg:block lg:col-span-4 sticky top-22 self-start">
                <div className="glass-panel rounded-3xl p-6 border border-white/80 shadow-xl flex flex-col text-left">
                  
                  {/* Comanda Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/60">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#0b1c3f] text-[#d4af37] shadow-sm">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-gray-950 tracking-tight">Sua Sacola</h3>
                        <p className="text-[11px] text-gray-400 font-semibold">
                          {cartItemsCount} {cartItemsCount === 1 ? 'item adicionado' : 'itens adicionados'}
                        </p>
                      </div>
                    </div>

                    {cartItems.length > 0 && (
                      <button
                        onClick={handleClearCart}
                        className="text-[11px] text-gray-400 hover:text-red-600 transition font-bold cursor-pointer"
                        title="Limpar todos os itens"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Comanda Body: Items or Empty State */}
                  <div className="py-4">
                    {cartItems.length === 0 ? (
                      <div className="py-12 text-center flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-white/70 backdrop-blur-md border border-white/90 flex items-center justify-center text-2xl shadow-inner mb-3">
                          🥣
                        </div>
                        <h4 className="text-sm font-black text-gray-800">Sacola Vazia</h4>
                        <p className="mt-1 text-xs text-gray-500 max-w-[200px] leading-relaxed">
                          Escolha seus pratos artesanais ao lado para montar seu pedido.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
                        {cartItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-2xl bg-white/70 backdrop-blur-md border border-white/90 shadow-xs flex items-start gap-2.5"
                          >
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600';
                              }}
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <h5 className="text-xs font-extrabold text-gray-950 truncate leading-tight">
                                  {item.product.name}
                                </h5>
                                <button
                                  onClick={() => handleRemoveCartItem(item.id)}
                                  className="text-gray-300 hover:text-red-500 transition p-0.5 cursor-pointer"
                                  title="Remover"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Customization Details snippet */}
                              {(item.customization?.selectedSize || item.customization?.selectedPasta || item.customization?.selectedSauce) && (
                                <p className="text-[10px] text-gray-500 truncate mt-0.5 font-medium">
                                  {[
                                    item.customization.selectedSize?.name,
                                    item.customization.selectedPasta?.name,
                                    item.customization.selectedSauce?.name
                                  ].filter(Boolean).join(' • ')}
                                </p>
                              )}

                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs font-black text-[#0b1c3f]">
                                  {formatPrice(item.totalUnitPrice * item.quantity)}
                                </span>

                                {/* Stepper */}
                                <div className="flex items-center gap-1.5 border border-white/80 rounded-full bg-white/80 px-1 py-0.5 shadow-xs">
                                  <button
                                    onClick={() => handleUpdateCartQuantity(item.id, item.quantity - 1)}
                                    className="p-1 rounded-full hover:bg-white text-gray-600 cursor-pointer"
                                  >
                                    <Minus className="w-2.5 h-2.5" />
                                  </button>
                                  <span className="text-[11px] font-black text-gray-900 w-3.5 text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => handleUpdateCartQuantity(item.id, item.quantity + 1)}
                                    className="p-1 rounded-full hover:bg-white text-gray-600 cursor-pointer"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Comanda Footer: Totals and Checkout CTA */}
                  {cartItems.length > 0 && (
                    <div className="pt-4 border-t border-white/60 space-y-3">
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-gray-500">
                          <span>Subtotal dos Pratos</span>
                          <span className="font-extrabold text-gray-900">{formatPrice(cartTotalValue)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Entrega (Primavera do Leste)</span>
                          <span className="font-semibold text-emerald-700">Calculada no checkout</span>
                        </div>
                        <div className="pt-2 border-t border-white/60 flex justify-between items-baseline">
                          <span className="font-black text-sm text-gray-950">Total Estimado</span>
                          <span className="font-black text-lg text-[#0b1c3f] tracking-tight">{formatPrice(cartTotalValue)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsCartOpen(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-full glass-button-primary py-3.5 px-5 text-sm font-black shadow-lg cursor-pointer hover:scale-101 transition-all"
                      >
                        <span>Finalizar Pedido</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <p className="text-[10px] text-gray-400 text-center font-medium">
                        ✨ Pagamento via Pix, Cartão ou Dinheiro na Entrega
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: QUEM SOMOS / CONTATO */}
        {activeTab === 'about' && (
          <AboutTab />
        )}

        {/* TAB 3: MINHA CONTA */}
        {activeTab === 'account' && (
          <MyAccountView />
        )}
      </main>

      {/* 3. Discreet Footer */}
      <footer className="mt-20 text-center text-xs text-gray-400 max-w-4xl mx-auto px-4 space-y-1.5 relative z-10">
        <p className="font-semibold text-gray-500">© Massas da Vovó • Feito com tradição e amor de família</p>
        <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5 flex-wrap">
          <span>Primavera do Leste - MT</span>
          <span>•</span>
          <a
            href={RESTAURANT_INFO.googleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-600 hover:text-red-700 underline font-extrabold transition inline-flex items-center gap-1"
          >
            <span>Ver no Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </footer>

      {/* 4. Mobile Bottom Floating Cart Summary (Only shows on mobile/tablet when cart has items) */}
      {cartItemsCount > 0 && (
        <div className="lg:hidden fixed bottom-4 inset-x-4 max-w-lg mx-auto z-40">
          <div className="glass-panel rounded-full p-3 sm:p-4 border border-white/90 shadow-[0_16px_40px_rgba(0,0,0,0.12)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 pl-1">
              <div className="relative p-2.5 rounded-full bg-[#0b1c3f] text-[#d4af37] shadow-sm">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-black text-[#0b1c3f] shadow-xs">
                  {cartItemsCount}
                </span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">Sua Sacola</span>
                <span className="text-base font-black text-[#0b1c3f] mt-0.5 leading-none">{formatPrice(cartTotalValue)}</span>
              </div>
            </div>

            <button
              id="btn-open-checkout-drawer-mobile"
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1.5 rounded-full glass-button-primary py-3 px-5 text-xs font-black shadow-md cursor-pointer active:scale-95 transition-transform shrink-0"
            >
              <span>Ver Sacola</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Modals & Drawer Overlays */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {isCartOpen && (
        <CartDrawer
          cartItems={cartItems}
          onClose={() => setIsCartOpen(false)}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
        />
      )}
    </div>
  );
}

export default function App() {
  // Check if current URL is /Master or /master or #/Master
  const checkIsMasterUrl = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path === '/master' ||
      path.startsWith('/master/') ||
      hash === '#/master' ||
      hash === '#master' ||
      hash.startsWith('#/master') ||
      search.includes('master')
    );
  };

  const [isMasterRoute, setIsMasterRoute] = useState<boolean>(checkIsMasterUrl);

  useEffect(() => {
    const handleUrlChange = () => {
      setIsMasterRoute(checkIsMasterUrl());
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleBackToMenu = () => {
    try {
      window.history.pushState(null, '', '/');
    } catch {
      window.location.hash = '/';
    }
    setIsMasterRoute(false);
  };

  return (
    <CompanyProvider>
      <AuthProvider>
        {isMasterRoute ? (
          <MasterAdminView onBackToMenu={handleBackToMenu} />
        ) : (
          <MainApp />
        )}
      </AuthProvider>
    </CompanyProvider>
  );
}

// Minimal placeholder component for offline state indicator
export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full glass-panel px-4 py-2 text-xs font-bold text-amber-800 shadow-lg border border-amber-300/40">
      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
      Modo Offline — Exibindo dados locais.
    </div>
  );
};
