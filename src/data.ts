import { CategoryId, Product, Category } from './types';

// Let's import the actual generated images. They are located inside '/src/assets/images/'
import logoImage from './assets/images/logo_massas_da_vovo_actual.png';
import lasagnaImage from './assets/images/lasanha_bolonhesa_vovo_1790085587729.jpg';
import gnocchiImage from './assets/images/nhoque_artesanal_vovo_1790085601096.jpg';
import coca2lImage from './assets/images/coca_cola_2l_man_1790086001186.jpg';

// New high-fidelity generated images
import sorrentinoCapreseImage from './assets/images/sorrentino_caprese_1790099802500.jpg';
import rondeleArtesanalImage from './assets/images/rondele_artesanal_1790099816704.jpg';
import torteiAboboraImage from './assets/images/tortei_abobora_1790099852857.jpg';
import carneMolhoMadeiraImage from './assets/images/carne_molho_madeira_1790099866762.jpg';

export const RESTAURANT_INFO = {
  name: 'Massas da Vovó',
  logo: '/logo.png',
  phone: '+55 66 9652-3006',
  whatsappNumber: '556696523006', // used for send wa links
  address: 'Rua Manaus, 203, Primavera do Leste - MT',
  googleMapsLink: 'https://maps.app.goo.gl/hecpUqJLLVd8EghW9',
  hours: 'Seg a Qui: 09:00–17:30 • Sex: 09:00–19:30 • Sáb: 09:00–13:00 (Dom: Fechado)',
  description: 'Massas e macarrão artesanais frescos em Primavera do Leste - MT. Lasanhas, nhoques, rondelli, sorrentinos e molhos rústicos.',
};

export const CATEGORIES: Category[] = [
  { id: CategoryId.SORRENTINO, name: 'Sorrentino', icon: '🥟' },
  { id: CategoryId.NHOQUE, name: 'Nhoque', icon: '🍲' },
  { id: CategoryId.LASANHAS, name: 'Lasanha (Pronta)', icon: '🍕' },
  { id: CategoryId.RONDELE, name: 'Rondele', icon: '🌀' },
  { id: CategoryId.CAPELETE_TORTEI, name: 'Capelete e Tortéi', icon: '🇮🇹' },
  { id: CategoryId.MOLHOS, name: 'Molhos', icon: '🥫' },
  { id: CategoryId.NHOQUE_TRADICIONAL, name: 'Nhôque Tradicional', icon: '🍝' },
  { id: CategoryId.CARNES, name: 'Carnes', icon: '🥩' },
  { id: CategoryId.SOBREMESAS, name: 'Sobremesas', icon: '🍰' },
];

