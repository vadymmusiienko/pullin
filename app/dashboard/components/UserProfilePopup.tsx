import React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { db } from "@/lib/firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

// Define the props for the UserProfilePopup component
interface UserProfilePopupProps {
    userId: string | null;
}

// Define the UserProfile interface
interface UserProfile {
    displayName: string;
    email?: string;
    bio?: string;
    instagram?: string;
    interests?: string[];
    profilePicture?: string;
    role?: string;
    status?: string;
}

const UserProfilePopup: React.FC<UserProfilePopupProps> = ({ userId }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    useEffect(() => {
        // If userId is provided, open the popup and fetch data
        if (userId) {
            setIsOpen(true);
            fetchUserProfile(userId);
        } else {
            // Reset state when no userId
            setIsOpen(false);
            setProfile(null);
            setError(null);
        }
    }, [userId]);

    const fetchUserProfile = async (id: string) => {
        setLoading(true);
        setError(null);

        try {
            const userDocRef = doc(db, "users", id);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                setProfile(userDocSnap.data() as UserProfile);
            } else {
                setError("User profile not found");
            }
        } catch (err) {
            console.error("Error fetching user profile:", err);
            setError("Failed to load user profile");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        // You might want to notify the parent component that the popup is closed
        // This could be done with a callback or context if needed
    };

    // If the popup is not open, don't render anything
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {loading ? (
                    <div className="p-8 flex flex-col items-center justify-center">
                        <svg
                            className="animate-spin h-10 w-10 text-teal-600"
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
                        <p className="mt-4 text-gray-600">Loading profile...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-8 w-8"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-red-600">
                            {error}
                        </h3>
                        <button
                            className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                            onClick={handleClose}
                        >
                            Close
                        </button>
                    </div>
                ) : profile ? (
                    <div>
                        {/* Header with profile picture */}
                        <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-6 rounded-t-xl relative">
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                            <div className="flex items-center">
                                {profile.profilePicture ? (
                                    <Image
                                        src={profile.profilePicture}
                                        alt={profile.displayName}
                                        className="w-20 h-20 rounded-full border-4 border-white object-cover"
                                        height={80} 
                                        width={80}
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-teal-500 text-2xl font-bold border-4 border-white">
                                        {profile.displayName
                                            ?.charAt(0)
                                            ?.toUpperCase() || "?"}
                                    </div>
                                )}
                                <div className="ml-4 text-white">
                                    <h2 className="text-xl font-bold">
                                        {profile.displayName}
                                    </h2>
                                    {profile.status && (
                                        <span className="inline-block px-2 py-1 bg-white bg-opacity-20 rounded-full text-sm mt-1">
                                            {profile.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Profile content */}
                        <div className="p-6">
                            {/* Bio section */}
                            {profile.bio && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        About
                                    </h3>
                                    <p className="text-gray-700">
                                        {profile.bio}
                                    </p>
                                </div>
                            )}

                            {/* Contact information */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Contact
                                </h3>
                                <ul className="space-y-2">
                                    {profile.email && (
                                        <li className="flex items-center text-gray-700">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 text-gray-400 mr-2"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                                />
                                            </svg>
                                            {profile.email}
                                        </li>
                                    )}
                                    {profile.instagram && (
                                        <li className="flex items-center text-gray-700">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 text-pink-500 mr-2"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                            </svg>
                                            @{profile.instagram}
                                        </li>
                                    )}
                                </ul>
                            </div>

                            {/* Interests */}
                            {profile.interests &&
                                profile.interests.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                            Interests
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.interests.map(
                                                (interest, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm"
                                                    >
                                                        {interest}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Role info if available */}
                            {profile.role && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Role
                                    </h3>
                                    <p className="text-gray-700">
                                        {profile.role}
                                    </p>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <p className="text-gray-600">
                            No profile information available
                        </p>
                        <button
                            className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                            onClick={handleClose}
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfilePopup;
