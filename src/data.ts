import { CategoryId, Product } from './types';

// Let's import the actual generated images. They are located inside '/src/assets/images/'
import logoImage from './assets/images/logo_massas_da_vovo_1790085573403.jpg';
import lasagnaImage from './assets/images/lasanha_bolonhesa_vovo_1790085587729.jpg';
import gnocchiImage from './assets/images/nhoque_artesanal_vovo_1790085601096.jpg';

export const RESTAURANT_INFO = {
  name: 'Massas da Vovó',
  logo: logoImage,
  phone: '+55 66 9652-3006',
  whatsappNumber: '556696523006', // used for send wa links
  address: 'R. Santo Aléssio, Primavera do Leste - MT, 78850-000',
  googleMapsLink: 'https://www.google.com/maps/place/Massas+da+vov%C3%B3/@-15.5627576,-54.3013863,20z/data=!4m11!1m2!2m1!1sSabor+da+Massa++Primavera+do+Leste+MT!3m7!1s0x9377257c24aa766f:0x2481d4dc9c5d4f1a!8m2!3d-15.5627765!4d-54.3014545',
  hours: 'Terça a Domingo: 18:00 às 23:00',
  description: 'Massas artesanais frescas feitas com todo carinho de vó. Massas recheadas, lasanhas, molhos rústicos e muito sabor em Primavera do Leste.',
};

export const CATEGORIES = [
  { id: CategoryId.LASANHAS, name: 'Lasanhas Especiais', icon: '🍕' },
  { id: CategoryId.MASSAS_CLASSICAS, name: 'Monte sua Massa', icon: '🍝' },
  { id: CategoryId.EXECUTIVOS, name: 'Pratos da Vovó', icon: '🍽️' },
  { id: CategoryId.SOBREMESAS, name: 'Sobremesas', icon: '🍰' },
  { id: CategoryId.BEBIDAS, name: 'Bebidas', icon: '🥤' },
];

