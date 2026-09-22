import React from 'react';
import { Product } from '../types';
import { Plus, Flame, Star, Clock } from 'lucide-react';

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
      className="group relative flex flex-col dark-glass-card rounded-3xl p-4.5 cursor-pointer transition-all duration-300 text-left select-none overflow-hidden"
    >
      {/* Popular Badge */}
      {product.isPopular && (
        <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1 rounded-full bg-amber-500/20 backdrop-blur-md text-amber-300 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-extrabold shadow-sm">
          <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>Mais Pedido</span>
        </div>
      )}

      {/* Floating Image with Ambient Backlight Halo */}
      <div className="relative w-full h-44 sm:h-48 flex items-center justify-center overflow-hidden rounded-2xl bg-black/30 my-1 dish-halo">
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="relative z-10 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600';
          }}
        />

        {/* Floating Tag */}
        <div className="absolute bottom-2.5 right-2.5 z-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-0.5 text-[10px] font-bold text-gray-300 tracking-wider">
          {product.sizes ? 'Tamanhos' : product.customizable ? 'Personalizável' : 'Artesanal'}
        </div>
      </div>

      {/* Dish Information */}
      <div className="flex flex-col flex-1 pt-3">
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
            <div className="flex items-center text-amber-400">
              <Star className="w-3 h-3 fill-amber-400" />
              <Star className="w-3 h-3 fill-amber-400" />
              <Star className="w-3 h-3 fill-amber-400" />
              <Star className="w-3 h-3 fill-amber-400" />
              <Star className="w-3 h-3 fill-amber-400" />
            </div>
            <span className="text-gray-300 text-[10px] ml-0.5">4.9</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <Clock className="w-3 h-3" />
            <span>30-45m</span>
          </div>
        </div>

        <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-amber-300 transition-colors line-clamp-1 leading-snug">
          {product.name}
        </h3>

        <p className="mt-1 text-xs text-gray-400 line-clamp-2 leading-relaxed flex-1 font-normal">
          {product.description}
        </p>

        {/* Bottom Row: Price & Add Button */}
        <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-medium leading-none">
              A partir de
            </span>
            <span className="text-base sm:text-lg font-black text-amber-400 mt-1 leading-none tracking-tight">
              {formatPrice(product.price)}
            </span>
          </div>

          <button
            id={`btn-add-product-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="flex items-center gap-1 rounded-full dark-glass-button-gold px-3.5 py-1.5 text-xs font-black shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Pedir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
