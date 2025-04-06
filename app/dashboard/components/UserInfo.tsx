"use client";

import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase/firebaseConfig";
import { signOut } from "firebase/auth";

export default function UserInfo() {
    // Use the hook to get the current auth state
    const { user, isLoading } = useAuth();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            // User state will automatically update via AuthContext
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    // 1. Handle the loading state
    if (isLoading) {
        return <div>Checking authentication status...</div>;
    }

    // 2. Handle the authenticated state
    if (user) {
        return (
            <div>
                <h2>Current User Information</h2>
                <p>
                    <strong>UID:</strong> {user.uid}
                </p>
                <p>
                    <strong>Email:</strong> {user.email || "No email available"}
                </p>
                <p>
                    <strong>Display Name:</strong>{" "}
                    {user.displayName || "No display name set"}
                </p>
                <p>
                    <strong>Email Verified:</strong>{" "}
                    {user.emailVerified ? "Yes" : "No"}
                </p>
                {/* You can access other properties like user.photoURL, user.metadata, etc. */}

                {/* Example: Use user.uid to fetch user-specific data from Firestore */}
                {/* const userDocRef = doc(firestore, 'users', user.uid); */}
                {/* ... fetch and display data ... */}

                <button onClick={handleSignOut}>Sign Out</button>
            </div>
        );
    }

    // 3. Handle the unauthenticated state
    return (
        <div>
            <p>You are not currently signed in.</p>
            {/* Add your Sign In button/component here */}
            {/* e.g., <SignInButton /> */}
        </div>
    );
}
