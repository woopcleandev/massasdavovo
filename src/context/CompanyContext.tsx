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

  // 2. Custom Products state
  const [customProducts, setCustomProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('vovo_custom_products');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // 3. Orders state
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('vovo_orders_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // 4. Master Auth state
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

  // Fetch Custom Menu Items from Firestore
  useEffect(() => {
    try {
      const menuRef = collection(db, 'menu_items');
      getDocs(menuRef)
        .then((snapshot) => {
          const loaded: Product[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            loaded.push({
              id: docSnap.id,
              name: data.name || '',
              categoryId: data.categoryId,
              description: data.description || '',
              price: Number(data.price) || 0,
              image: data.image || '',
              isPopular: Boolean(data.isPopular),
              customizable: data.customizable,
              sizes: data.sizes,
            });
          });
          if (loaded.length > 0) {
            setCustomProducts(loaded);
            localStorage.setItem('vovo_custom_products', JSON.stringify(loaded));
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

    const updated = [product, ...customProducts];
    setCustomProducts(updated);
    localStorage.setItem('vovo_custom_products', JSON.stringify(updated));

    try {
      const prodRef = doc(db, 'menu_items', id);
      await setDoc(prodRef, {
        ...product,
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
    const updated = customProducts.map(p => p.id === id ? { ...p, ...updatedFields } : p);
    setCustomProducts(updated);
    localStorage.setItem('vovo_custom_products', JSON.stringify(updated));

    try {
      const prodRef = doc(db, 'menu_items', id);
      await updateDoc(prodRef, {
        ...updatedFields,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Could not update product in Firestore:', err);
    }
  };

  // Delete Product
  const deleteProduct = async (id: string) => {
    const updated = customProducts.filter(p => p.id !== id);
    setCustomProducts(updated);
    localStorage.setItem('vovo_custom_products', JSON.stringify(updated));

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

  // Merge default products with custom products
  // If custom product has same id, it overrides; otherwise custom products are prepended
  const allProducts: Product[] = [
    ...customProducts,
    ...PRODUCTS.filter(p => !customProducts.some(cp => cp.id === p.id))
  ];

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
