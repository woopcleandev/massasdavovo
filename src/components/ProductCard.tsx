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
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 hover:border-red-100 shadow-sm hover:shadow-md active:shadow-sm cursor-pointer overflow-hidden transition-all duration-300 transform hover:-translate-y-0.5"
    >
      {/* Product Image */}
      <div className="relative h-44 w-full bg-gray-50 overflow-hidden shrink-0">
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            // fallback image
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600';
          }}
        />

        {product.isPopular && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm animate-pulse">
            <Flame className="w-3 h-3 fill-white" />
            <span>Mais Pedido</span>
          </div>
        )}

        {/* Floating Category Tag */}
        <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
          {product.sizes ? 'Tamanhos' : product.customizable ? 'Personalizável' : 'Unitário'}
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-base font-bold text-gray-900 group-hover:text-red-700 transition-colors line-clamp-1 leading-tight">
          {product.name}
        </h3>
        
        <p className="mt-1.5 text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1">
          {product.description}
        </p>

        {/* Price and Action button */}
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-medium leading-none">A partir de</span>
            <span className="text-lg font-extrabold text-red-600 mt-0.5 leading-none">
              {formatPrice(product.price)}
            </span>
          </div>

          <button
            id={`btn-add-product-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="flex items-center gap-1 rounded-full bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
