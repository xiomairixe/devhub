import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const ClientAuthContext = createContext(null);

export function ClientAuthProvider({ children }) {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('clientToken');
    if (token) {
      api.get('/auth/client-me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setClient(res.data))
        .catch(() => localStorage.removeItem('clientToken'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/client-login', { email, password });
    localStorage.setItem('clientToken', res.data.token);
    setClient(res.data.client);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('clientToken');
    setClient(null);
  };

  return (
    <ClientAuthContext.Provider value={{ client, loading, login, logout }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export const useClientAuth = () => useContext(ClientAuthContext);