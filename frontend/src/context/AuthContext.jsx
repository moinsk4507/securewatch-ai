import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/authAPI';
import { tokenStorage } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = tokenStorage.get();
    if (token) {
      authAPI.me()
        .then((res) => setUser(res.data))
        .catch(() => tokenStorage.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, remember = false) => {
    const res = await authAPI.login(email, password);
    tokenStorage.set(res.data.token, remember);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
  };

  return (
    // setUser exposed so Signup can hydrate auth state after register()
    // without a second login round-trip.
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
