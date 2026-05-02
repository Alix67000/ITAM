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
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('Admin'); // Default to Admin for development
  const user = { email: 'dev@local', displayName: 'Dev User' }; // Mock user

  const login = async () => {};
  const logout = async () => {};

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
      logout
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
