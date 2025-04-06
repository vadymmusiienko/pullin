// src/app/create_group/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Adjust path
import { firestore } from '@/lib/firebase/firebaseConfig'; // Adjust path
import {
  collection,
  addDoc,
  serverTimestamp,
  // Removed query, where, getDocs, limit, DocumentData as they are no longer needed here
} from 'firebase/firestore';

// Removed FoundUser interface

export default function CreateGroupPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // --- State for UI ---
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState(''); // String for input
  // Removed state variables for search and selection

  // --- State for Loading/Errors (Client-Side Submission) ---
  const [isLoading, setIsLoading] = useState(false); // For group creation
  const [error, setError] = useState<string | null>(null); // For group creation error

  // Removed handleSearchUser, handleAddUser, handleRemoveUser functions

  // --- Group Creation Handler (Simplified) ---
  const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission
    setError(null);

    // Auth Check
    if (authLoading) return;
    if (!user) {
      setError("You must be logged in to create a group.");
      return;
    }

    // Client-Side Validation
    const numericCapacity = parseInt(capacity, 10);
    if (!groupName.trim()) {
      setError("Group name cannot be empty.");
      return;
    }
    // Ensure capacity is at least 1 (for the creator)
    if (isNaN(numericCapacity) || numericCapacity <= 0) {
      setError("Please enter a valid capacity (must be at least 1).");
      return;
    }
    // Removed validation comparing selected members to capacity

    setIsLoading(true); // Start loading spinner on button

    // Prepare data - members array now ONLY contains the creator
    const newGroupData = {
      groupName: groupName.trim(),
      description: description.trim(),
      capacity: numericCapacity,
      creatorId: user.uid, // Use UID from client-side auth context
      members: [user.uid], // **MODIFIED: Only creator is added initially**
      createdAt: serverTimestamp(), // Use Firestore server timestamp
    };

    // Add document directly from the client
    try {
      const groupsCollectionRef = collection(firestore, 'groups');
      const newDocRef = await addDoc(groupsCollectionRef, newGroupData);
      console.log("Group created (client-side) with ID: ", newDocRef.id);

      alert('Group created successfully!');
      // Redirect to the new group's page (or dashboard)
      router.push(`/groups/${newDocRef.id}`);

    } catch (err: any) {
      console.error("Error creating group (client-side):", err);
      setError(`Failed to create group. ${err.message || 'Please try again.'}. Check Firestore rules?`);
    } finally {
      setIsLoading(false); // Stop loading spinner
    }
  };

  // --- Render ---
  if (authLoading) return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-teal-400 to-blue-500">
          <p className="text-white text-xl">Loading...</p>
      </div>
  );

  return (
    // Overall layout remains the same
    <div className="min-h-screen bg-gradient-to-br from-teal-400 to-blue-500 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">
          <h1 className="text-center text-2xl sm:text-3xl font-bold text-gray-800 mb-8">
            Create a New Group
          </h1>

          {/* Form still uses onSubmit */}
          <form onSubmit={handleCreateGroup} className="space-y-6">

            {/* --- Group Details Section (Inputs remain the same) --- */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Group Details</h2>
              {/* Group Name */}
              <div>
                <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="groupName"
                  name="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  maxLength={100}
                  className="w-full py-2 px-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition duration-150 ease-in-out sm:text-sm"
                />
              </div>
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full py-2 px-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition duration-150 ease-in-out sm:text-sm"
                />
              </div>
              {/* Capacity */}
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity (Max Members) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                  min="1" // Capacity must be at least 1 for the creator
                  max="20" // Example max
                  step="1"
                  className="w-24 py-2 px-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition duration-150 ease-in-out sm:text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                 {/* Add validation feedback for capacity if needed */}
              </div>
            </div>

            {/* --- REMOVED Add Members Section --- */}
            {/* The entire fieldset for searching/adding members is gone */}

            {/* --- Submission & General Feedback --- */}
            <div className="pt-5">
                 {/* Display general errors from client-side state */}
                {error && <p className="text-red-600 text-sm mb-4 text-center font-medium">{error}</p>}

                {/* Submit Button (remains the same) */}
                <button
                    type="submit"
                    disabled={isLoading || authLoading || !user}
                    className="w-full px-6 py-3 bg-gradient-to-r from-teal-400 to-blue-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400 disabled:opacity-50 transition duration-300 ease-in-out text-base"
                >
                    {isLoading ? 'Creating Group...' : 'Create Group'}
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}