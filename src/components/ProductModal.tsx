import React, { useState, useEffect } from 'react';
import { Product, CustomizationOption, CartItem } from '../types';
import { X, Minus, Plus, ShoppingBag, Star, Clock, Heart, Sparkles, ChefHat } from 'lucide-react';

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
    const customizationHash = JSON.stringify({
      size: selectedSize?.name,
      pasta: selectedPasta?.id,
      sauce: selectedSauce?.id,
      toppings: selectedToppings.map(t => t.id).sort(),
      notes,
    });
    
    const cartItemId = `${product.id}-${btoa(customizationHash).substring(0, 8)}`;

    const cartItem: CartItem = {
      id: cartItemId,
      product,
      quantity,
      notes: notes.trim() || undefined,
      totalUnitPrice: unitPrice,
      customization: {
        selectedSize,
        selectedPasta,
        selectedSauce,
        selectedToppings: selectedToppings.length > 0 ? selectedToppings : undefined,
      },
    };

    onAddToCart(cartItem);
    onClose();
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4 overflow-y-auto animate-fade-in text-left">
      {/* Click outside to close */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Main Glass Customizer Card */}
      <div
        id="product-customizer-modal"
        className="w-full sm:max-w-xl dark-glass-panel rounded-t-[2.5rem] sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-white/10"
      >
        {/* Top Floating Action Bar */}
        <div className="relative px-6 pt-5 pb-2 flex items-center justify-between z-20 shrink-0">
          <button
            id="btn-close-modal"
            onClick={onClose}
            className="w-10 h-10 rounded-full dark-glass-pill flex items-center justify-center text-white hover:text-amber-400 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <span className="text-xs font-black uppercase tracking-widest text-amber-400/90 flex items-center gap-1.5">
            <ChefHat className="w-3.5 h-3.5" />
            <span>Massas da Vovó</span>
          </span>

          <div className="w-10 h-10 rounded-full dark-glass-pill flex items-center justify-center text-amber-400">
            <Heart className="w-4 h-4 fill-amber-400/20" />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 px-6 pb-6 overflow-y-auto space-y-6 no-scrollbar">
          
          {/* Centered Floating Food Spotlight with Halo (Matching Reference Image) */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center dish-halo">
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="relative z-10 w-full h-full object-cover rounded-3xl shadow-2xl border border-white/10"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600';
                }}
              />
              
              {/* Floating Badge (e.g. Artesanal) */}
              <div className="absolute top-2 right-2 z-20 rounded-full bg-black/65 backdrop-blur-md border border-white/15 px-3 py-1 text-[11px] font-extrabold text-amber-300 flex items-center gap-1 shadow-md">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>100% Artesanal</span>
              </div>
            </div>

            {/* Stepper Floating Pill (+ 1 -) matching the reference */}
            <div className="mt-4 flex items-center gap-4 dark-glass-pill rounded-full px-5 py-2 border border-white/15 shadow-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-white disabled:opacity-30 cursor-pointer active:scale-95 transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-base font-black text-white w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-amber-400 hover:text-amber-300 cursor-pointer active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dish Details Header */}
          <div className="text-center sm:text-left space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{product.name}</h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-normal">{product.description}</p>
          </div>

          {/* Mini Specs Pill Row: Delivery Time & Rating (From Reference) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="dark-glass-pill rounded-2xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Preparo & Entrega</span>
                <span className="text-xs font-black text-white">30 - 45 Minutos</span>
              </div>
            </div>

            <div className="dark-glass-pill rounded-2xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Avaliação</span>
                <span className="text-xs font-black text-white">4.9 ★★★★★</span>
              </div>
            </div>
          </div>

          {/* Size Options (If Available) */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-2">
                <span>1. Escolha o Tamanho</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">Obrigatório</span>
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {product.sizes.map((size) => (
                  <label
                    key={size.name}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedSize?.name === size.name
                        ? 'border-amber-400/60 bg-amber-400/10 shadow-sm'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="product-size"
                        checked={selectedSize?.name === size.name}
                        onChange={() => setSelectedSize(size)}
                        className="w-4 h-4 accent-amber-400 text-amber-500 focus:ring-amber-400"
                      />
                      <span className="text-sm font-bold text-gray-200">{size.name}</span>
                    </div>
                    <span className="text-sm font-black text-amber-400">{formatPrice(size.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Customizable: Pasta Selection */}
          {product.customizable?.pastas && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-2">
                <span>1. Escolha a Massa</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">Obrigatório</span>
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {product.customizable.pastas.map((pasta) => (
                  <label
                    key={pasta.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedPasta?.id === pasta.id
                        ? 'border-amber-400/60 bg-amber-400/10 shadow-sm'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="custom-pasta"
                        checked={selectedPasta?.id === pasta.id}
                        onChange={() => setSelectedPasta(pasta)}
                        className="w-4 h-4 accent-amber-400 text-amber-500"
                      />
                      <span className="text-sm font-bold text-gray-200">{pasta.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-400">
                      {pasta.price === 0 ? 'Incluso' : `+ ${formatPrice(pasta.price)}`}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Customizable: Sauce Selection */}
          {product.customizable?.sauces && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-2">
                <span>2. Escolha o Molho da Vovó</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">Obrigatório</span>
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {product.customizable.sauces.map((sauce) => (
                  <label
                    key={sauce.id}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedSauce?.id === sauce.id
                        ? 'border-amber-400/60 bg-amber-400/10 shadow-sm'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="custom-sauce"
                      checked={selectedSauce?.id === sauce.id}
                      onChange={() => setSelectedSauce(sauce)}
                      className="w-4 h-4 accent-amber-400 text-amber-500 mt-1 shrink-0"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-200 leading-tight">{sauce.name}</span>
                      <span className="text-xs text-gray-400 mt-0.5 leading-snug">{sauce.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Customizable: Toppings Selection */}
          {product.customizable?.toppings && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-2">
                <span>3. Adicionais Especiais</span>
                <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full font-bold">Opcional</span>
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {product.customizable.toppings.map((topping) => {
                  const isChecked = selectedToppings.some(t => t.id === topping.id);
                  return (
                    <label
                      key={topping.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-amber-400/60 bg-amber-400/10 shadow-sm'
                          : 'border-white/10 hover:border-white/20 bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToppingToggle(topping)}
                          className="w-4 h-4 accent-amber-400 text-amber-500 rounded"
                        />
                        <span className="text-sm font-bold text-gray-200">{topping.name}</span>
                      </div>
                      <span className="text-xs font-black text-amber-400">+ {formatPrice(topping.price)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kitchen Notes */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-300 uppercase tracking-wider block">
              Observações para a cozinha
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: sem queijo parmesão, molho bem quente, enviar talheres descartáveis..."
              rows={2}
              className="w-full rounded-2xl bg-white/5 border border-white/10 p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/50"
            />
          </div>

        </div>

        {/* Footer actions: Price & Add Button */}
        <div className="p-5 border-t border-white/10 bg-black/40 backdrop-blur-md shrink-0 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total do Prato</span>
            <span className="text-xl font-black text-amber-400 leading-tight">
              {formatPrice(unitPrice * quantity)}
            </span>
          </div>

          <button
            id="btn-confirm-add-cart"
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-2 rounded-full dark-glass-button-gold py-3.5 px-6 text-sm font-black shadow-lg cursor-pointer hover:scale-102 active:scale-95 transition-transform"
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
            <span>Adicionar ao Pedido</span>
          </button>
        </div>

      </div>
    </div>
  );
};