export const PRODUCTS: Product[] = [
  // 1. LASANHAS
  {
    id: 'lasanha-bolonhesa',
    categoryId: CategoryId.LASANHAS,
    name: 'Lasanha à Bolonhesa da Vovó',
    description: 'Camadas de massa fresca artesanal, molho de tomate cozido lentamente com carne moída selecionada, presunto, queijo muçarela e orégano.',
    price: 38.90,
    image: lasagnaImage,
    isPopular: true,
    sizes: [
      { name: 'Individual (Aprox. 600g)', price: 38.90 },
      { name: 'Família (Aprox. 1.2kg)', price: 68.90 },
    ],
  },
  {
    id: 'lasanha-frango',
    categoryId: CategoryId.LASANHAS,
    name: 'Lasanha de Frango com Catupiry',
    description: 'Massa fresca, peito de frango desfiado suculento, creme bechamel, queijo muçarela e o legítimo Catupiry.',
    price: 36.90,
    image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&q=80&w=600',
    sizes: [
      { name: 'Individual (Aprox. 600g)', price: 36.90 },
      { name: 'Família (Aprox. 1.2kg)', price: 64.90 },
    ],
  },
  {
    id: 'lasanha-quatro-queijos',
    categoryId: CategoryId.LASANHAS,
    name: 'Lasanha Quatro Queijos',
    description: 'Para os amantes de queijo: Muçarela, provolone, queijo gorgonzola suave e Catupiry cremoso intercalados com nossa massa artesanal e molho branco.',
    price: 39.90,
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=600',
    sizes: [
      { name: 'Individual (Aprox. 600g)', price: 39.90 },
      { name: 'Família (Aprox. 1.2kg)', price: 69.90 },
    ],
  },

  // 2. MONTE SUA MASSA
  {
    id: 'monte-sua-massa',
    categoryId: CategoryId.MASSAS_CLASSICAS,
    name: 'Monte seu Prato de Massa',
    description: 'Escolha seu tipo de pasta fresca, o molho artesanal de sua preferência e adicione os complementos que mais gostar!',
    price: 29.90, // Base price
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600',
    isPopular: true,
    customizable: {
      pastas: [
        { id: 'p1', name: 'Espaguete da Vovó', price: 0 },
        { id: 'p2', name: 'Talharim Fresco', price: 2.0 },
        { id: 'p3', name: 'Nhoque de Batata Rústico', price: 4.0 },
        { id: 'p4', name: 'Rondelli Presunto e Queijo', price: 6.0 },
      ],
      sauces: [
        { id: 's1', name: 'Molho Bolonhesa', description: 'Carne bovina moída cozida lentamente com tomates frescos' },
        { id: 's2', name: 'Molho Branco (Quatro Queijos)', description: 'Bechamel aveludado com provolone, parmesão e gorgonzola' },
        { id: 's3', name: 'Molho ao Sugo Rústico', description: 'Tomates italianos pelados com manjericão e alho dourado' },
        { id: 's4', name: 'Molho Rosé Cremoso', description: 'O equilíbrio perfeito entre molho de tomate e creme de leite' },
      ],
      toppings: [
        { id: 't1', name: 'Bacon em Cubos Crocante', price: 5.0 },
        { id: 't2', name: 'Almôndegas de Carne (3 unidades)', price: 8.0 },
        { id: 't3', name: 'Frango Grelhado Desfiado', price: 6.0 },
        { id: 't4', name: 'Queijo Parmesão Ralado Grosso', price: 3.5 },
        { id: 't5', name: 'Azeitonas Pretas Fatiadas', price: 2.5 },
        { id: 't6', name: 'Brócolis ao Alho e Óleo', price: 4.0 },
      ],
    },
  },

  // 3. EXECUTIVOS
  {
    id: 'nhoque-recheado',
    categoryId: CategoryId.EXECUTIVOS,
    name: 'Nhoque Recheado ao Molho Bolonhesa',
    description: 'Deliciosos nhoques artesanais feitos de batata selecionada, recheados com queijo muçarela cremoso, cobertos com nosso molho bolonhesa clássico e gratinados.',
    price: 42.90,
    image: gnocchiImage,
    isPopular: true,
  },
  {
    id: 'rondelli-quatro-queijos',
    categoryId: CategoryId.EXECUTIVOS,
    name: 'Rondelli de Quatro Queijos ao Sugo',
    description: 'Rondellis de massa fresca enrolados com mix cremoso de quatro queijos (muçarela, parmesão, provolone e ricota temperada) ao molho de tomate rústico e parmesão gratinado.',
    price: 44.90,
    image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'canelone-ricota',
    categoryId: CategoryId.EXECUTIVOS,
    name: 'Canelone de Ricota com Nozes',
    description: 'Tubos de massa fresca recheados com ricota fresca temperada, nozes picadas crocantes e espinafre fresco, cobertos com molho branco cremoso.',
    price: 39.90,
    image: 'https://images.unsplash.com/photo-1595295333158-4742f28fbe93?auto=format&fit=crop&q=80&w=600',
  },

  // 4. SOBREMESAS
  {
    id: 'pudim-leite',
    categoryId: CategoryId.SOBREMESAS,
    name: 'Pudim de Leite Condensado Caseiro',
    description: 'Fatia generosa do pudim clássico da vovó: super cremoso, sem furinhos, com aquela calda de caramelo brilhante perfeita.',
    price: 10.00,
    image: 'https://images.unsplash.com/photo-1528975604071-b4daaf722a6a?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'palha-italiana',
    categoryId: CategoryId.SOBREMESAS,
    name: 'Palha Italiana Artesanal',
    description: 'Doce cremoso de brigadeiro de colher mesclado com pedaços de biscoito Maizena crocante, polvilhado com leite em pó.',
    price: 6.00,
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'mousse-maracuja',
    categoryId: CategoryId.SOBREMESAS,
    name: 'Mousse de Maracujá Cremoso',
    description: 'Sobremesa refrescante e aerada feita com suco concentrado de maracujá natural, coberta com calda de sementes.',
    price: 8.00,
    image: 'https://images.unsplash.com/photo-1511018556340-d16986a1c194?auto=format&fit=crop&q=80&w=600',
  },

  // 5. BEBIDAS
  {
    id: 'coca-lata',
    categoryId: CategoryId.BEBIDAS,
    name: 'Coca-Cola Lata 350ml',
    description: 'Geladíssima.',
    price: 6.00,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'guarana-lata',
    categoryId: CategoryId.BEBIDAS,
    name: 'Guaraná Antarctica Lata 350ml',
    description: 'Original da Amazônia.',
    price: 6.00,
    image: 'https://images.unsplash.com/photo-1527960650-066b8d441d44?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'coca-2l',
    categoryId: CategoryId.BEBIDAS,
    name: 'Coca-Cola Garrafa 2 Litros',
    description: 'Ideal para compartilhar com a família.',
    price: 12.00,
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'suco-laranja',
    categoryId: CategoryId.BEBIDAS,
    name: 'Suco Natural de Laranja 500ml',
    description: 'Feito na hora, 100% puro suco de laranja da fruta.',
    price: 9.00,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'cerveja-heineken',
    categoryId: CategoryId.BEBIDAS,
    name: 'Cerveja Heineken Long Neck 330ml',
    description: 'Cerveja premium lager gelada.',
    price: 9.00,
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'agua-mineral',
    categoryId: CategoryId.BEBIDAS,
    name: 'Água Mineral Sem Gás 500ml',
    description: 'Fria.',
    price: 4.00,
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=600',
  },
];
