import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Role = 'Admin' | 'User' | 'Viewer';

interface AuthContextType {
  user: any;
  role: Role;
  setRole: (role: Role) => void;
  isAdmin: boolean;
  isUser: boolean;
  isViewer: boolean;
  canEdit: boolean;
  canDelete: boolean;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('Admin'); 
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('itam_auth') === 'true';
  });
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('itam_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (identifier: string, password: string): Promise<boolean> => {
    if (identifier === 'Ali' && password === 'Etikette@67') {
      const userData = { email: 'ali.emmaus67@gmail.com', displayName: 'Ali A.' };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('itam_auth', 'true');
      localStorage.setItem('itam_user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('itam_auth');
    localStorage.removeItem('itam_user');
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
      loading: false,
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
