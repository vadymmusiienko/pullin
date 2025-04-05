// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase/firebaseConfig";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from 'next/link';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Effect hook to PERFORM the redirect if needed
  useEffect(() => {
    if (!isLoading) {
      if (user && !user.emailVerified) {
        router.push('/verify-email');
      }
      // No need for else here, the rendering logic below handles other cases
    }
  }, [user, isLoading, router]);

  const handleSignOut = async () => {
    // ... (sign out logic remains the same)
    try {
      await signOut(auth);
      console.log("User signed out successfully");
      router.push('/signin');
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out. Please try again.");
    }
  };

  // --- Render Logic ---

  // 1. Handle Loading State FIRST
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading...</p></div>;
  }

  // 2. Handle Unverified User State (Prevent Flash)
  // If user exists but is not verified, show nothing or minimal message while useEffect redirects
  if (user && !user.emailVerified) {
     // You could return null, or a generic loading/redirecting message
     return <div className="flex justify-center items-center min-h-screen"><p>Checking verification status...</p></div>;
     // The useEffect will handle the actual redirect shortly
  }

  // 3. Handle Verified User State
  if (user && user.emailVerified) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-4">Welcome to PullIn!</h1>
        <div>
          <p>Hello, {user.email}!</p>
          <p>Your User ID is: {user.uid}</p>
          <p className="text-green-600 font-medium">Email Verified!</p>
          <button onClick={handleSignOut} className="mt-4 rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-400">
            Sign Out
          </button>
        </div>
        <p className="mt-8 text-gray-500">This is the main content area.</p>
      </main>
    );
  }

  // 4. Handle Logged Out State (user is null)
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Welcome to PullIn!</h1>
      <div>
        <p>Please sign in or sign up to continue.</p>
        <div className="mt-4 space-x-4">
           <Link href="/signin" className="text-indigo-600 hover:text-indigo-800">
             Sign In
           </Link>
           <Link href="/signup" className="text-indigo-600 hover:text-indigo-800">
             Sign Up
           </Link>
        </div>
      </div>
      <p className="mt-8 text-gray-500">This is the main content area.</p>
    </main>
  );
}