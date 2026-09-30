import React, { createContext, useContext, useState, useEffect } from 'react';
import { CompanySettings, Order, OrderStatus, Product, CartItem, OrderItem, PaymentMethod, CashMovement, Category, CategoryId } from '../types';
import { RESTAURANT_INFO, PRODUCTS, CATEGORIES } from '../data';
import { db, auth, sanitizeFirestoreData } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { normalizePhoneNumber } from '../utils/phone';

interface CompanyContextType {
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>) => Promise<void>;
  
  // Categories (com emojis e personalização completa)
  categories: Category[];
  addCategory: (name: string, icon: string) => Promise<Category>;
  updateCategory: (id: string, name: string, icon: string) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;

  // Menu Products
  allProducts: Product[];
  addProduct: (newProd: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (id: string, updated: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductActiveStatus: (productId: string, isActive: boolean) => Promise<void>;
  toggleProductStockStatus: (productId: string, isOutOfStock: boolean) => Promise<void>;
  updateProductStockQuantity: (productId: string, newStock: number) => Promise<void>;

  // Orders
  orders: Order[];
  createOrder: (orderInput: Omit<Order, 'id' | 'orderNumber' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;

  // POS / Direct Sales (Balcão & Mesas)
  createDirectSale: (saleInput: {
    customerName?: string;
    customerPhone?: string;
    deliveryType: 'takeaway' | 'dine_in';
    tableNumber?: string;
    posIdentifierType?: 'mesa' | 'comanda' | 'assento' | 'cliente';
    posIdentifierValue?: string;
    paymentMethod: PaymentMethod;
    changeFor?: string;
    items: OrderItem[];
    itemsSubtotal: number;
    grandTotal: number;
    notes?: string;
    status?: OrderStatus;
  }) => Promise<Order>;

  // Cash Movements (Caixa do ERP: Suprimento e Sangria)
  cashMovements: CashMovement[];
  addCashMovement: (type: 'suprimento' | 'sangria', amount: number, reason: string) => Promise<void>;

  // Master Admin Auth
  isMasterAuth: boolean;
  loginMaster: (user: string, pass: string) => boolean;
  logoutMaster: () => void;
  updateMasterCredentials: (newUser: string, newPass: string) => Promise<boolean>;
}

const DEFAULT_SETTINGS: CompanySettings = {
  whatsappNumber: '556696523006',
  phone: '(66) 99652-3006',
  pixKey: '66996523006',
  pixKeyType: 'Celular',
  pixBeneficiary: 'Massas da Vovó',
  adminUser: 'Admin',
  adminPass: '1234',
  operatingHours: {
    openDays: [2, 3, 4, 5, 6, 0], // Terça a Domingo
    openTime: '18:00',
    closeTime: '23:00',
    forceStatus: 'auto',
  },
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

// Safe localStorage wrapper to prevent quota crashes with images
const safeSetLocalStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`LocalStorage write skipped for ${key}:`, err);
  }
};

