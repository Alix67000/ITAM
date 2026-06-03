import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';

export type Role = 'Admin' | 'User' | 'Viewer';

interface AuthContextType {
  user: FirebaseUser | null;
  role: Role;
  setRole: (role: Role) => void;
  isAdmin: boolean;
  isUser: boolean;
  isViewer: boolean;
  canEdit: boolean;
  canDelete: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; errorCode?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('Admin'); // TODO P1.C : récupérer le rôle depuis /users/{uid}
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

  const isAdmin = role === 'Admin';
  const isUser = role === 'User';
  const isViewer = role === 'Viewer';
  const canEdit = isAdmin || isUser;
  const canDelete = isAdmin;

  return (
    <AuthContext.Provider value={{ 
      user,
      role, 
      setRole, 
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
