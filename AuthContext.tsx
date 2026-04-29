import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, LoginCredentials, hasPermission } from '@/types/auth';
import axios from 'axios';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithMicrosoft: () => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  updateRole: (userId: string, role: UserRole) => Promise<boolean>;
  updateUser: (fields: Partial<User>) => void;
  checkPermission: (permission: string) => boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('clv_token');
      if (token) {
        try {
          const response = await axios.get(`${BACKEND_URL}/users/me`, {
            params: { token }
          });
          const fetchedUser = response.data;
          setUser({
            ...fetchedUser,
            createdAt: new Date(),
            lastLogin: new Date()
          });
        } catch (err) {
          localStorage.removeItem('clv_token');
        }
      }
      setIsLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Get the token
      const response = await axios.post(`${BACKEND_URL}/users/login`, {
        email: credentials.email,
        password: credentials.password
      });

      const token = response.data.access_token;
      localStorage.setItem('clv_token', token);

      // 2. Fetch the user details using the token
      const userResponse = await axios.get(`${BACKEND_URL}/users/me`, {
        params: { token }
      });

      setUser({
        ...userResponse.data,
        createdAt: new Date(),
        lastLogin: new Date()
      });
      setIsLoading(false);
      return true;

    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to connect to the server.");
      }
      setIsLoading(false);
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    setError('Google sign-in is not configured yet. Please use email & password.');
    return false;
  };

  const loginWithMicrosoft = async (): Promise<boolean> => {
    setError('Microsoft sign-in is not configured yet. Please use email & password.');
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('clv_token');
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await axios.post(`${BACKEND_URL}/users/register`, {
        name,
        email,
        password
      });

      // For email verification flow, we don't automatically log them in
      setIsLoading(false);
      return true;

    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to register. Please try again.");
      }
      setIsLoading(false);
      return false;
    }
  };

  const updateRole = async (_userId: string, _role: UserRole): Promise<boolean> => {
    if (!user || user.role !== 'admin') {
      setError('Only admins can update user roles');
      return false;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  };

  const updateUser = (fields: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...fields } : prev);
  };

  const checkPermission = (permission: string): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      error,
      login,
      loginWithGoogle,
      loginWithMicrosoft,
      logout,
      register,
      updateRole,
      updateUser,
      checkPermission,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
