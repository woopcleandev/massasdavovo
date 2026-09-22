import React from 'react';
import { Product } from '../types';
import { Plus, Flame } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onSelect(product)}
      className="group flex flex-col glass-card rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.015]"
    >
      {/* Product Image Container */}
      <div className="relative h-48 sm:h-52 w-full bg-gray-100/60 overflow-hidden shrink-0">
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600';
          }}
        />

        {/* Liquid Glass Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 opacity-70 pointer-events-none" />

        {/* Most Popular Liquid Pill */}
        {product.isPopular && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-[#0b1c3f]/85 backdrop-blur-md text-[#d4af37] border border-[#d4af37]/40 px-3 py-1 text-[11px] font-extrabold shadow-md">
            <Flame className="w-3.5 h-3.5 fill-[#d4af37]" />
            <span>Mais Pedido</span>
          </div>
        )}

        {/* Tag Pill (Sizes / Customizable / Unit) */}
        <div className="absolute bottom-3 right-3 rounded-full bg-white/80 backdrop-blur-md border border-white/90 px-2.5 py-0.5 text-[10px] font-bold text-gray-800 shadow-sm uppercase tracking-wider">
          {product.sizes ? 'Tamanhos' : product.customizable ? 'Personalizável' : 'Porção Artesanal'}
        </div>
      </div>

      {/* Product Details Content */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-base font-extrabold text-gray-900 group-hover:text-[#0b1c3f] transition-colors line-clamp-1 leading-snug">
          {product.name}
        </h3>
        
        <p className="mt-1.5 text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1 font-normal">
          {product.description}
        </p>

        {/* Price and Liquid Glass Action Button */}
        <div className="mt-4 pt-3.5 border-t border-gray-200/50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider leading-none">
              A partir de
            </span>
            <span className="text-lg font-black text-[#0b1c3f] mt-1 leading-none tracking-tight">
              {formatPrice(product.price)}
            </span>
          </div>

          <button
            id={`btn-add-product-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="flex items-center gap-1.5 rounded-full glass-button-primary px-4 py-2 text-xs font-black shadow-md cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Escolher</span>
          </button>
        </div>
      </div>
    </div>
  );
};
