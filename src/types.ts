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
  isActive?: boolean;
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
  // Faixa R$ 10,00
  { name: 'JD RIVA 1', fee: 10.0 },
  { name: 'JD RIVA 2', fee: 10.0 },
  { name: 'JD RIVA 3', fee: 10.0 },
  { name: 'JD RIVA 4', fee: 10.0 },
  { name: 'JD UNIVERSITARIO - PARMA 1', fee: 10.0 },
  { name: 'PARQUE ELDORADO', fee: 10.0 },
  { name: 'NOVO HORIZONTE', fee: 10.0 },
  { name: 'PARQUE DAS AGUAS', fee: 10.0 },
  { name: 'JD VOLTA GRANDE', fee: 10.0 },
  { name: 'COAB JAIME CAMPOS', fee: 10.0 },
  { name: 'GNOATO', fee: 10.0 },
  { name: 'COAB TANCREDO NEVES', fee: 10.0 },
  { name: 'VILA POPULAR', fee: 10.0 },
  { name: 'PIONEIRO', fee: 10.0 },
  { name: 'JD PROGRESSO', fee: 10.0 },
  { name: 'JD SERRA DAS FLORES', fee: 10.0 },
  { name: 'CRISTO REI - FELIZ NATAL', fee: 10.0 },
  { name: 'CASTELADIA 1', fee: 10.0 },
  { name: 'CASTELADIA 2', fee: 10.0 },
  { name: 'CASTELADIA 3', fee: 10.0 },
  { name: 'CASTELADIA 4', fee: 10.0 },
  { name: 'SANTA CLARA', fee: 10.0 },
  { name: 'JD MILANO', fee: 10.0 },
  { name: 'SÃO JOSE', fee: 10.0 },
  { name: 'SÃO CRISTOVÃO 1', fee: 10.0 },
  { name: 'SÃO CRISTOVÃO 2', fee: 10.0 },
  { name: 'SÃO CRISTOVÃO 3', fee: 10.0 },

  // Faixa R$ 15,00
  { name: 'COND. PORTO SEGURO', fee: 15.0 },
  { name: 'COND. JERRAZ', fee: 15.0 },
  { name: 'COND. SPLERODE (Entrada Europa)', fee: 15.0 },
  { name: 'PONCHO VERDE 3', fee: 15.0 },
  { name: 'PONCHO VERDE 4', fee: 15.0 },
  { name: 'PONCHO VERDE 5', fee: 15.0 },
  { name: 'JD LUCIANA 1', fee: 15.0 },
  { name: 'JD LUCIANA 2', fee: 15.0 },
  { name: 'CHACARA FONTANA', fee: 15.0 },
  { name: 'INDUSTRIAL JOSE DE ALENCAR', fee: 15.0 },
  { name: 'BURITIS 1', fee: 15.0 },
  { name: 'BURITIS 2', fee: 15.0 },
  { name: 'BURITIS 3', fee: 15.0 },
  { name: 'BURITIS 4', fee: 15.0 },
  { name: 'BURITIS 5', fee: 15.0 },
  { name: 'PVA 3 - PADRE ONESTO COSTA', fee: 15.0 },
  { name: 'JD FLORENÇA - VILA GRAMADO', fee: 15.0 },
  { name: 'JD 3 AMERICAS 1', fee: 15.0 },
  { name: 'JD 3 AMERICAS 2', fee: 15.0 },
  { name: 'JD NOVA ESPERANÇA', fee: 15.0 },
  { name: 'DISTRITO INDUSTRIAL ATRAS SHELL (Alvorada)', fee: 15.0 },
  { name: 'TUIUIU / GUTERRES', fee: 15.0 },

  // Faixa R$ 20,00
  { name: 'BURITIS UNIVERSITARIO 1 - FASIPE', fee: 20.0 },
  { name: 'BURITIS UNIVERSITARIO 2 - FASIPE', fee: 20.0 },
  { name: 'BURITIS PRIME - BURITIS 6', fee: 20.0 },
  { name: 'MT 130 - FENDT - IGUAÇU MAQUINAS', fee: 20.0 },
  { name: 'SAIDA PRA BARRA - NA KAOPPA', fee: 20.0 },
  { name: 'ATÉ ROYAL - POLICIA PRF - CARGIL', fee: 20.0 },
  { name: 'JD DOS IPES', fee: 20.0 },
  { name: 'CASAS PACAEMBU', fee: 20.0 },
  { name: 'JD EUROPA', fee: 20.0 },
  { name: 'SANTA FELICIDADE', fee: 20.0 },
  { name: 'OUTRO BAIRRO (A combinar)', fee: 20.0 },
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
