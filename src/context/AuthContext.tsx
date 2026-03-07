import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  userId: number | null;
  setUserId: (id: number | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<number | null>(() => {
    const stored = localStorage.getItem('dataor_user_id');
    return stored ? parseInt(stored, 10) : null;
  });

  const handleSetUserId = (id: number | null) => {
    setUserId(id);
    if (id !== null) {
      localStorage.setItem('dataor_user_id', id.toString());
    } else {
      localStorage.removeItem('dataor_user_id');
    }
  };

  return (
    <AuthContext.Provider value={{ userId, setUserId: handleSetUserId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