// Helper to get initial products list
const getInitialProducts = (): Product[] => {
  try {
    const savedMenu = localStorage.getItem('vovo_menu_items');
    if (savedMenu) {
      const parsed = JSON.parse(savedMenu);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const legacyCustom = localStorage.getItem('vovo_custom_products');
    if (legacyCustom) {
      const parsedCustom: Product[] = JSON.parse(legacyCustom);
      if (Array.isArray(parsedCustom) && parsedCustom.length > 0) {
        return [
          ...parsedCustom,
          ...PRODUCTS.filter(p => !parsedCustom.some(cp => cp.id === p.id))
        ];
      }
    }
  } catch (e) {
    console.error('Error reading initial products:', e);
  }
  return PRODUCTS;
};

// Helper to get initial deleted product IDs
const getInitialDeletedIds = (): string[] => {
  try {
    const saved = localStorage.getItem('vovo_deleted_products');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading deleted products:', e);
  }
  return [];
};

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Settings state
  const [settings, setSettings] = useState<CompanySettings>(() => {
    try {
      const saved = localStorage.getItem('vovo_company_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SETTINGS;
  });

  // 2. Full Products list (defaults + custom + overrides)
  const [productsList, setProductsList] = useState<Product[]>(getInitialProducts);

  // 3. Deleted product IDs
  const [deletedProductIds, setDeletedProductIds] = useState<string[]>(getInitialDeletedIds);

  // 4. Orders state
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('vovo_orders_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // 4.1 Deleted order IDs to prevent ghost restoration
  const [deletedOrderIds, setDeletedOrderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vovo_deleted_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 5. Master Auth state
  const [isMasterAuth, setIsMasterAuth] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('vovo_master_auth') === 'true';
    } catch {
      return false;
    }
  });

  // 6. Dish Categories State (Default + Custom Categories with persistent deletion)
  const [deletedCategoryIds, setDeletedCategoryIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vovo_deleted_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const savedDeleted = localStorage.getItem('vovo_deleted_categories');
      const deletedIds: string[] = savedDeleted ? JSON.parse(savedDeleted) : [];
      const isBebida = (id: string, name?: string) => id === 'bebidas' || (name && name.toLowerCase().trim() === 'bebidas');
      const saved = localStorage.getItem('vovo_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((c: Category) => !deletedIds.includes(c.id) && !isBebida(c.id, c.name));
        }
      }
      return CATEGORIES.filter(c => !deletedIds.includes(c.id) && !isBebida(c.id, c.name));
    } catch (e) {
      console.error(e);
    }
    return CATEGORIES.filter(c => c.id !== 'bebidas');
  });

  // Fetch & Subscribe to Categories from Firestore in real-time
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const catRef = collection(db, 'categories');
      unsubscribe = onSnapshot(catRef, (snapshot) => {
        const savedDeleted = localStorage.getItem('vovo_deleted_categories');
        const currentDeleted: string[] = savedDeleted ? JSON.parse(savedDeleted) : [];
        const isBebida = (id: string, name?: string) => id === 'bebidas' || (name && name.toLowerCase().trim() === 'bebidas');

        if (!snapshot.empty) {
          const remoteCats: Category[] = [];
          snapshot.forEach(docSnap => {
            const d = docSnap.data();
            if (d.name && d.icon && !currentDeleted.includes(docSnap.id) && d.isActive !== false && !isBebida(docSnap.id, d.name)) {
              remoteCats.push({
                id: docSnap.id,
                name: d.name,
                icon: d.icon,
                isCustom: d.isCustom !== undefined ? d.isCustom : true,
              });
            }
          });

          // Merge default categories with custom categories from Firestore
          setCategories(prev => {
            const baseCats = CATEGORIES.filter(c => !currentDeleted.includes(c.id) && !isBebida(c.id, c.name));
            const merged = [...baseCats];
            remoteCats.forEach(rc => {
              if (isBebida(rc.id, rc.name)) return;
              const existingIdx = merged.findIndex(c => c.id === rc.id);
              if (existingIdx >= 0) {
                merged[existingIdx] = rc;
              } else {
                merged.push(rc);
              }
            });
            localStorage.setItem('vovo_categories', JSON.stringify(merged));
            return merged;
          });
        }
      }, (err) => {
        console.warn('Categories onSnapshot error:', err);
      });
    } catch (e) {
      console.warn('Could not listen to categories collection:', e);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fetch Settings from Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const settingsDocRef = doc(db, 'app_settings', 'general');
      getDoc(settingsDocRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as CompanySettings;
            setSettings(prev => {
              const merged = { ...prev, ...data };
              localStorage.setItem('vovo_company_settings', JSON.stringify(merged));
              return merged;
            });
          } else {
            // Initialize doc in Firestore
            setDoc(settingsDocRef, {
              ...DEFAULT_SETTINGS,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }).catch(e => console.warn('Could not seed app_settings in Firestore:', e));
          }
        })
        .catch(err => {
          console.warn('Error reading app_settings from Firestore, using local fallback:', err);
        });
    } catch (e) {
      console.warn(e);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fetch & Subscribe to Menu Items from Firestore in real-time
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const menuRef = collection(db, 'menu_items');
      unsubscribe = onSnapshot(menuRef, (snapshot) => {
        if (snapshot.empty) return;
        const remoteMap = new Map<string, Product>();
        const remoteDeleted: string[] = [];

        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.deleted === true || data.isDeleted === true) {
            remoteDeleted.push(docSnap.id);
          } else if (data.name) {
            const baseProd = PRODUCTS.find(p => p.id === docSnap.id);
            const remoteImage = (typeof data.image === 'string' && data.image.trim()) ? data.image.trim() : (baseProd?.image || '');
            remoteMap.set(docSnap.id, {
              id: docSnap.id,
              name: data.name,
              categoryId: data.categoryId || baseProd?.categoryId || 'lasanhas' as any,
              description: data.description !== undefined ? data.description : (baseProd?.description || ''),
              price: Number(data.price) || baseProd?.price || 0,
              image: remoteImage,
              isPopular: Boolean(data.isPopular),
              isActive: data.isActive !== undefined ? Boolean(data.isActive) : (baseProd?.isActive !== undefined ? baseProd.isActive : true),
              stock: data.stock !== undefined ? Number(data.stock) : baseProd?.stock,
              isOutOfStock: data.isOutOfStock !== undefined ? Boolean(data.isOutOfStock) : Boolean(baseProd?.isOutOfStock),
              costPrice: data.costPrice !== undefined ? Number(data.costPrice) : baseProd?.costPrice,
              customizable: data.customizable !== undefined ? data.customizable : baseProd?.customizable,
              sizes: data.sizes !== undefined ? data.sizes : baseProd?.sizes,
            });
          }
        });

        if (remoteDeleted.length > 0) {
          setDeletedProductIds(prev => {
            const merged = Array.from(new Set([...prev, ...remoteDeleted]));
            safeSetLocalStorage('vovo_deleted_products', JSON.stringify(merged));
            return merged;
          });
        }

        if (remoteMap.size > 0) {
          setProductsList(prev => {
            const map = new Map<string, Product>();
            // Initialize with current list
            prev.forEach(p => map.set(p.id, p));
            // Apply remote items
            remoteMap.forEach((remProd, id) => {
              const existing = map.get(id);
              map.set(id, {
                ...existing,
                ...remProd,
                image: remProd.image || existing?.image || '',
              });
            });
            // Filter out deleted
            const combined = Array.from(map.values()).filter(p => !remoteDeleted.includes(p.id));
            safeSetLocalStorage('vovo_menu_items', JSON.stringify(combined));
            return combined;
          });
        }
      }, (err) => {
        console.warn('menu_items onSnapshot listener error:', err);
      });
    } catch (e) {
      console.warn('Could not initialize menu_items listener:', e);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Subscribe / Fetch Orders from Firestore
  useEffect(() => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let savedDeleted: string[] = [];
        try {
          savedDeleted = JSON.parse(localStorage.getItem('vovo_deleted_orders') || '[]');
        } catch {}

        const list: Order[] = [];
        snapshot.forEach(docSnap => {
          const d = docSnap.data();
          if (d.deleted === true || savedDeleted.includes(docSnap.id)) {
            return;
          }
          const phone = d.customerPhone || '';
          // Robust parsing of createdAt and updatedAt from Firestore
          let createdAtStr = new Date().toISOString();
          if (d.createdAt) {
            if (typeof d.createdAt.toDate === 'function') {
              try { createdAtStr = d.createdAt.toDate().toISOString(); } catch {}
            } else if (typeof d.createdAt === 'string' && d.createdAt.trim() && d.createdAt !== '[object Object]') {
              createdAtStr = d.createdAt;
            } else if (typeof d.createdAt.seconds === 'number') {
              createdAtStr = new Date(d.createdAt.seconds * 1000).toISOString();
            } else if (typeof d.createdAt._seconds === 'number') {
              createdAtStr = new Date(d.createdAt._seconds * 1000).toISOString();
            } else if (typeof d.createdAt === 'number') {
              createdAtStr = new Date(d.createdAt).toISOString();
            }
          } else if (d.createdAtIso) {
            createdAtStr = d.createdAtIso;
          } else if (typeof d.timestamp === 'number') {
            createdAtStr = new Date(d.timestamp).toISOString();
          } else {
            // Check if document id contains timestamp (pos-1727690000000 or ord-1727690000000)
            const match = docSnap.id.match(/\d{12,14}/);
            if (match) {
              const ts = Number(match[0]);
              if (!isNaN(ts)) createdAtStr = new Date(ts).toISOString();
            }
          }

          let updatedAtStr = createdAtStr;
          if (d.updatedAt) {
            if (typeof d.updatedAt.toDate === 'function') {
              try { updatedAtStr = d.updatedAt.toDate().toISOString(); } catch {}
            } else if (typeof d.updatedAt === 'string' && d.updatedAt.trim() && d.updatedAt !== '[object Object]') {
              updatedAtStr = d.updatedAt;
            } else if (typeof d.updatedAt.seconds === 'number') {
              updatedAtStr = new Date(d.updatedAt.seconds * 1000).toISOString();
            } else if (typeof d.updatedAt._seconds === 'number') {
              updatedAtStr = new Date(d.updatedAt._seconds * 1000).toISOString();
            }
          }

          list.push({
            id: docSnap.id,
            orderNumber: d.orderNumber || docSnap.id,
            customerName: d.customerName || '',
            customerPhone: phone,
            customerPhoneClean: d.customerPhoneClean || normalizePhoneNumber(phone),
            customerId: d.customerId || undefined,
            deliveryType: d.deliveryType || 'delivery',
            tableNumber: d.tableNumber || undefined,
            posIdentifierType: d.posIdentifierType || undefined,
            posIdentifierValue: d.posIdentifierValue || undefined,
            origin: d.origin || 'web',
            street: d.street,
            number: d.number,
            neighborhood: d.neighborhood,
            reference: d.reference,
            paymentMethod: d.paymentMethod || 'pix_now',
            changeFor: d.changeFor,
            items: d.items || [],
            itemsSubtotal: Number(d.itemsSubtotal) || 0,
            deliveryFee: Number(d.deliveryFee) || 0,
            grandTotal: Number(d.grandTotal) || 0,
            status: d.status || 'novo',
            schedule: d.schedule,
            notes: d.notes,
            createdAt: createdAtStr,
            updatedAt: updatedAtStr,
          });
        });
        setOrders(list);
        localStorage.setItem('vovo_orders_history', JSON.stringify(list));
      }, (err) => {
        console.warn('Orders onSnapshot error (using local orders list):', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // Update Settings
  const updateSettings = async (newSettings: Partial<CompanySettings>) => {
    const merged = { ...settings, ...newSettings, updatedAt: new Date().toISOString() };
    setSettings(merged);
    localStorage.setItem('vovo_company_settings', JSON.stringify(merged));

    try {
      const settingsDocRef = doc(db, 'app_settings', 'general');
      await setDoc(settingsDocRef, {
        ...newSettings,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('Could not save settings to Firestore, saved to localStorage:', err);
    }
  };

  // Add Product
  const addProduct = async (newProd: Omit<Product, 'id'>): Promise<Product> => {
    const id = 'item-' + Date.now();
    const product: Product = {
      ...newProd,
      id,
      name: newProd.name.trim(),
      description: (newProd.description || '').trim(),
      image: (newProd.image || '').trim(),
      price: Number(newProd.price) || 0,
      isPopular: Boolean(newProd.isPopular),
    };

    setProductsList(prev => {
      const updated = [product, ...prev];
      safeSetLocalStorage('vovo_menu_items', JSON.stringify(updated));
      return updated;
    });

    try {
      const prodRef = doc(db, 'menu_items', id);
      await setDoc(prodRef, {
        id: product.id,
        name: product.name,
        categoryId: product.categoryId,
        description: product.description,
        price: product.price,
        image: product.image,
        isPopular: product.isPopular,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Could not save product to Firestore, saved to local store:', err);
    }

    return product;
  };

  // Update Product
  const updateProduct = async (id: string, updatedFields: Partial<Product>) => {
    // 1. Resolve base and existing item to build complete merged state
    const base = PRODUCTS.find(p => p.id === id);
    const existing = productsList.find(p => p.id === id);

    const mergedProduct: Product = {
      id,
      name: (updatedFields.name !== undefined ? updatedFields.name : (existing?.name || base?.name || '')).trim(),
      categoryId: updatedFields.categoryId || existing?.categoryId || base?.categoryId || ('lasanhas' as any),
      description: (updatedFields.description !== undefined ? updatedFields.description : (existing?.description ?? base?.description ?? '')).trim(),
      price: updatedFields.price !== undefined ? Number(updatedFields.price) : (existing?.price ?? base?.price ?? 0),
      image: (updatedFields.image !== undefined ? updatedFields.image : (existing?.image || base?.image || '')).trim(),
      isPopular: updatedFields.isPopular !== undefined ? Boolean(updatedFields.isPopular) : (existing?.isPopular ?? base?.isPopular ?? false),
      isActive: updatedFields.isActive !== undefined ? Boolean(updatedFields.isActive) : (existing?.isActive ?? base?.isActive ?? true),
      customizable: existing?.customizable ?? base?.customizable,
      sizes: existing?.sizes ?? base?.sizes,
    };

    // 2. Update state immediately
    setProductsList(prev => {
      const index = prev.findIndex(p => p.id === id);
      let updated: Product[];
      if (index >= 0) {
        updated = [...prev];
        updated[index] = mergedProduct;
      } else {
        updated = [mergedProduct, ...prev];
      }
      safeSetLocalStorage('vovo_menu_items', JSON.stringify(updated));
      return updated;
    });

    // 3. Remove from deleted list if it was there
    setDeletedProductIds(prev => {
      if (prev.includes(id)) {
        const updated = prev.filter(item => item !== id);
        safeSetLocalStorage('vovo_deleted_products', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });

    // 4. Update Firestore
    try {
      const prodRef = doc(db, 'menu_items', id);
      const payload: Record<string, any> = {
        id: mergedProduct.id,
        name: mergedProduct.name,
        categoryId: mergedProduct.categoryId,
        description: mergedProduct.description,
        price: mergedProduct.price,
        image: mergedProduct.image,
        isPopular: mergedProduct.isPopular,
        isActive: mergedProduct.isActive !== false,
        updatedAt: serverTimestamp(),
      };
      if (mergedProduct.customizable !== undefined) payload.customizable = mergedProduct.customizable;
      if (mergedProduct.sizes !== undefined) payload.sizes = mergedProduct.sizes;

      await setDoc(prodRef, payload, { merge: true });
    } catch (err) {
      console.warn('Could not update product in Firestore, local update preserved:', err);
    }
  };

  // Delete Product
  const deleteProduct = async (id: string) => {
    setDeletedProductIds(prev => {
      const updated = Array.from(new Set([...prev, id]));
      safeSetLocalStorage('vovo_deleted_products', JSON.stringify(updated));
      return updated;
    });

    setProductsList(prev => {
      const updated = prev.filter(p => p.id !== id);
      safeSetLocalStorage('vovo_menu_items', JSON.stringify(updated));
      return updated;
    });

    try {
      const prodRef = doc(db, 'menu_items', id);
      await setDoc(prodRef, { deleted: true, isDeleted: true, isActive: false, deletedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.warn('Could not mark product as deleted in Firestore:', err);
    }
  };

  // Create Customer Order
  const createOrder = async (orderInput: Omit<Order, 'id' | 'orderNumber' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `#MV-${randomSuffix}`;
    const id = `order-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const currentUid = auth.currentUser?.uid || null;
    const cleanPhone = normalizePhoneNumber(orderInput.customerPhone);

    const newOrder: Order = {
      ...orderInput,
      id,
      orderNumber,
      status: 'novo',
      customerPhoneClean: cleanPhone,
      customerId: orderInput.customerId || (currentUid ? currentUid : undefined),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Save locally immediately as fallback
    const updatedOrders = [newOrder, ...orders.filter(o => o.id !== id)];
    setOrders(updatedOrders);
    localStorage.setItem('vovo_orders_history', JSON.stringify(updatedOrders));
    try {
      const myIds = JSON.parse(localStorage.getItem('vovo_my_order_ids') || '[]');
      if (!myIds.includes(id)) {
        localStorage.setItem('vovo_my_order_ids', JSON.stringify([id, ...myIds]));
      }
    } catch (e) {
      console.warn('Error saving my_order_ids:', e);
    }

    // Save to Firestore (Database is primary source of truth for Master and App)
    try {
      const orderRef = doc(db, 'orders', id);
      const cleanedData = sanitizeFirestoreData({
        ...newOrder,
        customerPhoneClean: cleanPhone,
        createdAt: nowIso,
        createdAtIso: nowIso,
        timestamp: Date.now(),
        updatedAt: nowIso,
      });
      await setDoc(orderRef, cleanedData);
      console.log('Order successfully persisted in Firestore database:', id);
    } catch (err) {
      console.error('Error saving order to Firestore database:', err);
    }

    return newOrder;
  };

  // Update Order Status
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const nowIso = new Date().toISOString();
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status, updatedAt: nowIso } : o);
    setOrders(updatedOrders);
    localStorage.setItem('vovo_orders_history', JSON.stringify(updatedOrders));

    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Could not update order status in Firestore:', err);
    }
  };

  // Delete Order Permanently
  const deleteOrder = async (orderId: string) => {
    // 1. Mark in deleted order IDs list immediately
    setDeletedOrderIds(prev => {
      const updated = Array.from(new Set([...prev, orderId]));
      localStorage.setItem('vovo_deleted_orders', JSON.stringify(updated));
      return updated;
    });

    // 2. Remove from active state and localStorage
    setOrders(prev => {
      const updated = prev.filter(o => o.id !== orderId);
      localStorage.setItem('vovo_orders_history', JSON.stringify(updated));
      return updated;
    });

    // 3. Remove from user local order IDs if present
    try {
      const myIds: string[] = JSON.parse(localStorage.getItem('vovo_my_order_ids') || '[]');
      const filtered = myIds.filter(id => id !== orderId);
      localStorage.setItem('vovo_my_order_ids', JSON.stringify(filtered));
    } catch (e) {
      console.warn('Error clearing my_order_ids:', e);
    }

    // 4. Delete from Firestore
    try {
      const orderRef = doc(db, 'orders', orderId);
      await deleteDoc(orderRef);
      console.log('Order deleted permanently from Firestore:', orderId);
    } catch (err) {
      console.warn('Could not delete order from Firestore, marking as deleted:', err);
      try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { deleted: true, status: 'cancelado' });
      } catch (e2) {
        console.error('Fallback mark deleted also failed:', e2);
      }
    }
  };

  // Direct POS / Balcão Sale
  const createDirectSale = async (saleInput: {
    customerName?: string;
    customerPhone?: string;
    deliveryType: 'takeaway' | 'dine_in';
    tableNumber?: string;
    posIdentifierType?: 'mesa' | 'comanda' | 'assento' | 'cliente';
    posIdentifierValue?: string;
    paymentMethod: PaymentMethod;
    changeFor?: string;
    items: OrderItem[];
    itemsSubtotal: number;
    grandTotal: number;
    notes?: string;
    status?: OrderStatus;
  }): Promise<Order> => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const idPrefix = saleInput.posIdentifierType === 'mesa' ? `MESA-${saleInput.posIdentifierValue || randomSuffix}` :
                     saleInput.posIdentifierType === 'comanda' ? `CMD-${saleInput.posIdentifierValue || randomSuffix}` :
                     saleInput.posIdentifierType === 'assento' ? `AST-${saleInput.posIdentifierValue || randomSuffix}` :
                     `BALCAO-${randomSuffix}`;
    const orderNumber = `#${idPrefix}`;
    const id = `pos-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const cleanPhone = saleInput.customerPhone ? normalizePhoneNumber(saleInput.customerPhone) : '';

    // Human-friendly default name based on identifier
    let defaultCustomerName = 'Cliente Balcão';
    if (saleInput.customerName?.trim()) {
      defaultCustomerName = saleInput.customerName.trim();
    } else if (saleInput.posIdentifierValue?.trim()) {
      if (saleInput.posIdentifierType === 'mesa') defaultCustomerName = `Mesa ${saleInput.posIdentifierValue.trim()}`;
      else if (saleInput.posIdentifierType === 'comanda') defaultCustomerName = `Comanda ${saleInput.posIdentifierValue.trim()}`;
      else if (saleInput.posIdentifierType === 'assento') defaultCustomerName = `Assento / Balcão ${saleInput.posIdentifierValue.trim()}`;
      else defaultCustomerName = saleInput.posIdentifierValue.trim();
    }

    const newOrder: Order = {
      id,
      orderNumber,
      customerName: defaultCustomerName,
      customerPhone: saleInput.customerPhone || '',
      customerPhoneClean: cleanPhone,
      deliveryType: saleInput.deliveryType,
      tableNumber: saleInput.tableNumber || (saleInput.posIdentifierType === 'mesa' ? saleInput.posIdentifierValue : undefined),
      posIdentifierType: saleInput.posIdentifierType,
      posIdentifierValue: saleInput.posIdentifierValue,
      origin: 'pos',
      paymentMethod: saleInput.paymentMethod,
      changeFor: saleInput.changeFor,
      items: saleInput.items,
      itemsSubtotal: saleInput.itemsSubtotal,
      deliveryFee: 0,
      grandTotal: saleInput.grandTotal,
      status: saleInput.status || 'concluido',
      notes: saleInput.notes,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Update orders immediately in state and storage
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem('vovo_orders_history', JSON.stringify(updatedOrders));

    // Persist to Firestore
    try {
      const orderRef = doc(db, 'orders', id);
      const cleanedData = sanitizeFirestoreData({
        ...newOrder,
        createdAt: nowIso,
        createdAtIso: nowIso,
        timestamp: Date.now(),
        updatedAt: nowIso,
      });
      await setDoc(orderRef, cleanedData);
    } catch (err) {
      console.warn('Could not save POS order to Firestore, local state preserved:', err);
    }

    return newOrder;
  };

  // Add Category with chosen Emoji
  const addCategory = async (name: string, icon: string): Promise<Category> => {
    const slug = name.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const id = slug || `cat-${Date.now()}`;

    const newCategory: Category = {
      id,
      name: name.trim(),
      icon: icon.trim() || '🍽️',
      isCustom: true,
    };

    // Remove from deleted list if previously deleted
    setDeletedCategoryIds(prev => {
      const updated = prev.filter(dId => dId !== id);
      localStorage.setItem('vovo_deleted_categories', JSON.stringify(updated));
      return updated;
    });

    setCategories(prev => {
      const updated = prev.some(c => c.id === id)
        ? prev.map(c => c.id === id ? newCategory : c)
        : [...prev, newCategory];
      localStorage.setItem('vovo_categories', JSON.stringify(updated));
      return updated;
    });

    try {
      const catRef = doc(db, 'categories', id);
      await setDoc(catRef, {
        id,
        name: newCategory.name,
        icon: newCategory.icon,
        isCustom: true,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Could not save category to Firestore, local state preserved:', err);
    }

    return newCategory;
  };

  // Update Existing Category
  const updateCategory = async (id: string, name: string, icon: string): Promise<Category> => {
    const updatedCategory: Category = {
      id,
      name: name.trim(),
      icon: icon.trim() || '🍽️',
      isCustom: true,
    };

    setCategories(prev => {
      const updated = prev.map(c => c.id === id ? updatedCategory : c);
      localStorage.setItem('vovo_categories', JSON.stringify(updated));
      return updated;
    });

    try {
      const catRef = doc(db, 'categories', id);
      await setDoc(catRef, {
        id,
        name: updatedCategory.name,
        icon: updatedCategory.icon,
        isActive: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('Could not update category in Firestore, local state preserved:', err);
    }

    return updatedCategory;
  };

  // Delete Any Category (persisting deletion)
  const deleteCategory = async (id: string): Promise<void> => {
    setDeletedCategoryIds(prev => {
      const updated = [...new Set([...prev, id])];
      localStorage.setItem('vovo_deleted_categories', JSON.stringify(updated));
      return updated;
    });

    setCategories(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('vovo_categories', JSON.stringify(updated));
      return updated;
    });

    try {
      const catRef = doc(db, 'categories', id);
      await setDoc(catRef, { isActive: false, deletedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.warn('Could not delete category from Firestore:', err);
    }
  };

  // Cash Movements (Caixa)
  const [cashMovements, setCashMovements] = useState<CashMovement[]>(() => {
    try {
      const saved = localStorage.getItem('vovo_cash_movements');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const addCashMovement = async (type: 'suprimento' | 'sangria', amount: number, reason: string) => {
    const newMovement: CashMovement = {
      id: `mov-${Date.now()}`,
      type,
      amount,
      reason: reason.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newMovement, ...cashMovements];
    setCashMovements(updated);
    localStorage.setItem('vovo_cash_movements', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'cash_movements', newMovement.id), {
        ...newMovement,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Could not save cash movement to Firestore:', e);
    }
  };

  // Active / Inactive Status Controls (Inativar / Reativar Produto)
  const toggleProductActiveStatus = async (productId: string, isActive: boolean) => {
    setProductsList(prev => {
      const updated = prev.map(p => p.id === productId ? { ...p, isActive } : p);
      safeSetLocalStorage('vovo_menu_items', JSON.stringify(updated));
      return updated;
    });
    try {
      const prodRef = doc(db, 'menu_items', productId);
      await setDoc(prodRef, { isActive, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.warn('Could not update isActive in Firestore:', err);
    }
  };

  // Stock Quick Controls
  const toggleProductStockStatus = async (productId: string, isOutOfStock: boolean) => {
    setProductsList(prev => {
      const updated = prev.map(p => p.id === productId ? { ...p, isOutOfStock } : p);
      safeSetLocalStorage('vovo_menu_items', JSON.stringify(updated));
      return updated;
    });
    try {
      const prodRef = doc(db, 'menu_items', productId);
      await setDoc(prodRef, { isOutOfStock, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.warn('Could not update isOutOfStock in Firestore:', err);
    }
  };

  const updateProductStockQuantity = async (productId: string, newStock: number) => {
    setProductsList(prev => {
      const updated = prev.map(p => p.id === productId ? { ...p, stock: Math.max(0, newStock), isOutOfStock: newStock <= 0 } : p);
      safeSetLocalStorage('vovo_menu_items', JSON.stringify(updated));
      return updated;
    });
    try {
      const prodRef = doc(db, 'menu_items', productId);
      await setDoc(prodRef, { stock: Math.max(0, newStock), isOutOfStock: newStock <= 0, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.warn('Could not update stock in Firestore:', err);
    }
  };

  // Master Login
  const loginMaster = (user: string, pass: string): boolean => {
    const targetUser = (settings.adminUser || 'Admin').trim().toLowerCase();
    const targetPass = (settings.adminPass || '1234').trim();

    if (user.trim().toLowerCase() === targetUser && pass.trim() === targetPass) {
      setIsMasterAuth(true);
      sessionStorage.setItem('vovo_master_auth', 'true');
      return true;
    }
    return false;
  };

  // Master Logout
  const logoutMaster = () => {
    setIsMasterAuth(false);
    sessionStorage.removeItem('vovo_master_auth');
  };

  // Update Master Credentials
  const updateMasterCredentials = async (newUser: string, newPass: string): Promise<boolean> => {
    if (!newUser.trim() || !newPass.trim()) return false;
    await updateSettings({ adminUser: newUser.trim(), adminPass: newPass.trim() });
    return true;
  };

  // All catalog products that are not permanently deleted (with explicit isActive flag)
  const allProducts: Product[] = productsList
    .filter(p =>
      !deletedProductIds.includes(p.id) &&
      p.categoryId !== 'bebidas' &&
      p.categoryId !== CategoryId.BEBIDAS
    )
    .map(p => ({
      ...p,
      isActive: p.isActive !== false,
    }));

  return (
    <CompanyContext.Provider
      value={{
        settings,
        updateSettings,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        allProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductActiveStatus,
        toggleProductStockStatus,
        updateProductStockQuantity,
        orders,
        createOrder,
        updateOrderStatus,
        deleteOrder,
        createDirectSale,
        cashMovements,
        addCashMovement,
        isMasterAuth,
        loginMaster,
        logoutMaster,
        updateMasterCredentials,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
