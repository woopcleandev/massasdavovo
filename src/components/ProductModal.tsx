import React, { useState, useEffect } from 'react';
import { Product, CustomizationOption, CartItem } from '../types';
import { X, Minus, Plus, ShoppingBag, Info } from 'lucide-react';

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

    // 1. Add size price differences (or set base size price)
    if (selectedSize) {
      currentPrice = selectedSize.price;
    }

    // 2. Add customizable pasta upcharges
    if (selectedPasta) {
      currentPrice += selectedPasta.price;
    }

    // 3. Add toppings prices
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
    // Generate a unique ID for this specific customization mix
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-md p-0 sm:p-4 overflow-y-auto">
      {/* Click outside to close */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Modal Card */}
      <div
        id="product-customizer-modal"
        className="w-full sm:max-w-xl glass-panel rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-slide-up border border-white/80"
      >
        {/* Header Image banner */}
        <div className="relative h-48 sm:h-56 w-full bg-gray-100 shrink-0">
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600';
            }}
          />
          {/* Close button */}
          <button
            id="btn-close-modal"
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/70 hover:bg-white/90 backdrop-blur-md text-gray-800 transition shadow-md border border-white/80 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div>
            <h2 className="text-xl font-black text-gray-950">{product.name}</h2>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed font-normal">{product.description}</p>
          </div>

          {/* Size Options */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <span>1. Escolha o Tamanho</span>
                <span className="text-[10px] bg-[#0b1c3f]/10 text-[#0b1c3f] px-1.5 py-0.5 rounded-sm">Obrigatório</span>
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {product.sizes.map((size) => (
                  <label
                    key={size.name}
                    className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedSize?.name === size.name
                        ? 'border-[#0b1c3f] bg-[#0b1c3f]/5'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="product-size"
                        checked={selectedSize?.name === size.name}
                        onChange={() => setSelectedSize(size)}
                        className="w-4 h-4 text-[#0b1c3f] focus:ring-[#0b1c3f]"
                      />
                      <span className="text-sm font-bold text-gray-800">{size.name}</span>
                    </div>
                    <span className="text-sm font-extrabold text-[#0b1c3f]">{formatPrice(size.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Customizable: Pasta Selection */}
          {product.customizable?.pastas && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <span>1. Escolha a Massa</span>
                <span className="text-[10px] bg-[#0b1c3f]/10 text-[#0b1c3f] px-1.5 py-0.5 rounded-sm">Obrigatório</span>
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {product.customizable.pastas.map((pasta) => (
                  <label
                    key={pasta.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPasta?.id === pasta.id
                        ? 'border-[#0b1c3f] bg-[#0b1c3f]/5'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="custom-pasta"
                        checked={selectedPasta?.id === pasta.id}
                        onChange={() => setSelectedPasta(pasta)}
                        className="w-4 h-4 text-[#0b1c3f] focus:ring-[#0b1c3f]"
                      />
                      <span className="text-sm font-bold text-gray-800">{pasta.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">
                      {pasta.price === 0 ? 'Sem custo extra' : `+ ${formatPrice(pasta.price)}`}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Customizable: Sauce Selection */}
          {product.customizable?.sauces && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <span>2. Escolha o Molho</span>
                <span className="text-[10px] bg-[#0b1c3f]/10 text-[#0b1c3f] px-1.5 py-0.5 rounded-sm">Obrigatório</span>
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {product.customizable.sauces.map((sauce) => (
                  <label
                    key={sauce.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedSauce?.id === sauce.id
                        ? 'border-[#0b1c3f] bg-[#0b1c3f]/5'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="custom-sauce"
                      checked={selectedSauce?.id === sauce.id}
                      onChange={() => setSelectedSauce(sauce)}
                      className="w-4 h-4 text-[#0b1c3f] focus:ring-[#0b1c3f] mt-0.5 shrink-0"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800 leading-tight">{sauce.name}</span>
                      <span className="text-xs text-gray-400 mt-1 leading-snug">{sauce.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Customizable: Toppings Selection */}
          {product.customizable?.toppings && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <span>3. Adicionais Extras</span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-sm">Opcional</span>
              </h3>
              <div className="grid grid-cols-1 gap-2">
                 {product.customizable.toppings.map((topping) => {
                  const isChecked = selectedToppings.some(t => t.id === topping.id);
                  return (
                    <label
                      key={topping.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        isChecked ? 'border-[#0b1c3f] bg-[#0b1c3f]/5' : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToppingToggle(topping)}
                          className="w-4 h-4 rounded text-[#0b1c3f] focus:ring-[#0b1c3f] cursor-pointer"
                        />
                        <span className="text-sm font-bold text-gray-800">{topping.name}</span>
                      </div>
                      <span className="text-sm font-bold text-[#0b1c3f]">+ {formatPrice(topping.price)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kitchen Notes */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-800 uppercase tracking-wider block">Observações do Pedido</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: sem cebola, ponto da massa bem cozido, talher extra..."
              className="w-full rounded-xl border border-gray-200 p-3.5 text-sm focus:border-[#0b1c3f] focus:ring-[#0b1c3f] outline-hidden min-h-[80px]"
            />
          </div>
        </div>

        {/* Footer actions: Quantity + Add button */}
        <div className="p-6 border-t border-white/60 bg-white/50 backdrop-blur-md shrink-0 flex flex-col sm:flex-row gap-4 items-center">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between border border-white/80 rounded-full bg-white/70 backdrop-blur-md p-1.5 shrink-0 w-32 shadow-xs">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-1.5 rounded-full hover:bg-white text-gray-700 disabled:opacity-40 transition cursor-pointer"
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-base font-extrabold text-gray-900">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-1.5 rounded-full hover:bg-white text-gray-700 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add Button */}
          <button
            id="btn-confirm-add-cart"
            onClick={handleAddToCart}
            className="flex-1 w-full flex items-center justify-center gap-2 rounded-full glass-button-primary py-4 px-6 text-base font-black shadow-lg cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5 text-[#f6e09e]" />
            <span>Adicionar {formatPrice(unitPrice * quantity)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
