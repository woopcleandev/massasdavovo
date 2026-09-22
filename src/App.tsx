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
import { 
  ShoppingBag, Search, Clock, MapPin, X, Info, Phone, 
  ArrowRight, Heart, User, Sparkles, SlidersHorizontal,
  ChevronRight, Utensils, Star, Flame, Check, Sun, Moon, Monitor
} from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { CompanyProvider, useCompany } from './context/CompanyContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { MyAccountView } from './components/MyAccountView';
import { MasterAdminView } from './components/MasterAdminView';

function MainApp() {
  const { allProducts, settings } = useCompany();
  const { themeMode, setThemeMode, resolvedTheme } = useTheme();

  // Navigation & filtering state
  const [activeTab, setActiveTab] = useState<'menu' | 'about' | 'account'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPopularOnly, setFilterPopularOnly] = useState(false);

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

  const handleUpdateCartQuantity = (itemId: string, delta: number) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Filter products by selected category, popular badge, and search query
  const filteredProducts = allProducts.filter((product) => {
    // Category match
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;

    // Popular match
    const matchesPopular = !filterPopularOnly || product.isPopular;

    // Search query match (name, description, ingredients)
    const matchesSearch =
      !searchQuery.trim() ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesPopular && matchesSearch;
  });

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const cartItemsCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const cartTotalValue = cartItems.reduce((acc, curr) => acc + curr.totalUnitPrice * curr.quantity, 0);

  const activeWhatsApp = settings.whatsappNumber || RESTAURANT_INFO.whatsappNumber;
  const activePhone = settings.phone || RESTAURANT_INFO.phone;

  // Signature featured product for desktop spotlight banner
  const featuredProduct = allProducts.find(p => p.id === 'lasanha-bolonhesa') || allProducts[0];

  const toggleTheme = () => {
    if (themeMode === 'light') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('system');
    } else {
      setThemeMode('light');
    }
  };

  return (
    <div className="min-h-screen obsidian-ambient-bg antialiased font-sans pb-28 selection:bg-amber-400 selection:text-black relative overflow-x-hidden transition-colors duration-300">
      
      {/* Background Ambient Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[130px]" />
        <div className="absolute top-1/2 right-10 w-[30rem] h-[30rem] bg-orange-600/8 rounded-full blur-[160px]" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-[140px]" />
      </div>

      {/* 1. Header & Navigation (Liquid Glass System - Completely Rounded) */}
      <header className="sticky top-2 sm:top-3 z-40 px-2 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-all duration-300">
        <nav className="dark-glass-panel rounded-full px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-1.5 sm:gap-4 border shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
          
          {/* Brand Identity / Logo */}
          <div 
            onClick={() => { setActiveTab('menu'); setSelectedCategory('all'); setSearchQuery(''); }}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0 min-w-0 max-w-[150px] xs:max-w-[200px] sm:max-w-none group select-none"
          >
            <div className="relative p-0.5 rounded-full bg-white/20 dark:bg-white/5 backdrop-blur-md border border-amber-400/40 group-hover:scale-105 transition-transform duration-300 shadow-sm shrink-0">
              <img
                src={RESTAURANT_INFO.logo}
                alt={RESTAURANT_INFO.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 sm:w-11 sm:h-11 rounded-full object-cover"
              />
              <span className="absolute bottom-0 right-0 flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500 border border-black" />
              </span>
            </div>
            
            <div className="flex flex-col text-left min-w-0">
              <span className="text-xs sm:text-base font-black text-stone-900 dark:text-white tracking-tight leading-none group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors flex items-center gap-1.5 truncate">
                <span className="truncate">{RESTAURANT_INFO.name}</span>
                <span className="hidden lg:inline-flex items-center text-[10px] font-black text-amber-600 dark:text-amber-300 bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  Artesanal
                </span>
              </span>
              <span className="text-[9px] sm:text-[11px] text-stone-500 dark:text-gray-400 font-semibold tracking-wide leading-none mt-1 truncate">
                Primavera do Leste - MT • Aberto
              </span>
            </div>
          </div>

          {/* Desktop Central Navigation Capsule */}
          <div className="hidden md:flex items-center gap-1 p-1 rounded-full dark-glass-pill border shadow-inner">
            <button
              onClick={() => {
                setActiveTab('menu');
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-amber-400 text-black shadow-md scale-102 font-extrabold'
                  : 'text-stone-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Cardápio Digital</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === 'about'
                  ? 'bg-amber-400 text-black shadow-md scale-102 font-extrabold'
                  : 'text-stone-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Quem Somos</span>
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === 'account'
                  ? 'bg-amber-400 text-black shadow-md scale-102 font-extrabold'
                  : 'text-stone-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Minha Conta</span>
            </button>
          </div>

          {/* Right Island: Theme Switcher + WhatsApp + Sacola */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Quick Theme Toggle Button (Round) */}
            <button
              onClick={toggleTheme}
              className="dark-glass-pill rounded-full p-2 sm:p-2.5 text-stone-700 dark:text-gray-300 hover:text-amber-500 dark:hover:text-amber-400 cursor-pointer transition shadow-xs flex items-center justify-center shrink-0"
              title={`Tema atual: ${themeMode === 'system' ? 'Automático (' + resolvedTheme + ')' : themeMode === 'light' ? 'Claro' : 'Escuro'}. Clique para alterar.`}
              aria-label="Alternar modo claro e escuro"
            >
              {themeMode === 'system' ? (
                <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400" />
              ) : resolvedTheme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
              )}
            </button>

            {/* Quick WhatsApp Contact Pill - Desktop only */}
            <a
              href={`https://wa.me/${activeWhatsApp}`}
              target="_blank"
              rel="noreferrer"
              className="dark-glass-pill hidden lg:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 hover:border-emerald-400/40 cursor-pointer shadow-xs"
              title="Falar no WhatsApp"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>WhatsApp</span>
            </a>

            {/* Sacola Trigger Button - Compact & Perfectly fitted on Mobile */}
            <button
              id="btn-nav-cart"
              onClick={() => setIsCartOpen(true)}
              className="dark-glass-button-gold rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-xs font-black flex items-center gap-1.5 sm:gap-2 shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-transform shrink-0"
              title="Abrir Sacola"
            >
              <div className="relative flex items-center">
                <ShoppingBag className="w-4 h-4 text-black stroke-[2.5]" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white shadow-md">
                    {cartItemsCount}
                  </span>
                )}
              </div>
              <span className="hidden md:inline">Sacola</span>
              {cartItemsCount > 0 && (
                <span className="font-mono font-black text-black text-[11px] sm:text-xs">
                  {formatPrice(cartTotalValue)}
                </span>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Segmented Row (Small screens - Completely Rounded) */}
        <div className="flex md:hidden mt-2 p-1 rounded-full dark-glass-panel border shadow-md justify-between items-center">
          <button
            onClick={() => {
              setActiveTab('menu');
              setSearchQuery('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-amber-400 text-black shadow-xs font-extrabold'
                : 'text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Cardápio</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              activeTab === 'about'
                ? 'bg-amber-400 text-black shadow-xs font-extrabold'
                : 'text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Sobre</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              activeTab === 'account'
                ? 'bg-amber-400 text-black shadow-xs font-extrabold'
                : 'text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Conta</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 sm:mt-7 relative z-10">
        
        {/* TAB 1: CARDÁPIO (MENU) */}
        {activeTab === 'menu' && (
          <div className="space-y-6">

            {/* A. Top Search & Filter Bar (Completely Rounded) */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar seu prato artesanal favorito..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full dark-glass-search py-3.5 pl-12 pr-12 text-sm placeholder-stone-400 dark:placeholder-gray-500 outline-none font-medium border"
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-stone-400 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-stone-200 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setFilterPopularOnly(!filterPopularOnly)}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-2 rounded-full border cursor-pointer transition ${
                      filterPopularOnly
                        ? 'bg-amber-400 text-black border-amber-300 shadow-xs'
                        : 'text-stone-500 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5'
                    }`}
                    title="Filtrar mais pedidos"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Filter Pill Buttons - Completely Rounded */}
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar shrink-0 pb-1 sm:pb-0">
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setFilterPopularOnly(false);
                    setSearchQuery('');
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'all' && !filterPopularOnly
                      ? 'bg-amber-400 text-black border-amber-400 shadow-sm font-extrabold'
                      : 'dark-glass-pill text-stone-600 dark:text-gray-300 hover:text-black dark:hover:text-white'
                  }`}
                >
                  Todos ({allProducts.length})
                </button>

                <button
                  onClick={() => setFilterPopularOnly(!filterPopularOnly)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    filterPopularOnly
                      ? 'bg-amber-400 text-black border-amber-400 shadow-sm font-extrabold'
                      : 'dark-glass-pill text-stone-600 dark:text-gray-300 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>Mais Pedidos</span>
                </button>
              </div>
            </div>

            {/* B. Category Squircle Bar (Rounded smoothly) */}
            <div className="w-full overflow-hidden">
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
                {CATEGORIES.map((category) => {
                  const isSelected = selectedCategory === category.id;
                  const categoryCount = allProducts.filter(p => p.categoryId === category.id).length;

                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setFilterPopularOnly(false);
                      }}
                      className={`group flex flex-col items-center justify-center p-3 rounded-2xl min-w-[5.25rem] sm:min-w-[6rem] transition-all border cursor-pointer select-none shrink-0 ${
                        isSelected
                          ? 'bg-amber-400/20 border-amber-400 text-stone-900 dark:text-white shadow-[0_0_20px_rgba(212,175,55,0.25)] scale-103'
                          : 'dark-glass-card hover:border-amber-400/40 text-stone-600 dark:text-gray-300 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      {/* Emoji / Food Icon */}
                      <span className="text-2xl sm:text-3xl filter drop-shadow-md mb-1.5 group-hover:scale-110 transition-transform">
                        {category.icon}
                      </span>
                      {/* Category Label */}
                      <span className={`text-[11px] sm:text-xs font-extrabold tracking-tight truncate max-w-[5rem] text-center ${
                        isSelected ? 'text-amber-600 dark:text-amber-300' : 'text-stone-700 dark:text-gray-300'
                      }`}>
                        {category.name}
                      </span>
                      {/* Mini count badge */}
                      <span className="text-[9px] text-stone-400 dark:text-gray-500 font-semibold mt-0.5">
                        {categoryCount} opções
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* C. Desktop Featured Dish Hero Spotlight */}
            {selectedCategory === 'all' && !searchQuery && !filterPopularOnly && featuredProduct && (
              <div 
                onClick={() => setSelectedProduct(featuredProduct)}
                className="hidden lg:flex dark-glass-card rounded-3xl p-6 border items-center justify-between gap-8 cursor-pointer hover:border-amber-400/50 transition-all group overflow-hidden relative shadow-2xl"
              >
                {/* Ambient glow inside */}
                <div className="absolute -left-20 -top-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="space-y-3 max-w-xl z-10 text-left">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/30 text-xs font-black flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      Destaque da Vovó em Primavera do Leste
                    </span>
                    <span className="text-xs text-stone-500 dark:text-gray-400 font-medium">★ 4.9 (Mais de 500 pedidos)</span>
                  </div>

                  <h2 className="text-2xl xl:text-3xl font-black text-stone-900 dark:text-white tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                    {featuredProduct.name}
                  </h2>

                  <p className="text-xs xl:text-sm text-stone-600 dark:text-gray-400 leading-relaxed font-normal">
                    {featuredProduct.description} Feito com massa artesanal fresca, molho lentamente cozido e muito carinho de vó.
                  </p>

                  <div className="pt-2 flex items-center gap-4">
                    <span className="text-2xl font-black text-amber-500 dark:text-amber-400 font-mono">
                      {formatPrice(featuredProduct.price)}
                    </span>
                    <button className="dark-glass-button-gold rounded-full px-5 py-2.5 text-xs font-black flex items-center gap-2 cursor-pointer shadow-md">
                      <span>Personalizar e Pedir</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Big Floating Food Image */}
                <div className="relative w-64 h-52 shrink-0 dish-halo flex items-center justify-center">
                  <img
                    src={featuredProduct.image}
                    alt={featuredProduct.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-3xl shadow-2xl border border-stone-200 dark:border-white/10 group-hover:scale-105 transition-transform duration-500 relative z-10"
                  />
                </div>
              </div>
            )}

            {/* D. Category Heading & Count */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>
                    {selectedCategory === 'all' 
                      ? (filterPopularOnly ? 'Pratos Mais Populares 🔥' : 'Nosso Cardápio Completo') 
                      : CATEGORIES.find(c => c.id === selectedCategory)?.name}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-gray-400 font-semibold">
                    ({filteredProducts.length} {filteredProducts.length === 1 ? 'prato' : 'pratos'})
                  </span>
                </h3>
              </div>

              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                >
                  Ver todas as categorias
                </button>
              )}
            </div>

            {/* E. Product Dishes Grid (4 cols on desktop) */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 dark-glass-card rounded-3xl p-8 border border-stone-200 dark:border-white/10 shadow-lg">
                <div className="text-5xl mb-3">🍝</div>
                <h3 className="text-base font-black text-stone-900 dark:text-white">Nenhum prato encontrado</h3>
                <p className="mt-1 text-xs text-stone-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
                  Não encontramos pratos com os termos digitados. Tente outra busca ou limpe os filtros.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setFilterPopularOnly(false);
                  }}
                  className="mt-4 dark-glass-button-gold rounded-full px-5 py-2 text-xs font-black"
                >
                  Ver Cardápio Completo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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

      {/* 3. Footer */}
      <footer className="mt-20 text-center text-xs text-stone-500 dark:text-gray-400 max-w-4xl mx-auto px-4 space-y-1 relative z-10 pb-28 sm:pb-8">
        <p className="font-semibold text-stone-600 dark:text-gray-300">© Massas da Vovó • Tradição, Afeto e Sabor Artesanal</p>
        <p className="text-[11px] text-stone-500 dark:text-gray-400 flex items-center justify-center gap-1.5 flex-wrap">
          <span>Primavera do Leste - MT</span>
          <span>•</span>
          <a
            href={RESTAURANT_INFO.googleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 dark:text-amber-400 hover:underline font-bold"
          >
            Ver localização no mapa
          </a>
        </p>
      </footer>

      {/* 4. Mobile Bottom Floating Cart Summary (Active when cart has items and no modal/drawer open) */}
      {cartItemsCount > 0 && !isCartOpen && !selectedProduct && activeTab === 'menu' && (
        <div className="fixed bottom-3 sm:bottom-4 inset-x-3 sm:inset-x-4 max-w-md mx-auto z-30 animate-fade-in">
          <div className="dark-glass-panel rounded-full p-2.5 sm:p-3.5 border shadow-[0_16px_50px_rgba(0,0,0,0.4)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.85)] flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 pl-1 min-w-0">
              <div className="relative p-2 rounded-full bg-amber-400 text-black shadow-md shrink-0">
                <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white shadow-xs">
                  {cartItemsCount}
                </span>
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider leading-none truncate">Sua Sacola</span>
                <span className="text-sm sm:text-base font-black text-amber-500 dark:text-amber-400 mt-0.5 leading-none font-mono truncate">
                  {formatPrice(cartTotalValue)}
                </span>
              </div>
            </div>

            <button
              id="btn-open-checkout-drawer-mobile"
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1.5 rounded-full dark-glass-button-gold py-2 sm:py-2.5 px-4 sm:px-5 text-xs font-black shadow-md cursor-pointer active:scale-95 transition-transform shrink-0"
            >
              <span>Ver Pedido</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
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
    <ThemeProvider>
      <CompanyProvider>
        <AuthProvider>
          {isMasterRoute ? (
            <MasterAdminView onBackToMenu={handleBackToMenu} />
          ) : (
            <MainApp />
          )}
        </AuthProvider>
      </CompanyProvider>
    </ThemeProvider>
  );
}
