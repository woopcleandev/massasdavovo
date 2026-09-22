import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection, 
  getDocs, 
  deleteDoc,
  getDocFromServer,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, SavedAddress } from '../types';
import { normalizePhoneNumber } from '../utils/phone';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  savedAddresses: SavedAddress[];
  loading: boolean;
  registerWithWhatsapp: (name: string, whatsapp: string, pin: string) => Promise<void>;
  loginWithWhatsapp: (whatsapp: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (name: string, whatsapp: string) => Promise<void>;
  addSavedAddress: (address: Omit<SavedAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteSavedAddress: (addressId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);

  // Validate connection on boot as mandated by the Firebase Integration Skill
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Listen to Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user profile
        const userRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // Document doesn't exist yet: initialize with fallback values
            const phone = user.email ? user.email.split('@')[0] : '';
            const nowString = new Date().toISOString();
            const initialProfile: UserProfile = {
              id: user.uid,
              name: user.displayName || 'Cliente',
              whatsapp: phone,
              email: user.email || '',
              createdAt: nowString,
              updatedAt: nowString
            };
            try {
              await setDoc(userRef, {
                ...initialProfile,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              setUserProfile(initialProfile);
            } catch (err) {
              console.warn("Could not auto-create profile doc:", err);
              setUserProfile(initialProfile);
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }

        // Setup Real-time Listener for Saved Addresses
        const addressesPath = `users/${user.uid}/addresses`;
        const addressesQuery = query(collection(db, addressesPath), orderBy('createdAt', 'desc'));
        
        const unsubscribeAddresses = onSnapshot(
          addressesQuery,
          (snapshot) => {
            const list: SavedAddress[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              list.push({
                id: doc.id,
                userId: data.userId,
                street: data.street,
                number: data.number,
                complement: data.complement || '',
                neighborhood: data.neighborhood,
                label: data.label,
                createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : '',
                updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : '',
              });
            });
            setSavedAddresses(list);
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, addressesPath);
          }
        );

        return () => {
          unsubscribeAddresses();
        };
      } else {
        setUserProfile(null);
        setSavedAddresses([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper to format WhatsApp to dummy email for Firebase Auth
  const formatWhatsappToEmail = (whatsapp: string): string => {
    const cleanNumber = normalizePhoneNumber(whatsapp);
    return `${cleanNumber}@massasdavovo.com`;
  };

  // Helper to format 4-digit PIN to unique password
  const formatPinToPassword = (pin: string, whatsapp: string): string => {
    const cleanNumber = normalizePhoneNumber(whatsapp);
    return `vovo-pin-${pin}-${cleanNumber}`;
  };

  // Register with WhatsApp/PIN + Save Profile to Firestore
  const registerWithWhatsapp = async (name: string, whatsapp: string, pin: string) => {
    setLoading(true);
    const usersPath = 'users';
    try {
      const cleanNumber = normalizePhoneNumber(whatsapp);
      if (cleanNumber.length < 10) {
        throw new Error('Por favor, informe o WhatsApp com DDD (mínimo 10 dígitos).');
      }
      const email = formatWhatsappToEmail(whatsapp);
      const password = formatPinToPassword(pin, whatsapp);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const nowString = new Date().toISOString();
      const profileData: UserProfile = {
        id: uid,
        name: name.trim(),
        whatsapp,
        email,
        createdAt: nowString,
        updatedAt: nowString
      };

      // Set user profile in Firestore
      const userDocRef = doc(db, usersPath, uid);
      await setDoc(userDocRef, {
        ...profileData,
        whatsappClean: cleanNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setUserProfile(profileData);
    } catch (error: any) {
      if (error?.code === 'auth/email-already-in-use') {
        throw new Error('Este número de WhatsApp já possui uma conta cadastrada! Entre na aba de Login com seu PIN de 4 dígitos.');
      }
      if (error?.code === 'auth/weak-password') {
        throw new Error('PIN inválido. Digite um PIN de 4 dígitos.');
      }
      handleFirestoreError(error, OperationType.CREATE, usersPath);
    } finally {
      setLoading(false);
    }
  };

  // Login with WhatsApp/PIN
  const loginWithWhatsapp = async (whatsapp: string, pin: string) => {
    setLoading(true);
    try {
      const cleanNumber = normalizePhoneNumber(whatsapp);
      if (cleanNumber.length < 10) {
        throw new Error('Informe seu WhatsApp com DDD completo.');
      }
      const email = formatWhatsappToEmail(whatsapp);
      const password = formatPinToPassword(pin, whatsapp);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        throw new Error('WhatsApp ou PIN incorreto. Verifique os dados ou crie sua conta na aba Cadastrar.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUserProfile(null);
      setSavedAddresses([]);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update existing profile
  const updateUserProfile = async (name: string, whatsapp: string) => {
    if (!currentUser) throw new Error("User must be logged in to update profile.");
    const usersPath = `users/${currentUser.uid}`;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const nowString = new Date().toISOString();
      const email = currentUser.email || `${whatsapp.replace(/\D/g, '')}@massasdavovo.com`;

      const cleanNumber = normalizePhoneNumber(whatsapp);
      if (!userDocSnap.exists()) {
        const newProfile: UserProfile = {
          id: currentUser.uid,
          name,
          whatsapp,
          email,
          createdAt: nowString,
          updatedAt: nowString
        };
        await setDoc(userDocRef, {
          ...newProfile,
          whatsappClean: cleanNumber,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setUserProfile(newProfile);
      } else {
        await updateDoc(userDocRef, {
          name,
          whatsapp,
          whatsappClean: cleanNumber,
          updatedAt: serverTimestamp()
        });
        setUserProfile({
          ...(userDocSnap.data() as UserProfile),
          name,
          whatsapp,
          updatedAt: nowString
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, usersPath);
    }
  };

  // Add saved address
  const addSavedAddress = async (address: Omit<SavedAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) throw new Error("User must be logged in to save address.");
    const addressesPath = `users/${currentUser.uid}/addresses`;
    try {
      // Create random unique string ID for firestore
      const newAddrRef = doc(collection(db, addressesPath));
      await setDoc(newAddrRef, {
        ...address,
        userId: currentUser.uid,
        id: newAddrRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, addressesPath);
    }
  };

  // Delete saved address
  const deleteSavedAddress = async (addressId: string) => {
    if (!currentUser) throw new Error("User must be logged in to delete address.");
    const addressPath = `users/${currentUser.uid}/addresses/${addressId}`;
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/addresses`, addressId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, addressPath);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      savedAddresses,
      loading,
      registerWithWhatsapp,
      loginWithWhatsapp,
      logout,
      updateUserProfile,
      addSavedAddress,
      deleteSavedAddress
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