export const PRODUCTS: Product[] = [
  // 1. SORRENTINO
  {
    id: 'sorrentino-caprese',
    categoryId: CategoryId.SORRENTINO,
    name: 'Sorrentino Caprese (500g)',
    description: 'Massa fresca artesanal recheada com mussarela cremosa, tomate seco selecionado e manjericão fresco picado.',
    price: 58.90,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTa9c9K4-3PIw8EZNOemGdxfg7XE2Q9mensyTO8h1x3Ld2yaGkw8MZBrCk7&s=10',
    isPopular: true,
  },
  {
    id: 'sorrentino-abobora-carne-seca',
    categoryId: CategoryId.SORRENTINO,
    name: 'Sorrentino de Abóbora com Carne Seca (500g)',
    description: 'Massa fresca recheada com um delicioso creme de abóbora cabotiá e carne seca desfiada bem temperada.',
    price: 58.90,
    image: 'https://www.receitasagora.com.br/wp-content/uploads/2020/04/receita-escondidinho-de-carne-seca-scaled.jpg',
  },
  {
    id: 'sorrentino-limao-siciliano',
    categoryId: CategoryId.SORRENTINO,
    name: 'Sorrentino de Limão Siciliano (500g)',
    description: 'Massa fresca recheada com presunto cozido, queijo mussarela cremoso e raspas de limão siciliano fresco.',
    price: 58.90,
    image: 'https://i.ytimg.com/vi/7ncBrD2xFgo/maxresdefault.jpg',
  },
  {
    id: 'sorrentino-ricota-gorgonzola-nozes',
    categoryId: CategoryId.SORRENTINO,
    name: 'Sorrentino de Ricota com Gorgonzola e Nozes (500g)',
    description: 'Recheio requintado de ricota fresca, queijo gorgonzola suave e pedaços crocantes de nozes selecionadas.',
    price: 58.90,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-IFJCfr0Fb-lhgRQ_3aWdtpBRcs-_8udri1unt2Yt6pDqmdctMtjgEcoy&s=10',
  },
  {
    id: 'sorrentino-frango-cremoso',
    categoryId: CategoryId.SORRENTINO,
    name: 'Sorrentino de Frango Cremoso (500g)',
    description: 'Massa fresca artesanal recheada com peito de frango desfiado temperado e requeijão cremoso.',
    price: 58.90,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSecWHZTJLEs6XBxki3un_mbvMiE0bKd0dr3a--_y6CAcf_LVrEHZVbQeY&s=10',
  },
  {
    id: 'sorrentino-pitaya',
    categoryId: CategoryId.SORRENTINO,
    name: 'Sorrentino de Pitaya (500g)',
    description: 'Massa artesanal levemente rosada de pitaya recheada com bacon defumado, alho-poró e creme especial da casa.',
    price: 58.90,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSC1WluMDfMekhCDBGC7RXpRcrT6OxHkvxWRqDP6xlHG1Y_enbUOl9Y8Fyp&s=10',
  },

  // 2. NHOQUE (RECHEADO)
  {
    id: 'nhoque-limao',
    categoryId: CategoryId.NHOQUE,
    name: 'Nhoque de Limão (500g)',
    description: 'Massa de batata levíssima recheada com queijo mussarela, raspas de limão siciliano e pedacinhos de nozes.',
    price: 58.90,
    image: 'https://i.panelinha.com.br/i1/bk-9371-blog-cmc00175.webp',
    isPopular: true,
  },
  {
    id: 'nhoque-queijo',
    categoryId: CategoryId.NHOQUE,
    name: 'Nhoque de Queijo (500g)',
    description: 'Delicioso nhoque artesanal de batata super recheado com queijo muçarela derretido e cremoso.',
    price: 58.90,
    image: 'https://guiadacozinha.com.br/wp-content/uploads/2018/10/nhoquerecheadocomqueijo.jpg',
  },
  {
    id: 'nhoque-caprese',
    categoryId: CategoryId.NHOQUE,
    name: 'Nhoque Caprese (500g)',
    description: 'Nhoque de batata recheado com queijo cremoso, tomate seco e toque aromático de manjericão fresco.',
    price: 58.90,
    image: 'https://www.estadao.com.br/resizer/XdWb_D7EUx-x5nutGk-W73fWkkE=/arc-anglerfish-arc2-prod-estadao/public/JPSCJGN37VBXFJN6QXVH2NAAOU.JPG',
  },
  {
    id: 'nhoque-gorgonzola',
    categoryId: CategoryId.NHOQUE,
    name: 'Nhoque de Gorgonzola (500g)',
    description: 'Nhoque rústico de batata com recheio marcante de queijo gorgonzola cremoso.',
    price: 58.90,
    image: 'https://static.itdg.com.br/images/580-auto/2aadcdb195ba64b2b49b4c53f5550833/shutterstock-2880064.jpg',
  },
  {
    id: 'nhoque-calabresa-queijo',
    categoryId: CategoryId.NHOQUE,
    name: 'Nhoque de Calabresa e Queijo (500g)',
    description: 'Massa de batata recheada com calabresa moída bem temperada e queijo muçarela cremoso.',
    price: 58.90,
    image: 'https://guiadacozinha.com.br/wp-content/uploads/2019/11/nhoque-mandioca-calabresa.jpg',
  },
  {
    id: 'nhoque-carne-seca-banana',
    categoryId: CategoryId.NHOQUE,
    name: 'Nhoque de Carne Seca com Banana da Terra (500g)',
    description: 'Saboroso nhoque recheado de carne seca desfiada e pedaços de banana-da-terra adocicada.',
    price: 58.90,
    image: 'https://lucanacozinha.com.br/wp-content/uploads/2017/11/gnocchi-de-banana-da-terra.jpg',
  },

  // 3. LASANHA (PRONTA)
  {
    id: 'lasanha-carne-g',
    categoryId: CategoryId.LASANHAS,
    name: 'Lasanha de Carne G (1Kg)',
    description: 'Lasanha pronta de carne bovina selecionada, molho marinara artesanal, massa fresca e queijo muçarela.',
    price: 87.50,
    image: 'https://supermercadosrondon.com.br/guiadecarnes/images/postagens/receita_simples_de_lasanha_de_carne_moda_2019-10-28.jpg',
    isPopular: true,
  },
  {
    id: 'lasanha-frango-g',
    categoryId: CategoryId.LASANHAS,
    name: 'Lasanha de Frango G (1Kg)',
    description: 'Lasanha pronta de frango desfiado temperado, molho bechamel cremoso, massa artesanal e muito queijo.',
    price: 87.50,
    image: 'https://www.perdigao.com.br/assets/_images/1e85f68e3de876f51af64009234f479b1dc6cb08.png',
  },

  // 4. RONDELE
  {
    id: 'rondele-presunto-queijo-pronto',
    categoryId: CategoryId.RONDELE,
    name: 'Rondele Pronto de Presunto e Queijo (1Kg)',
    description: 'Rondelli fresquinho assado e pronto para consumo, generosamente recheado com presunto e mussarela derretida.',
    price: 72.90,
    image: 'https://jabuticabagastronomia.com.br/wp-content/uploads/2025/12/lasanha-de-presunto-e-queijo-a-bolonhesa-congelado-500g-1.jpg',
    isPopular: true,
  },
  {
    id: 'rondele-frango-cremoso-pronto',
    categoryId: CategoryId.RONDELE,
    name: 'Rondele Pronto de Frango Cremoso (1Kg)',
    description: 'Rondelli assado recheado com peito de frango desfiado temperado com ervas e requeijão cremoso.',
    price: 72.90,
    image: 'https://receitatodahora.com.br/wp-content/uploads/2024/08/lasanha-de-frango-cremosa-4.jpg',
  },
  {
    id: 'rondele-rucula-tomate-seco-pronto',
    categoryId: CategoryId.RONDELE,
    name: 'Rondele Pronto de Rúcula com Tomate Seco (1Kg)',
    description: 'Sabor marcante de rúcula fresca e tomate seco picado com mussarela, assado e quentinho.',
    price: 72.90,
    image: 'https://receitadaboa.com.br/wp-content/uploads/2026/05/11251-1200x660.jpg',
  },
  {
    id: 'rondele-presunto-queijo-congelado',
    categoryId: CategoryId.RONDELE,
    name: 'Rondele Congelado de Presunto e Queijo (500g)',
    description: 'Rondelli artesanal congelado recheado com presunto e queijo, ideal para assar em casa.',
    price: 48.90,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsN9grN_ZIY_xqMPIRqxUKIU7lguWvWsVBTaBtOJNnBltjIuJGWje8YBO5&s=10',
  },
  {
    id: 'rondele-frango-cremoso-congelado',
    categoryId: CategoryId.RONDELE,
    name: 'Rondele Congelado de Frango Cremoso (500g)',
    description: 'Rondelli congelado de frango com requeijão, super prático de preparar quando quiser.',
    price: 48.90,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdTwGfNjqYRNPk8QN2BfK0fDI_isntk9x3cxNSTEm6h2BYLO7wr5qAZrvJ&s=10',
  },
  {
    id: 'rondele-rucula-tomate-seco-congelado',
    categoryId: CategoryId.RONDELE,
    name: 'Rondele Congelado de Rúcula com Tomate Seco (500g)',
    description: 'Rondelli congelado de rúcula com tomate seco, uma massa vegetariana saborosa e leve.',
    price: 48.90,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRqG6iCOcfV2GbuKQLNZqRXOWDs_TekvnEvYhpD5NWU3trNLzpgEb3Jzwc&s=10',
  },

  // 5. CAPELETE E TORTÉI
  {
    id: 'capelete-carne',
    categoryId: CategoryId.CAPELETE_TORTEI,
    name: 'Capelete de Carne (500g)',
    description: 'Pequenos chapéus de massa fresca recheados com carne bovina moída e temperada da vovó.',
    price: 48.00,
    image: 'https://www.receiteria.com.br/wp-content/uploads/capeletti-de-carne.jpeg',
  },
  {
    id: 'capelete-frango',
    categoryId: CategoryId.CAPELETE_TORTEI,
    name: 'Capelete de Frango (500g)',
    description: 'Massa artesanal recheada com peito de frango desfiado fino e levemente temperado.',
    price: 48.00,
    image: 'https://static.itdg.com.br/images/640-400/b4e495690e4fe96e504cff35b6784f65/353652-original-1-.jpg',
  },
  {
    id: 'tortei-pronto',
    categoryId: CategoryId.CAPELETE_TORTEI,
    name: 'Tortéi Pronto (1Kg)',
    description: 'Tradicionalíssimo tortéi artesanal recheado com abóbora doce temperada, servido pronto.',
    price: 60.00,
    image: 'https://www.receiteria.com.br/wp-content/uploads/tortei-de-abobora-11-730x548.jpg',
    isPopular: true,
  },
  {
    id: 'tortei-pastelzinho',
    categoryId: CategoryId.CAPELETE_TORTEI,
    name: 'Tortéi Pastelzinho (500g)',
    description: 'Tortéi moldado em formato de mini pasteizinhos, super crocantes e macios.',
    price: 45.00,
    image: 'https://prosapoemapastel.com/wp-content/uploads/2020/01/pasteis.jpg',
  },
  {
    id: 'tortei-rondele',
    categoryId: CategoryId.CAPELETE_TORTEI,
    name: 'Tortéi Rondele (500g)',
    description: 'Massa fresca moldada em rondeles recheados com nosso clássico e saboroso creme de abóbora.',
    price: 48.00,
    image: 'https://espaconatelie.com.br/wp-content/uploads/2024/04/Rondele.jpg',
  },

  // 6. MOLHOS
  {
    id: 'molho-sugo',
    categoryId: CategoryId.MOLHOS,
    name: 'Molho ao Sugo (500g)',
    description: 'Molho clássico de tomates italianos pelados cozido lentamente com azeite e manjericão fresco.',
    price: 28.00,
    image: 'https://www.sabornamesa.com.br/media/k2/items/cache/0ac3c30b52cc673c47c8f06e4a24e671_XL.jpg',
  },
  {
    id: 'molho-bechamel',
    categoryId: CategoryId.MOLHOS,
    name: 'Molho Bechamel (500g)',
    description: 'Molho branco cremoso e aveludado feito com manteiga, farinha, leite e um toque sutil de noz-moscada.',
    price: 28.00,
    image: 'https://www.receiteria.com.br/wp-content/uploads/molho-bechamel-facil-e-rapido.jpg',
  },
  {
    id: 'molho-quatro-queijos',
    categoryId: CategoryId.MOLHOS,
    name: 'Molho 4 Queijo (500g)',
    description: 'O sabor inconfundível do molho branco combinado com muçarela, parmesão, provolone e gorgonzola.',
    price: 28.00,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjTla7p068cBFzOEgtT1pFKNtMPJ-yjz9iAqO4cP4kYsa0j6CYau48Dfo&s=10',
  },

  // 7. NHOQUE TRADICIONAL
  {
    id: 'nhoque-tradicional-batata',
    categoryId: CategoryId.NHOQUE_TRADICIONAL,
    name: 'Nhôque de Batata (500g)',
    description: 'Nhoque tradicional de batata selecionada, leve e extremamente saboroso, sem recheio.',
    price: 27.90,
    image: 'https://i0.statig.com.br/bancodeimagens/b1/pf/qw/b1pfqwt11rg03rdc8v7seo8h7.jpg',
  },
  {
    id: 'nhoque-tradicional-batata-doce',
    categoryId: CategoryId.NHOQUE_TRADICIONAL,
    name: 'Nhôque de Batata Doce (500g)',
    description: 'Leveza e suavidade com o toque adocicado da batata doce nesta receita artesanal.',
    price: 27.90,
    image: 'https://s2-vogue.glbimg.com/aVoYn88F84LBwNWLF2khlpRuobg=/0x0:620x620/984x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_5dfbcf92c1a84b20a5da5024d398ff2f/internal_photos/bs/2022/B/t/0WJrQUTkyEl1rRduy6SA/2016-03-31-thinkstockphotos-510610438.jpg',
  },

  // 8. CARNES
  {
    id: 'frango-kaskata',
    categoryId: CategoryId.CARNES,
    name: 'Frango Kaskata',
    description: 'Frango inteiro ou desossado cozido lentamente em tempero rústico especial, dourado e incrivelmente suculento.',
    price: 95.90,
    image: 'https://i0.wp.com/jdreceitas.com.br/wp-content/uploads/2017/04/frango-1.jpg?fit=1200%2C800&ssl=1',
  },
  {
    id: 'frango-cacadora',
    categoryId: CategoryId.CARNES,
    name: 'Frango a Caçadora',
    description: 'Guisado tradicional italiano de peito e coxas de frango com molho de tomate rústico, pimentões, ervas finas e cogumelos.',
    price: 85.90,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKzzcfRmk-p5ECWTIXXJy93sFupTYG04K-OKz0GU8mgp70vPR24EEgeQ4&s=10',
  },
  {
    id: 'file-molho-madeira',
    categoryId: CategoryId.CARNES,
    name: 'Filé ao Molho Madeira',
    description: 'Suculentos medalhões de filé mignon grelhados, cobertos com nosso exclusivo molho ao vinho Madeira e cogumelos champignon.',
    price: 150.00,
    image: 'https://i.ytimg.com/vi/xo1R-jervSk/maxresdefault.jpg',
    isPopular: true,
  },

  // 9. SOBREMESAS
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

  // 10. BEBIDAS (INATIVADAS TEMPORARIAMENTE)
  {
    id: 'coca-lata',
    categoryId: CategoryId.BEBIDAS,
    name: 'Coca-Cola Lata 350ml',
    description: 'Geladíssima.',
    price: 6.00,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600',
    isActive: false,
    isOutOfStock: true,
  },
  {
    id: 'guarana-lata',
    categoryId: CategoryId.BEBIDAS,
    name: 'Guaraná Antarctica Lata 350ml',
    description: 'Original da Amazônia.',
    price: 6.00,
    image: 'https://images.unsplash.com/photo-1527960650-066b8d441d44?auto=format&fit=crop&q=80&w=600',
    isActive: false,
    isOutOfStock: true,
  },
  {
    id: 'coca-2l',
    categoryId: CategoryId.BEBIDAS,
    name: 'Coca-Cola Garrafa 2 Litros',
    description: 'Ideal para compartilhar com a família.',
    price: 12.00,
    image: coca2lImage,
    isActive: false,
    isOutOfStock: true,
  },
  {
    id: 'suco-laranja',
    categoryId: CategoryId.BEBIDAS,
    name: 'Suco Natural de Laranja 500ml',
    description: 'Feito na hora, 100% puro suco de laranja da fruta.',
    price: 9.00,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=600',
    isActive: false,
    isOutOfStock: true,
  },
  {
    id: 'cerveja-heineken',
    categoryId: CategoryId.BEBIDAS,
    name: 'Cerveja Heineken Long Neck 330ml',
    description: 'Cerveja premium lager gelada.',
    price: 9.00,
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&q=80&w=600',
    isActive: false,
    isOutOfStock: true,
  },
  {
    id: 'agua-mineral',
    categoryId: CategoryId.BEBIDAS,
    name: 'Água Mineral Sem Gás 500ml',
    description: 'Fria.',
    price: 4.00,
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=600',
    isActive: false,
    isOutOfStock: true,
  },
];
