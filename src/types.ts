export enum CategoryId {
  SORRENTINO = 'sorrentino',
  NHOQUE = 'nhoque',
  LASANHAS = 'lasanhas',
  RONDELE = 'rondele',
  CAPELETE_TORTEI = 'capelete-tortei',
  MOLHOS = 'molhos',
  NHOQUE_TRADICIONAL = 'nhoque-tradicional',
  CARNES = 'carnes',
  SOBREMESAS = 'sobremesas',
  BEBIDAS = 'bebidas',
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  isCustom?: boolean;
}

export interface CustomizationOption {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  categoryId: string; // Accepts CategoryId or custom category id
  name: string;
  description: string;
  price: number; // Base price for default option
  image: string;
  isPopular?: boolean;
  stock?: number;
  isOutOfStock?: boolean;
  costPrice?: number;
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

export type PaymentMethod = 'pix' | 'pix_now' | 'pix_delivery' | 'credit' | 'debit' | 'cash';

export interface OrderSchedule {
  isScheduled: boolean;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  displayLabel: string; // e.g. "Hoje (Terça) às 19:30" or "Amanhã (Quarta, 23/09) às 19:00"
}

export interface CustomerInfo {
  name: string;
  phone: string;
  deliveryType: 'delivery' | 'takeaway' | 'dine_in';
  tableNumber?: string;
  posIdentifierValue?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  reference?: string;
  paymentMethod: PaymentMethod;
  changeFor?: string;
  schedule?: OrderSchedule;
}

export type OrderStatus = 'novo' | 'preparo' | 'entrega' | 'concluido' | 'cancelado';

export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  size?: string;
  pasta?: string;
  sauce?: string;
  toppings?: string[];
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerPhoneClean?: string;
  customerId?: string;
  deliveryType: 'delivery' | 'takeaway' | 'dine_in';
  tableNumber?: string;
  posIdentifierType?: 'mesa' | 'comanda' | 'assento' | 'cliente';
  posIdentifierValue?: string;
  origin?: 'web' | 'pos';
  street?: string;
  number?: string;
  neighborhood?: string;
  reference?: string;
  paymentMethod: PaymentMethod;
  changeFor?: string;
  items: OrderItem[];
  itemsSubtotal: number;
  deliveryFee: number;
  grandTotal: number;
  status: OrderStatus;
  schedule?: OrderSchedule;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashMovement {
  id: string;
  type: 'suprimento' | 'sangria';
  amount: number;
  reason: string;
  createdAt: string;
}

export interface OperatingHoursSettings {
  openDays: number[]; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat. Default: [2, 3, 4, 5, 6, 0] (Ter a Dom)
  openTime: string; // e.g. "18:00"
  closeTime: string; // e.g. "23:00"
  forceStatus: 'auto' | 'force_open' | 'force_closed';
}

export interface CompanySettings {
  whatsappNumber: string; // digits only, e.g. 5566996523006
  phone: string; // display phone, e.g. (66) 99652-3006
  pixKey: string;
  pixKeyType: string;
  pixBeneficiary: string;
  adminUser: string;
  adminPass: string;
  operatingHours?: OperatingHoursSettings;
  updatedAt?: string;
}

export interface NeighborhoodFee {
  name: string;
  fee: number;
}

export const NEIGHBORHOODS: NeighborhoodFee[] = [
  { name: 'Centro', fee: 9.0 },
  { name: 'Primaveras', fee: 10.0 },
  { name: 'Jardim Riva', fee: 9.0 },
  { name: 'Castelândia', fee: 11.0 },
  { name: 'Parque dos Lagos', fee: 12.0 },
  { name: 'Poncho Verde', fee: 11.0 },
  { name: 'Guterres', fee: 12.0 },
  { name: 'Industrial', fee: 14.0 },
  { name: 'Outro Bairro (A combinar)', fee: 14.0 },
];

export interface UserProfile {
  id: string;
  name: string;
  whatsapp: string;
  whatsappClean?: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedAddress {
  id: string;
  userId: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  label: 'casa' | 'trabalho' | 'outro';
  createdAt: string;
  updatedAt: string;
}
