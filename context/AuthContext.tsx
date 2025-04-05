// src/context/AuthContext.tsx
'use client'; // This context will be used in client components

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebaseConfig'; // Import your initialized auth instance

// Define the shape of the context data
interface AuthContextType {
  user: User | null;       // The Firebase User object or null if not logged in
  isLoading: boolean;      // True while checking auth status, false otherwise
}

// Create the context with a default value
// Using 'undefined' initially helps differentiate from 'null' user state if needed,
// but we'll handle loading explicitly with isLoading.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode; // Allows this component to wrap other components
}

// Create the AuthProvider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading until auth state is determined

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // This callback runs whenever the auth state changes
      // (including initial load)
      setUser(currentUser); // Set the user state (will be null if logged out)
      setIsLoading(false);  // Auth state determined, no longer loading
    });

    // Cleanup function: Unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // Provide the user and loading state to child components
  const value = { user, isLoading };

  return (
    <AuthContext.Provider value={value}>
      {/* Don't render children until loading is complete to avoid flash of wrong content */}
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

// Create a custom hook for easy access to the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}