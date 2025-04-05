"use client"; // Required for components with interactivity

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/firebaseConfig"; // Import your Firebase auth instance
import { signInWithEmailAndPassword } from "firebase/auth";

// Define an interface for Firebase auth errors
interface FirebaseError {
    code: string;
    message: string;
}

export default function SignInPage() {
    // State variables
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter(); // Hook for routing

    // Function to handle form submission for sign-in
    const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!email || !password) {
            setError("Please enter both email and password.");
            setIsLoading(false);
            return;
        }

        try {
            // Use the Firebase Auth function to sign in a user
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            // User signed in successfully!
            console.log("User signed in successfully:", userCredential.user);
            alert("Sign in successful! Redirecting..."); // Simple feedback

            // Redirect to the homepage or dashboard
            router.push("/dashboard"); // Redirect to dashboard
        } catch (err: unknown) {
            // Catch errors from Firebase
            console.error("Error signing in:", err);

            // Type guard to ensure we have a Firebase error
            const firebaseErr = err as FirebaseError;

            if (
                firebaseErr.code === "auth/invalid-credential" ||
                firebaseErr.code === "auth/user-not-found" ||
                firebaseErr.code === "auth/wrong-password"
            ) {
                setError("Invalid email or password. Please try again.");
            } else {
                setError(
                    `Failed to sign in. ${
                        firebaseErr.message || "Please try again."
                    }`
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 to-blue-500 p-6">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-8">
                    <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent mb-6">
                        Sign In to Pull𝕚n
                    </h1>

                    <form onSubmit={handleSignIn} className="space-y-5">
                        {/* Email Input */}
                        <div>
                            <label
                                htmlFor="email-input"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                School Email
                            </label>
                            <input
                                type="email"
                                id="email-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                                placeholder="your_email@school.edu"
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label
                                htmlFor="password-input"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                id="password-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                                placeholder="Enter your password"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-8 py-3.5 mt-2 bg-gradient-to-r from-teal-400 to-blue-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                "Sign In"
                            )}
                        </button>

                        {/* Link to Sign Up */}
                        <p className="text-center mt-6 text-gray-600">
                            Don&apos;t have an account?{" "}
                            <a
                                href="/signup"
                                className="text-teal-600 hover:text-blue-600 font-medium"
                            >
                                Sign Up
                            </a>
                        </p>
                    </form>
                </div>
            </div>
        </main>
    );
}
