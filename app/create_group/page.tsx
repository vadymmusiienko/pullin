// src/app/create_group/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase/firebaseConfig';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';

export default function CreateGroupPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (authLoading) return;
    if (!user) {
      setError("You must be logged in to create a group.");
      return;
    }

    const numericCapacity = parseInt(capacity, 10);
    if (!groupName.trim()) {
      setError("Group name cannot be empty.");
      return;
    }
    if (isNaN(numericCapacity) || numericCapacity <= 0) {
      setError("Please enter a valid capacity (must be at least 1).");
      return;
    }

    setIsLoading(true);

    const newGroupData = {
      groupName: groupName.trim(),
      description: description.trim(),
      capacity: numericCapacity,
      creatorId: user.uid,
      members: [user.uid],
      createdAt: serverTimestamp(),
    };

    try {
      const groupsCollectionRef = collection(db, 'groups');
      const newDocRef = await addDoc(groupsCollectionRef, newGroupData);
      console.log("Group created (client-side) with ID: ", newDocRef.id);

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
          group_leader: true,
          is_grouped: true,
          updatedAt: serverTimestamp()
      });
      console.log("User document updated with group_leader: true");


      alert('Group created successfully! Redirecting to dashboard...'); // Updated alert slightly
      router.push('/dashboard'); // <--- CHANGE: Redirect to dashboard

    } catch (err: unknown) {
        console.error("Error creating group or updating user:", err);
        if (err instanceof Error) {
            setError(`Operation failed: ${err.message}. Check Firestore rules?`);
        } else {
            setError(`An unexpected error occurred. Please try again.`);
        }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-teal-400 to-blue-500">
          <p className="text-white text-xl">Loading...</p>
      </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 to-blue-500 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">
          <h1 className="text-center text-2xl sm:text-3xl font-bold text-gray-800 mb-8">
            Create a New Group
          </h1>

          <form onSubmit={handleCreateGroup} className="space-y-6">

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Group Details</h2>
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
                  min="1"
                  max="20"
                  step="1"
                  className="w-24 py-2 px-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition duration-150 ease-in-out sm:text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
            </div>

            <div className="pt-5">
                {error && <p className="text-red-600 text-sm mb-4 text-center font-medium">{error}</p>}

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