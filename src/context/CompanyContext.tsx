import React, { createContext, useContext, useState, useEffect } from 'react';
import { CompanySettings, Order, OrderStatus, Product, CartItem, OrderItem, PaymentMethod, CashMovement } from '../types';
import { RESTAURANT_INFO, PRODUCTS } from '../data';
import { db, auth, sanitizeFirestoreData } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { normalizePhoneNumber } from '../utils/phone';

interface CompanyContextType {
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>) => Promise<void>;
  
  // Menu Products
  allProducts: Product[];
  addProduct: (newProd: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (id: string, updated: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductStockStatus: (productId: string, isOutOfStock: boolean) => Promise<void>;
  updateProductStockQuantity: (productId: string, newStock: number) => Promise<void>;

  // Orders
  orders: Order[];
  createOrder: (orderInput: Omit<Order, 'id' | 'orderNumber' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;

  // POS / Direct Sales (Balcão)
  createDirectSale: (saleInput: {
    customerName?: string;
    customerPhone?: string;
    deliveryType: 'takeaway' | 'dine_in';
    tableNumber?: string;
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

  // 5. Master Auth state
  const [isMasterAuth, setIsMasterAuth] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('vovo_master_auth') === 'true';
    } catch {
      return false;
    }
  });

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
          if (data.isActive === false) {
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
        const list: Order[] = [];
        snapshot.forEach(docSnap => {
          const d = docSnap.data();
          const phone = d.customerPhone || '';
          list.push({
            id: docSnap.id,
            orderNumber: d.orderNumber || docSnap.id,
            customerName: d.customerName || '',
            customerPhone: phone,
            customerPhoneClean: d.customerPhoneClean || normalizePhoneNumber(phone),
            customerId: d.customerId || undefined,
            deliveryType: d.deliveryType || 'delivery',
            tableNumber: d.tableNumber || undefined,
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
            createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (d.createdAt || new Date().toISOString()),
            updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : (d.updatedAt || new Date().toISOString()),
          });
        });
        if (list.length > 0) {
          setOrders(list);
          localStorage.setItem('vovo_orders_history', JSON.stringify(list));
        }
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
        isActive: true,
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
      await setDoc(prodRef, { isActive: false, deletedAt: serverTimestamp() }, { merge: true });
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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

  // Delete Order
  const deleteOrder = async (orderId: string) => {
    const updatedOrders = orders.filter(o => o.id !== orderId);
    setOrders(updatedOrders);
    localStorage.setItem('vovo_orders_history', JSON.stringify(updatedOrders));

    try {
      const orderRef = doc(db, 'orders', orderId);
      await deleteDoc(orderRef);
    } catch (err) {
      console.warn('Could not delete order from Firestore:', err);
    }
  };

  // Direct POS / Balcão Sale
  const createDirectSale = async (saleInput: {
    customerName?: string;
    customerPhone?: string;
    deliveryType: 'takeaway' | 'dine_in';
    tableNumber?: string;
    paymentMethod: PaymentMethod;
    changeFor?: string;
    items: OrderItem[];
    itemsSubtotal: number;
    grandTotal: number;
    notes?: string;
    status?: OrderStatus;
  }): Promise<Order> => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderNumber = `#BALCAO-${randomSuffix}`;
    const id = `pos-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const cleanPhone = saleInput.customerPhone ? normalizePhoneNumber(saleInput.customerPhone) : '';

    const newOrder: Order = {
      id,
      orderNumber,
      customerName: saleInput.customerName?.trim() || 'Cliente Balcão',
      customerPhone: saleInput.customerPhone || '',
      customerPhoneClean: cleanPhone,
      deliveryType: saleInput.deliveryType,
      tableNumber: saleInput.tableNumber,
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(orderRef, cleanedData);
    } catch (err) {
      console.warn('Could not save POS order to Firestore, local state preserved:', err);
    }

    return newOrder;
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

  // Active products: all in productsList that are not in deletedProductIds
  const allProducts: Product[] = productsList.filter(p => !deletedProductIds.includes(p.id));

  return (
    <CompanyContext.Provider
      value={{
        settings,
        updateSettings,
        allProducts,
        addProduct,
        updateProduct,
        deleteProduct,
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
