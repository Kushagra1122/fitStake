import React, { createContext, useState, useContext } from 'react';
import { Alert } from 'react-native';

const VincentContext = createContext();

export const useVincent = () => {
  const context = useContext(VincentContext);
  if (!context) {
    throw new Error('useVincent must be used within VincentProvider');
  }
  return context;
};

export const VincentProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [jwt, setJwt] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const logout = () => {
    setJwt(null);
    setUserInfo(null);
    setIsAuthenticated(false);
  };

  const login = async (newJwt, newUserInfo) => {
    setJwt(newJwt);
    setUserInfo(newUserInfo);
    setIsAuthenticated(true);
  };

  const value = {
    isAuthenticated,
    jwt,
    userInfo,
    login,
    logout,
  };

  return (
    <VincentContext.Provider value={value}>
      {children}
    </VincentContext.Provider>
  );
};

