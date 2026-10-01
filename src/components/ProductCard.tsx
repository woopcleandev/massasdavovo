import React from 'react';
import { Product } from '../types';
import { Plus, Flame, Star, Clock } from 'lucide-react';
import { formatPrice, getProductCategoryDisplayLabel } from '../utils/format';
import { useCompany } from '../context/CompanyContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { categories } = useCompany();
  const isOutOfStock = Boolean(product.isOutOfStock);
  const catName = categories.find(c => c.id === product.categoryId)?.name;

  const handleCardClick = () => {
    if (isOutOfStock) return;
    onSelect(product);
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={handleCardClick}
      className={`group relative flex flex-col dark-glass-card rounded-3xl p-3.5 sm:p-4 transition-all duration-300 text-left select-none overflow-hidden border ${
        isOutOfStock 
          ? 'opacity-65 border-stone-300 dark:border-white/5 cursor-not-allowed' 
          : 'cursor-pointer border-stone-300/80 dark:border-white/10 shadow-md hover:shadow-xl'
      }`}
    >
      {/* Floating Image with Ambient Backlight Halo */}
      <div className="relative w-full h-44 sm:h-48 flex items-center justify-center overflow-hidden rounded-2xl bg-stone-100 dark:bg-black/40 dish-halo border border-stone-200 dark:border-white/5">
        {/* Popular Badge - Positioned over image with high z-index */}
        {product.isPopular && !isOutOfStock && (
          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 rounded-full bg-amber-400 text-black px-3 py-1 text-[10px] font-black shadow-md">
            <Flame className="w-3.5 h-3.5 fill-black text-black" />
            <span>Mais Pedido</span>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 z-30 bg-stone-950/70 backdrop-blur-[2px] flex items-center justify-center p-3">
            <span className="rounded-full bg-rose-950/90 text-rose-300 border border-rose-500/50 px-3 py-1 text-xs font-black shadow-lg uppercase tracking-wider text-center">
              Pausado na Cozinha
            </span>
          </div>
        )}

        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className={`relative z-10 w-full h-full object-cover rounded-2xl transition-transform duration-700 ease-out ${
            isOutOfStock ? 'grayscale' : 'group-hover:scale-108'
          }`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600';
          }}
        />

        {/* Floating Tag - Completely Rounded */}
        <div className="absolute bottom-2.5 right-2.5 z-20 rounded-full bg-stone-950/85 backdrop-blur-md border border-white/20 px-3 py-0.5 text-[10px] font-extrabold text-white tracking-wider shadow-sm">
          {product.sizes ? 'Tamanhos' : product.customizable ? 'Personalizável' : 'Artesanal'}
        </div>
      </div>

      {/* Dish Information */}
      <div className="flex flex-col flex-1 pt-3">
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1 text-[11px] font-bold">
            <div className="flex items-center text-amber-500 dark:text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
            </div>
            <span className="text-stone-800 dark:text-stone-200 text-[11px] ml-0.5 font-black">4.9</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-stone-600 dark:text-stone-400 font-semibold">
            <Clock className="w-3 h-3 text-stone-500 dark:text-stone-400" />
            <span>30-45m</span>
          </div>
        </div>

        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-0.5">
          {getProductCategoryDisplayLabel(product.name, product.categoryId, catName)}
        </span>

        <h3 className="text-sm sm:text-base font-black text-stone-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors line-clamp-1 leading-snug">
          {product.name}
        </h3>

        <p className="mt-1 text-xs text-stone-700 dark:text-stone-300 line-clamp-2 leading-relaxed flex-1 font-medium">
          {product.description}
        </p>

        {/* Bottom Row: Price & Add Button - ALWAYS completely rounded */}
        <div className="mt-3.5 pt-3 border-t border-stone-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-stone-500 dark:text-stone-400 font-extrabold uppercase tracking-wider leading-none">
              A partir de
            </span>
            <span className="text-base sm:text-lg font-black text-amber-800 dark:text-amber-400 mt-1 leading-none tracking-tight font-mono">
              {formatPrice(product.price)}
            </span>
          </div>

          {isOutOfStock ? (
            <button
              disabled
              className="flex items-center gap-1.5 rounded-full bg-stone-200 dark:bg-white/10 px-3.5 py-1.5 text-xs font-bold text-stone-500 dark:text-stone-400 cursor-not-allowed select-none"
            >
              <span>Esgotado</span>
            </button>
          ) : (
            <button
              id={`btn-add-product-${product.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(product);
              }}
              className="flex items-center gap-1.5 rounded-full dark-glass-button-gold px-4 py-2 text-xs font-black shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Pedir</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
