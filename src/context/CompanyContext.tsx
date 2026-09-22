import React, { createContext, useContext, useState, useEffect } from 'react';
import { CompanySettings, Order, OrderStatus, Product, CartItem } from '../types';
import { RESTAURANT_INFO, PRODUCTS } from '../data';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface CompanyContextType {
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>) => Promise<void>;
  
  // Menu Products
  allProducts: Product[];
  addProduct: (newProd: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (id: string, updated: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Orders
  orders: Order[];
  createOrder: (orderInput: Omit<Order, 'id' | 'orderNumber' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;

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
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

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

  // Fetch Menu Items from Firestore
  useEffect(() => {
    try {
      const menuRef = collection(db, 'menu_items');
      getDocs(menuRef)
        .then((snapshot) => {
          if (snapshot.empty) return;
          const remoteMap = new Map<string, Product>();
          const remoteDeleted: string[] = [];

          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.isActive === false) {
              remoteDeleted.push(docSnap.id);
            } else if (data.name) {
              const baseProd = PRODUCTS.find(p => p.id === docSnap.id);
              remoteMap.set(docSnap.id, {
                id: docSnap.id,
                name: data.name,
                categoryId: data.categoryId || baseProd?.categoryId || 'lasanhas' as any,
                description: data.description !== undefined ? data.description : (baseProd?.description || ''),
                price: Number(data.price) || baseProd?.price || 0,
                image: data.image || baseProd?.image || '',
                isPopular: Boolean(data.isPopular),
                customizable: data.customizable || baseProd?.customizable,
                sizes: data.sizes || baseProd?.sizes,
              });
            }
          });

          if (remoteDeleted.length > 0) {
            setDeletedProductIds(prev => {
              const merged = Array.from(new Set([...prev, ...remoteDeleted]));
              localStorage.setItem('vovo_deleted_products', JSON.stringify(merged));
              return merged;
            });
          }

          if (remoteMap.size > 0) {
            setProductsList(prev => {
              const map = new Map<string, Product>();
              // Initialize with base list
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
              localStorage.setItem('vovo_menu_items', JSON.stringify(combined));
              return combined;
            });
          }
        })
        .catch(err => {
          console.warn('Error fetching menu_items from Firestore:', err);
        });
    } catch (e) {
      console.warn(e);
    }
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
          list.push({
            id: docSnap.id,
            orderNumber: d.orderNumber || docSnap.id,
            customerName: d.customerName || '',
            customerPhone: d.customerPhone || '',
            deliveryType: d.deliveryType || 'delivery',
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
    const product: Product = { ...newProd, id };

    setProductsList(prev => {
      const updated = [product, ...prev];
      localStorage.setItem('vovo_menu_items', JSON.stringify(updated));
      return updated;
    });

    try {
      const prodRef = doc(db, 'menu_items', id);
      await setDoc(prodRef, {
        ...product,
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
    let fullProduct: Product | undefined;

    setProductsList(prev => {
      const index = prev.findIndex(p => p.id === id);
      let updated: Product[];
      if (index >= 0) {
        fullProduct = { ...prev[index], ...updatedFields };
        updated = [...prev];
        updated[index] = fullProduct;
      } else {
        const base = PRODUCTS.find(p => p.id === id);
        fullProduct = {
          id,
          name: updatedFields.name || base?.name || 'Item',
          categoryId: updatedFields.categoryId || base?.categoryId || 'lasanhas' as any,
          description: updatedFields.description ?? (base?.description || ''),
          price: updatedFields.price ?? (base?.price || 0),
          image: updatedFields.image || base?.image || '',
          isPopular: updatedFields.isPopular ?? (base?.isPopular || false),
          customizable: base?.customizable,
          sizes: base?.sizes,
          ...updatedFields,
        };
        updated = [fullProduct, ...prev];
      }
      localStorage.setItem('vovo_menu_items', JSON.stringify(updated));
      return updated;
    });

    // Remove from deleted list if it was there
    setDeletedProductIds(prev => {
      if (prev.includes(id)) {
        const updated = prev.filter(item => item !== id);
        localStorage.setItem('vovo_deleted_products', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });

    try {
      const prodRef = doc(db, 'menu_items', id);
      const dataToSave = fullProduct ? { ...fullProduct } : { ...updatedFields, id };
      // Clean undefined fields to avoid Firestore errors
      Object.keys(dataToSave).forEach(key => {
        if ((dataToSave as any)[key] === undefined) {
          delete (dataToSave as any)[key];
        }
      });
      await setDoc(prodRef, {
        ...dataToSave,
        id,
        isActive: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('Could not update product in Firestore, local update preserved:', err);
    }
  };

  // Delete Product
  const deleteProduct = async (id: string) => {
    setDeletedProductIds(prev => {
      const updated = Array.from(new Set([...prev, id]));
      localStorage.setItem('vovo_deleted_products', JSON.stringify(updated));
      return updated;
    });

    setProductsList(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem('vovo_menu_items', JSON.stringify(updated));
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

    const newOrder: Order = {
      ...orderInput,
      id,
      orderNumber,
      status: 'novo',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Save locally immediately
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem('vovo_orders_history', JSON.stringify(updatedOrders));

    // Save to Firestore
    try {
      const orderRef = doc(db, 'orders', id);
      await setDoc(orderRef, {
        ...newOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Could not save order to Firestore, order is safe in local storage:', err);
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
        orders,
        createOrder,
        updateOrderStatus,
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
