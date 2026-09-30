import React, { useState, useEffect } from 'react';
import { Product, CustomizationOption, CartItem } from '../types';
import { X, Minus, Plus, ShoppingBag, Star, Clock, Sparkles } from 'lucide-react';
import { formatPrice } from '../utils/format';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onAddToCart }) => {
  // State for sizes
  const [selectedSize, setSelectedSize] = useState<{ name: string; price: number } | undefined>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined
  );

  // State for customizable parts
  const [selectedPasta, setSelectedPasta] = useState<CustomizationOption | undefined>(
    product.customizable?.pastas && product.customizable.pastas.length > 0
      ? product.customizable.pastas[0]
      : undefined
  );

  const [selectedSauce, setSelectedSauce] = useState<{ id: string; name: string; description: string } | undefined>(
    product.customizable?.sauces && product.customizable.sauces.length > 0
      ? product.customizable.sauces[0]
      : undefined
  );

  const [selectedToppings, setSelectedToppings] = useState<CustomizationOption[]>([]);

  // Notes and Quantity
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Calculate Unit Price based on choices
  const [unitPrice, setUnitPrice] = useState(product.price);

  useEffect(() => {
    let currentPrice = product.price;

    if (selectedSize) {
      currentPrice = selectedSize.price;
    }

    if (selectedPasta) {
      currentPrice += selectedPasta.price;
    }

    if (selectedToppings.length > 0) {
      const toppingsSum = selectedToppings.reduce((acc, curr) => acc + curr.price, 0);
      currentPrice += toppingsSum;
    }

    setUnitPrice(currentPrice);
  }, [product, selectedSize, selectedPasta, selectedToppings]);

  const handleToppingToggle = (topping: CustomizationOption) => {
    if (selectedToppings.some(t => t.id === topping.id)) {
      setSelectedToppings(selectedToppings.filter(t => t.id !== topping.id));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const handleAddToCart = () => {
    // Generate a unique ID for this configured cart item
    const customKey = [
      product.id,
      selectedSize?.name || 'std',
      selectedPasta?.id || '',
      selectedSauce?.id || '',
      selectedToppings.map(t => t.id).sort().join('-'),
      notes.trim()
    ].filter(Boolean).join('_');

    const cartItem: CartItem = {
      id: customKey,
      product,
      quantity,
      customization: {
        selectedSize,
        selectedPasta,
        selectedSauce,
        selectedToppings,
      },
      notes: notes.trim(),
      totalUnitPrice: unitPrice,
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-white dark:bg-[#13151c] rounded-3xl shadow-2xl border border-stone-200 dark:border-white/15 overflow-hidden text-stone-900 dark:text-white my-auto">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-stone-200 dark:border-white/10 bg-stone-50/80 dark:bg-[#13151c] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Personalizar Pedido
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-stone-200/80 dark:bg-white/10 hover:bg-stone-300 dark:hover:bg-white/20 text-stone-700 dark:text-gray-200 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 px-5 sm:px-6 pb-6 overflow-y-auto space-y-6 no-scrollbar">
          
          {/* Centered Floating Food Spotlight with Halo */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="relative w-52 h-52 sm:w-64 sm:h-64 flex items-center justify-center dish-halo">
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="relative z-10 w-full h-full object-cover rounded-3xl shadow-2xl border border-stone-200 dark:border-white/10"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600';
                }}
              />
              
              {/* Floating Badge - Completely Rounded */}
              <div className="absolute top-2 right-2 z-20 rounded-full bg-black/75 backdrop-blur-md border border-white/20 px-3 py-1 text-[11px] font-extrabold text-amber-300 flex items-center gap-1 shadow-md">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>100% Artesanal</span>
              </div>
            </div>

            {/* Stepper Floating Pill (+ 1 -) - Completely Rounded */}
            <div className="mt-4 flex items-center gap-4 bg-stone-100 dark:bg-white/10 rounded-full px-5 py-2 border border-stone-300 dark:border-white/15 shadow-sm">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-7 h-7 rounded-full flex items-center justify-center text-stone-700 dark:text-gray-300 hover:text-black dark:hover:text-white disabled:opacity-30 cursor-pointer active:scale-95 transition font-bold"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-base font-black text-stone-900 dark:text-white w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 cursor-pointer active:scale-95 transition font-bold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dish Details Header */}
          <div className="text-center sm:text-left space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">{product.name}</h2>
            <p className="text-xs sm:text-sm text-stone-700 dark:text-gray-300 leading-relaxed font-medium">{product.description}</p>
          </div>

          {/* Mini Specs Pill Row: Delivery Time & Rating - Completely Rounded */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-full p-3 px-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider leading-none">Preparo</span>
                <span className="text-xs font-black text-stone-900 dark:text-white mt-0.5">30 - 45 Min</span>
              </div>
            </div>

            <div className="bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-full p-3 px-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider leading-none">Avaliação</span>
                <span className="text-xs font-black text-stone-900 dark:text-white mt-0.5">4.9 ★★★★★</span>
              </div>
            </div>
          </div>

          {/* Size Options (If Available) */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-stone-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 dark:border-white/10 pb-2">
                <span>1. Escolha o Tamanho</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">Obrigatório</span>
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {product.sizes.map((size) => (
                  <label
                    key={size.name}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedSize?.name === size.name
                        ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-400/10 shadow-sm'
                        : 'border-stone-200 dark:border-white/10 hover:border-amber-400/40 bg-stone-50/50 dark:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="product-size"
                        checked={selectedSize?.name === size.name}
                        onChange={() => setSelectedSize(size)}
                        className="w-4 h-4 accent-amber-500 text-amber-600"
                      />
                      <span className="text-sm font-bold text-stone-900 dark:text-white">{size.name}</span>
                    </div>
                    <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">{formatPrice(size.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Customizable Pastas */}
          {product.customizable?.pastas && product.customizable.pastas.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-stone-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 dark:border-white/10 pb-2">
                <span>2. Tipo de Massa</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">Obrigatório</span>
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {product.customizable.pastas.map((pasta) => (
                  <label
                    key={pasta.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedPasta?.id === pasta.id
                        ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-400/10 shadow-sm'
                        : 'border-stone-200 dark:border-white/10 hover:border-amber-400/40 bg-stone-50/50 dark:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="pasta-option"
                        checked={selectedPasta?.id === pasta.id}
                        onChange={() => setSelectedPasta(pasta)}
                        className="w-4 h-4 accent-amber-500 text-amber-600"
                      />
                      <span className="text-sm font-bold text-stone-900 dark:text-white">{pasta.name}</span>
                    </div>
                    {pasta.price > 0 ? (
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400">+ {formatPrice(pasta.price)}</span>
                    ) : (
                      <span className="text-xs text-stone-500 dark:text-gray-400 font-medium">Incluso</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Customizable Sauces */}
          {product.customizable?.sauces && product.customizable.sauces.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-stone-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 dark:border-white/10 pb-2">
                <span>3. Escolha o Molho Artesanal</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">Obrigatório</span>
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {product.customizable.sauces.map((sauce) => (
                  <label
                    key={sauce.id}
                    className={`flex flex-col p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedSauce?.id === sauce.id
                        ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-400/10 shadow-sm'
                        : 'border-stone-200 dark:border-white/10 hover:border-amber-400/40 bg-stone-50/50 dark:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="sauce-option"
                          checked={selectedSauce?.id === sauce.id}
                          onChange={() => setSelectedSauce(sauce)}
                          className="w-4 h-4 accent-amber-500 text-amber-600"
                        />
                        <span className="text-sm font-bold text-stone-900 dark:text-white">{sauce.name}</span>
                      </div>
                      <span className="text-xs text-stone-500 dark:text-gray-400 font-medium">Incluso</span>
                    </div>
                    {sauce.description && (
                      <p className="text-[11px] text-stone-600 dark:text-gray-400 mt-1 pl-7">
                        {sauce.description}
                      </p>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Toppings / Adicionais */}
          {product.customizable?.toppings && product.customizable.toppings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-stone-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 dark:border-white/10 pb-2">
                <span>4. Adicionais Especiais</span>
                <span className="text-[10px] bg-stone-200 dark:bg-white/10 text-stone-700 dark:text-gray-300 px-2.5 py-0.5 rounded-full font-bold">Opcional</span>
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {product.customizable.toppings.map((topping) => {
                  const isChecked = selectedToppings.some(t => t.id === topping.id);
                  return (
                    <label
                      key={topping.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-400/10 shadow-sm'
                          : 'border-stone-200 dark:border-white/10 hover:border-amber-400/40 bg-stone-50/50 dark:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToppingToggle(topping)}
                          className="w-4 h-4 accent-amber-500 text-amber-600 rounded"
                        />
                        <span className="text-sm font-bold text-stone-900 dark:text-white">{topping.name}</span>
                      </div>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">+ {formatPrice(topping.price)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kitchen Notes */}
          <div className="space-y-2 text-left">
            <label className="text-xs font-black text-stone-800 dark:text-gray-200 uppercase tracking-wider block">
              Observações para a cozinha
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: sem queijo parmesão, molho bem quente, enviar talheres descartáveis..."
              rows={2}
              className="w-full rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-300 dark:border-white/10 p-3 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
          </div>

        </div>

        {/* Footer actions: Price & Add Button - ALWAYS completely rounded */}
        <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-white/10 bg-white dark:bg-[#0e1017] shrink-0 flex items-center justify-between gap-4">
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider">Total do Prato</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 leading-tight font-mono">
              {formatPrice(unitPrice * quantity)}
            </span>
          </div>

          {product.isOutOfStock ? (
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-stone-200 dark:bg-white/10 py-3.5 px-6 text-sm font-bold text-stone-500 dark:text-stone-400 cursor-not-allowed select-none"
            >
              <span>Prato Pausado na Cozinha</span>
            </button>
          ) : (
            <button
              id="btn-confirm-add-cart"
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 rounded-full dark-glass-button-gold py-3.5 px-6 text-sm font-black shadow-lg cursor-pointer hover:scale-102 active:scale-95 transition-transform"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span>Adicionar ao Pedido</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
