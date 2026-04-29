import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Role = 'Admin' | 'User' | 'Viewer';

interface AuthContextType {
  role: Role;
  setRole: (role: Role) => void;
  isAdmin: boolean;
  isUser: boolean;
  isViewer: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('Admin'); // Default to Admin for development

  const isAdmin = role === 'Admin';
  const isUser = role === 'User';
  const isViewer = role === 'Viewer';

  const canEdit = isAdmin || isUser;
  const canDelete = isAdmin;

  return (
    <AuthContext.Provider value={{ 
      role, 
      setRole, 
      isAdmin, 
      isUser, 
      isViewer, 
      canEdit, 
      canDelete 
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
