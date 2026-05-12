import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/profile');
      localStorage.setItem('hireflow_user', JSON.stringify(data));
      setUser(data);
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('hireflow_user');
    const token = localStorage.getItem('hireflow_token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      // Optionally refresh profile to keep in sync
      fetchProfile();
    }
    setLoading(false);

    const handleAuthError = () => {
      setUser(null);
      localStorage.removeItem('hireflow_token');
      localStorage.removeItem('hireflow_user');
    };
    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  const login = async (email, password) => {
    // Stage 1: Request OTP
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  };

  const verifyLogin = async (email, otp) => {
    // Stage 2: Verify OTP and get token
    const { data } = await api.post('/auth/verify-login', { email, otp });
    localStorage.setItem('hireflow_token', data.access_token);
    localStorage.setItem('hireflow_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, company_name) => {
    const { data } = await api.post('/auth/register', { name, email, password, company_name });
    return data;
  };

  const verifySignup = async (email, otp) => {
    const { data } = await api.post('/auth/verify-signup', { email, otp });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('hireflow_token');
    localStorage.removeItem('hireflow_user');
    setUser(null);
  };

  const updateProfileState = (newData) => {
    const updated = { ...user, ...newData };
    localStorage.setItem('hireflow_user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      verifyLogin, 
      register, 
      verifySignup, 
      logout, 
      updateProfileState,
      loading,
      refreshProfile: fetchProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
