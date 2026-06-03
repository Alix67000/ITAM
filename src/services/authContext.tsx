import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';

/** @deprecated Plus de système de rôles. Tout utilisateur connecté
 *  est administrateur. */
export type Role = 'Admin';

interface AuthContextType {
  user: FirebaseUser | null;
  /** @deprecated Tout utilisateur connecté est admin. */
  isAdmin: boolean;
  /** @deprecated Tout utilisateur connecté est admin. (gardé pour compat) */
  isUser: boolean;
  /** @deprecated Plus de rôle Viewer. */
  isViewer: boolean;
  /** @deprecated Tout utilisateur connecté peut éditer. */
  canEdit: boolean;
  /** @deprecated Tout utilisateur connecté peut supprimer. */
  canDelete: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; errorCode?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isAuthenticated = user !== null;

  const login = async (email: string, password: string): Promise<{ success: boolean; errorCode?: string }> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (e: any) {
      return { success: false, errorCode: e.code };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Erreur lors de la déconnexion', e);
    }
  };

  const isAdmin = isAuthenticated;
  const isUser = isAuthenticated;
  const isViewer = false;
  const canEdit = isAuthenticated;
  const canDelete = isAuthenticated;

  return (
    <AuthContext.Provider value={{ 
      user,
      isAdmin, 
      isUser, 
      isViewer, 
      canEdit, 
      canDelete,
      loading,
      login,
      logout,
      isAuthenticated
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
