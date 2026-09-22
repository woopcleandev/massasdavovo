export enum CategoryId {
  LASANHAS = 'lasanhas',
  MASSAS_CLASSICAS = 'massas-classicas',
  EXECUTIVOS = 'executivos',
  SOBREMESAS = 'sobremesas',
  BEBIDAS = 'bebidas',
}

export interface CustomizationOption {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  categoryId: CategoryId;
  name: string;
  description: string;
  price: number; // Base price for default option
  image: string;
  isPopular?: boolean;
  sizes?: {
    name: string;
    price: number;
  }[];
  customizable?: {
    pastas?: CustomizationOption[];
    sauces?: { id: string; name: string; description: string }[];
    toppings?: CustomizationOption[];
  };
}

export interface CartItemCustomization {
  selectedSize?: { name: string; price: number };
  selectedPasta?: CustomizationOption;
  selectedSauce?: { id: string; name: string; description: string };
  selectedToppings?: CustomizationOption[];
}

export interface CartItem {
  id: string; // Unique ID for this item entry in the cart (includes customization hash)
  product: Product;
  quantity: number;
  customization?: CartItemCustomization;
  notes?: string;
  totalUnitPrice: number;
}

export type PaymentMethod = 'pix' | 'credit' | 'debit' | 'cash';

export interface CustomerInfo {
  name: string;
  phone: string;
  deliveryType: 'delivery' | 'takeaway';
  street?: string;
  number?: string;
  neighborhood?: string;
  reference?: string;
  paymentMethod: PaymentMethod;
  changeFor?: string;
}

export interface NeighborhoodFee {
  name: string;
  fee: number;
}

export const NEIGHBORHOODS: NeighborhoodFee[] = [
  { name: 'Centro', fee: 5.0 },
  { name: 'Primaveras', fee: 6.0 },
  { name: 'Jardim Riva', fee: 5.0 },
  { name: 'Castelândia', fee: 7.0 },
  { name: 'Parque dos Lagos', fee: 8.0 },
  { name: 'Poncho Verde', fee: 7.0 },
  { name: 'Guterres', fee: 8.0 },
  { name: 'Industrial', fee: 10.0 },
  { name: 'Outro Bairro (A combinar)', fee: 10.0 },
];
