// src/app/signin/page.tsx
'use client'; // Required for components with interactivity

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/firebaseConfig'; // Import your Firebase auth instance
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function SignInPage() {
  // State variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter(); // Hook for routing

  // Function to handle form submission for sign-in
  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    try {
      // Use the Firebase Auth function to sign in a user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // User signed in successfully!
      console.log('User signed in successfully:', userCredential.user);
      alert('Sign in successful! Redirecting...'); // Simple feedback

      // Redirect to the homepage or dashboard
      router.push('/'); // Redirect to homepage

    } catch (err: any) { // Catch errors from Firebase
      console.error("Error signing in:", err);
      // Provide more specific error messages based on Firebase error codes
      // Common codes: auth/invalid-credential, auth/user-not-found, auth/wrong-password
      // Note: Firebase might return 'auth/invalid-credential' for both user not found and wrong password
      // for security reasons (to avoid user enumeration).
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
         setError('Invalid email or password. Please try again.');
      } else {
        setError('Failed to sign in. Please try again.'); // Generic error
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h1>Sign In</h1>
      <form onSubmit={handleSignIn}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          style={{ padding: '10px 20px', cursor: isLoading ? 'not-allowed' : 'pointer' }}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      {/* Optional: Add a link to the Sign Up page */}
      <p style={{marginTop: '15px'}}>
        Don't have an account? <a href="/signup">Sign Up</a>
      </p>
    </div>
  );
}