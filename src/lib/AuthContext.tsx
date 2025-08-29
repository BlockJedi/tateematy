import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, userAPI } from './api';

interface User {
  _id: string;
  walletAddress: string;
  fullName: string;
  userType: 'parent' | 'healthcare_provider' | 'admin';
  nationalId: string;
  mobile: string;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  profileComplete?: boolean;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    mobile?: string;
    email?: string;
  };
  healthcareProvider?: {
    licenseNumber?: string;
    specialization?: string;
    hospital?: {
      name?: string;
      address?: string;
      city?: string;
    };
    isVerified?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  login: (walletAddress: string, signature: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check if user is already authenticated on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        console.log('🔍 Checking auth status, token exists:', !!token);
        
        if (token) {
          // Simplified authentication check - just get user profile directly
          console.log('🔍 Verifying token with user profile...');
          
          try {
            const response = await userAPI.getProfile();
            console.log('🔍 Profile API Response:', response);
            
            if (response.success) {
              if (response.data && response.data.user) {
                // Ensure userType is set
                const userData = response.data.user;
                if (!userData.userType) {
                  userData.userType = 'parent'; // Default to parent
                }
                console.log('✅ Token verified successfully, user:', userData.fullName);
                setUser(userData);
              } else if (response.data && response.data.fullName) {
                // Direct user data structure
                const userData = response.data;
                if (!userData.userType) {
                  userData.userType = 'parent'; // Default to parent
                }
                console.log('✅ Token verified successfully, user:', userData.fullName);
                setUser(userData);
              } else {
                console.log('❌ Unexpected response structure:', response);
                // Token is invalid, clear it silently during initialization
                localStorage.removeItem('authToken');
                localStorage.removeItem('walletAddress');
              }
            } else {
              console.log('❌ Profile API failed:', response.message);
              // Token is invalid, clear it silently during initialization
              localStorage.removeItem('authToken');
              localStorage.removeItem('walletAddress');
            }
          } catch (apiError) {
            console.error('❌ API call failed:', apiError);
            // Clear invalid tokens silently during initialization
            localStorage.removeItem('authToken');
            localStorage.removeItem('walletAddress');
          }
        } else {
          console.log('🔍 No token found in localStorage');
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        // Clear invalid tokens silently during initialization
        localStorage.removeItem('authToken');
        localStorage.removeItem('walletAddress');
      } finally {
        setIsLoading(false);
        setIsInitializing(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (walletAddress: string, signature: string) => {
    try {
      setIsLoading(true);
      
      // First, try to connect wallet
      const connectResponse = await authAPI.connectWallet(walletAddress, signature, 'Connect wallet to Tateematy');
      
      if (connectResponse.success) {
        // Store wallet address
        localStorage.setItem('walletAddress', walletAddress);
        
        // If user exists, get their profile
        if (connectResponse.data.user) {
          // Ensure userType is set
          const userData = connectResponse.data.user;
          if (!userData.userType) {
            userData.userType = 'parent'; // Default to parent
          }
          setUser(userData);
          
          // Store auth token if provided
          if (connectResponse.data.token) {
            localStorage.setItem('authToken', connectResponse.data.token);
          }
        } else {
          // User doesn't exist, they need to register
          throw new Error('User not found. Please register first.');
        }
      } else {
        throw new Error(connectResponse.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('walletAddress');
  };

  const clearAllData = () => {
    setUser(null);
    localStorage.clear();
    sessionStorage.clear();
  };

  const updateUser = (userData: Partial<User>) => {
    console.log('🔍 updateUser called with:', userData);
    
    if (user) {
      // Ensure userType is preserved when updating
      const updatedUser = { ...user, ...userData };
      // If userType is not set, default to 'parent'
      if (!updatedUser.userType) {
        updatedUser.userType = 'parent';
        console.log('🔍 Setting default userType to parent');
      }
      console.log('🔍 Updating existing user:', updatedUser);
      setUser(updatedUser);
    } else if (userData) {
      // If no existing user, set the new user data directly
      // Ensure userType is set
      const newUser = { ...userData } as User;
      if (!newUser.userType) {
        newUser.userType = 'parent';
        console.log('🔍 Setting default userType to parent for new user');
      }
      console.log('🔍 Setting new user:', newUser);
      setUser(newUser);
    }
    
    // Ensure the update is persisted
    console.log('🔍 User state updated, new user:', userData);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isInitializing,
    login,
    logout,
    updateUser,
  };

  // Debug logging
  useEffect(() => {
    if (user) {
      console.log('🔍 AuthContext - User updated:', {
        id: user._id,
        fullName: user.fullName,
        userType: user.userType,
        profileComplete: user.profileComplete
      });
    } else {
      console.log('🔍 AuthContext - User cleared');
    }
  }, [user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
