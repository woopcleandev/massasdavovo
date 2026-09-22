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
import { ShoppingBag, Search, Clock, MapPin, Menu, X, Info, Phone, ArrowRight, Heart, User, ShieldCheck } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { CompanyProvider, useCompany } from './context/CompanyContext';
import { MyAccountView } from './components/MyAccountView';
import { MasterAdminView } from './components/MasterAdminView';

function MainApp() {
  const { allProducts, settings } = useCompany();

  // Navigation & filtering state
  const [activeTab, setActiveTab] = useState<string>('menu'); // 'menu' | 'about' | 'account'

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
        // Increment quantity if identical item exists
        const updated = [...prevItems];
        updated[existingItemIndex].quantity += newItem.quantity;
        return updated;
      }
      return [...prevItems, newItem];
    });
  };

  const handleUpdateCartQuantity = (id: string, newQuantity: number) => {
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

  // Filter products based on active category AND search query (from dynamic allProducts)
  const filteredProducts = allProducts.filter((product) => {
    const matchesCategory = activeTab === 'menu' && product.categoryId === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (searchQuery.trim() !== '') {
      return matchesSearch; // ignore category constraint when searching actively
    }
    return matchesCategory;
  });

  const cartItemsCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const cartTotalValue = cartItems.reduce((acc, curr) => acc + curr.totalUnitPrice * curr.quantity, 0);

  const activeWhatsApp = settings.whatsappNumber || RESTAURANT_INFO.whatsappNumber;
  const activePhone = settings.phone || RESTAURANT_INFO.phone;

  return (
    <div className="min-h-screen bg-[#FCFBF7] text-gray-800 antialiased font-sans pb-24 selection:bg-[#0b1c3f]/10 selection:text-[#0b1c3f]">
      
      {/* 1. Header Banner / Cover */}
      <div className="relative h-44 sm:h-52 w-full bg-[#0b1c3f] overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70 z-10" />
        <img
          src="https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=1200"
          alt="Massas da Vovó"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-85 scale-102 filter blur-xs"
        />
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#d4af37] via-[#f7e39d] to-[#d4af37] z-20" />
      </div>

      {/* 2. Restaurant Profile Header Area */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 sm:-mt-20 relative z-20">
        <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-5">
          {/* Circular Logo */}
          <div className="relative -mt-16 sm:-mt-20 md:mt-0 shrink-0">
            <div className="p-1 rounded-full bg-white shadow-lg">
              <img
                src={RESTAURANT_INFO.logo}
                alt={RESTAURANT_INFO.name}
                referrerPolicy="no-referrer"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border border-[#d4af37]/30"
              />
            </div>
            <span className="absolute bottom-1 right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
            </span>
          </div>

          {/* Core Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-2 justify-center md:justify-start">
                  <span>{RESTAURANT_INFO.name}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] bg-[#0b1c3f]/10 text-[#0b1c3f] font-bold px-2 py-0.5 rounded-sm border border-[#0b1c3f]/20">
                    <Heart className="w-3 h-3 fill-[#0b1c3f]" />
                    <span>Família</span>
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-lg leading-relaxed line-clamp-1 sm:line-clamp-none">
                  {RESTAURANT_INFO.description}
                </p>
              </div>

              {/* Install PWA Button */}
              <div className="shrink-0 mt-2 sm:mt-0">
                <PWAInstallButton />
              </div>
            </div>

            {/* Micro Details Row */}
            <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2.5 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#0b1c3f] shrink-0" />
                <span className="font-semibold text-gray-800">{RESTAURANT_INFO.hours}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#0b1c3f] shrink-0" />
                <a
                  href={RESTAURANT_INFO.googleMapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#0b1c3f] underline font-semibold transition truncate max-w-[200px] sm:max-w-xs"
                >
                  {RESTAURANT_INFO.address}
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <a
                  href={`https://wa.me/${activeWhatsApp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-600 underline font-semibold transition"
                >
                  {activePhone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs (Cardápio vs Quem Somos vs Minha Conta) */}
      <div className="max-w-4xl mx-auto px-4 mt-6 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar whitespace-nowrap scroll-smooth">
          <button
            onClick={() => {
              setActiveTab('menu');
              setSearchQuery('');
            }}
            className={`py-3.5 px-4 sm:px-6 font-bold text-sm tracking-wide border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'menu'
                ? 'border-[#0b1c3f] text-[#0b1c3f]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Menu className="w-4 h-4" />
            <span>CARDÁPIO DIGITAL</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`py-3.5 px-4 sm:px-6 font-bold text-sm tracking-wide border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'about'
                ? 'border-[#0b1c3f] text-[#0b1c3f]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>QUEM SOMOS / CONTATO</span>
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`py-3.5 px-4 sm:px-6 font-bold text-sm tracking-wide border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'account'
                ? 'border-[#0b1c3f] text-[#0b1c3f]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <User className="w-4 h-4" />
            <span>MINHA CONTA</span>
          </button>
        </div>
      </div>

      {/* 4. Active Tab Content Rendering */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {activeTab === 'about' && (
          <AboutTab />
        )}

        {activeTab === 'account' && (
          <MyAccountView />
        )}

        {activeTab === 'menu' && (
          <div className="space-y-6">

            {/* Search and Category filters */}
            <div className="flex flex-col gap-4">
              
              {/* Search bar input - Max width constrained */}
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar no cardápio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-gray-200/80 bg-white py-2.5 pl-10 pr-4 text-xs focus:ring-[#0b1c3f] focus:border-[#d4af37] outline-hidden shadow-xs hover:border-gray-300 transition"
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

              {/* Category selector pills */}
              <div className="w-full max-w-full overflow-hidden">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setSearchQuery('');
                      }}
                      className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-extrabold whitespace-nowrap transition-all border shrink-0 ${
                        selectedCategory === category.id && searchQuery === ''
                          ? 'bg-[#0b1c3f] text-[#d4af37] border-[#d4af37]/30 shadow-md scale-102'
                          : 'bg-white text-gray-600 hover:text-gray-800 border-gray-200/80 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-sm leading-none">{category.icon}</span>
                      <span>{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Active filters summary */}
            {searchQuery.trim() !== '' && (
              <div className="text-xs text-gray-500 flex items-center gap-1 border bg-gray-50 p-3 rounded-xl">
                <span>Buscando por:</span>
                <strong className="text-gray-800">"{searchQuery}"</strong>
                <span className="text-gray-300">•</span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#0b1c3f] hover:underline font-bold"
                >
                  Limpar busca
                </button>
              </div>
            )}

            {/* Product cards listings grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-100 rounded-3xl p-6 shadow-xs">
                <div className="text-4xl">🍝</div>
                <h3 className="mt-3 text-base font-extrabold text-gray-800">Nenhum produto encontrado</h3>
                <p className="mt-1 text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                  Não encontramos nenhum prato correspondente aos termos digitados ou à categoria selecionada.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
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
      </div>

      {/* Discreet Footer */}
      <footer className="mt-16 text-center text-xs text-gray-400 max-w-4xl mx-auto px-4 space-y-1.5">
        <p>© Massas da Vovó • Feito com tradição e amor de família</p>
        <p className="text-[11px] text-gray-400">
          <span>Primavera do Leste - MT</span>
          <span className="mx-1.5">•</span>
          <a
            href="https://maps.app.goo.gl/hecpUqJLLVd8EghW9"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-600 hover:text-red-700 underline font-semibold transition inline-flex items-center gap-1"
          >
            <span>Ver no Google Maps</span>
          </a>
        </p>
      </footer>

      {/* 5. Floating Bottom Cart Summary (Anota Aí Style) */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] p-4 sm:p-5 flex items-center justify-between max-w-xl mx-auto rounded-t-3xl border-x">
          <div className="flex items-center gap-3">
            <div className="relative p-3 rounded-2xl bg-[#0b1c3f] text-[#d4af37] border border-[#d4af37]/30 shadow-md animate-bounce">
              <ShoppingBag className="w-5.5 h-5.5" />
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-extrabold text-[#0b1c3f] shadow-sm border border-white">
                {cartItemsCount}
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">Minha Sacola</span>
              <span className="text-base font-extrabold text-[#0b1c3f] mt-1 leading-none">{formatPrice(cartTotalValue)}</span>
            </div>
          </div>

          <button
            id="btn-open-checkout-drawer"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-[#0b1c3f] hover:bg-[#07132c] py-3.5 px-6 text-sm font-extrabold text-[#d4af37] border border-[#d4af37]/20 transition-all shadow-md active:scale-95 transform hover:scale-101 shrink-0 cursor-pointer"
          >
            <span>Ver Sacola</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 6. Modals & Drawer Overlays */}
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
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg border border-amber-400/20">
      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
      Modo Offline — Exibindo informações armazenadas em cache.
    </div>
  );
};

