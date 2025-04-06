// src/components/Navbar.tsx
'use client';

import React, { Fragment, useState, useEffect, useRef } from 'react'; // Import useRef
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Adjust path if needed
import { auth, db } from '@/lib/firebase/firebaseConfig'; // Adjust path if needed
import { signOut } from 'firebase/auth';
import { Menu, Transition } from '@headlessui/react';
import {
    collection,
    query,
    where,
    onSnapshot,
    Unsubscribe // Import Unsubscribe type
} from 'firebase/firestore';

// --- Icons and NotificationDot component ---
const UserCircleIcon = ({ className = "w-8 h-8 text-gray-500" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);
const NotificationDot = () => (
  <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
);
// --- End Icons ---

export default function Navbar() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [hasUnseenRequests, setHasUnseenRequests] = useState(false);

  // --- Use Refs to store listener state reliably ---
  const listenersRef = useRef<{ invite?: Unsubscribe; request?: Unsubscribe }>({});
  const unseenCountsRef = useRef<{ invites: number; requests: number }>({ invites: 0, requests: 0 });
  const listenersReadyRef = useRef<{ invites: boolean; requests: boolean }>({ invites: false, requests: false });
  // --- End Refs ---

  useEffect(() => {
    // --- Cleanup Function ---
    const cleanup = () => {
      console.log("Navbar: Cleaning up listeners.");
      listenersRef.current.invite?.(); // Unsubscribe if function exists
      listenersRef.current.request?.();
      listenersRef.current = {}; // Clear refs
      unseenCountsRef.current = { invites: 0, requests: 0 };
      listenersReadyRef.current = { invites: false, requests: false };
      setHasUnseenRequests(false); // Reset state
    };

    // If no user or loading, cleanup and exit
    if (!user || isLoading) {
      cleanup();
      return;
    }
    // --- End Cleanup & Initial Checks ---


    console.log(`Navbar: Setting up listeners for user ${user.uid}`);

    // Function to update state based on current counts in refs
    const checkAndUpdateState = () => {
      if (listenersReadyRef.current.invites && listenersReadyRef.current.requests) {
        const totalUnseen = unseenCountsRef.current.invites + unseenCountsRef.current.requests;
        setHasUnseenRequests(totalUnseen > 0);
        console.log(`Navbar: Unseen check. Invites: ${unseenCountsRef.current.invites}, Requests: ${unseenCountsRef.current.requests}, Total>0: ${totalUnseen > 0}`);
      } else {
         console.log("Navbar: Listeners not ready yet.", listenersReadyRef.current);
      }
    };

    // Listener 1: Incoming Invites
    const invitesQuery = query(
      collection(db, 'requests'),
      where('userid', '==', user.uid),
      where('fromGroup', '==', true),
      where('status', '==', 'pending'),
      where('hasSeen', '==', false)
    );
    listenersRef.current.invite = onSnapshot(invitesQuery, (snapshot) => {
      unseenCountsRef.current.invites = snapshot.size; // Update ref count
      listenersReadyRef.current.invites = true; // Mark ready
      console.log(`Navbar: Invite listener update - Count: ${snapshot.size}`);
      checkAndUpdateState();
    }, (error) => {
      console.error("Navbar: Error in invite listener:", error);
      unseenCountsRef.current.invites = 0; // Reset count on error
      listenersReadyRef.current.invites = true; // Mark ready even on error to allow state update
      checkAndUpdateState();
    });

    // Listener 2: Incoming Requests to User's Groups
    const requestsToGroupQuery = query(
      collection(db, 'requests'),
      where('GroupLeaderId', '==', user.uid),
      where('fromGroup', '==', false),
      where('status', '==', 'pending'),
      where('hasSeen', '==', false)
    );
    listenersRef.current.request = onSnapshot(requestsToGroupQuery, (snapshot) => {
      unseenCountsRef.current.requests = snapshot.size; // Update ref count
      listenersReadyRef.current.requests = true; // Mark ready
      console.log(`Navbar: Request listener update - Count: ${snapshot.size}`);
      checkAndUpdateState();
    }, (error) => {
      console.error("Navbar: Error in request listener:", error);
      unseenCountsRef.current.requests = 0; // Reset count on error
      listenersReadyRef.current.requests = true; // Mark ready even on error
      checkAndUpdateState();
    });

    // Return the cleanup function
    return cleanup;

  }, [user, isLoading]); // Dependencies


  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("User signed out successfully");
      router.push('/signin');
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out.");
    }
  };

  const pfpUrl = user?.photoURL;

  // --- JSX ---
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">

          {/* Left Section */}
          <div className="flex items-center">
            {/* Logo/Brand Link */}
            <div className="flex-shrink-0 flex items-center">
              <Link href={user ? "/dashboard" : "/"} className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent">
                Pull-In {/* Updated Name */}
              </Link>
            </div>
          </div>

          {/* Right Section */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {isLoading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : user ? (
              // --- Profile Dropdown ---
              <Menu as="div" className="relative ml-3">
                <div>
                  <Menu.Button className="relative flex rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Open user menu</span>
                    {pfpUrl ? (
                      <div className="relative">
                        <Image
                          className="h-8 w-8 rounded-full object-cover"
                          src={pfpUrl}
                          alt="User profile picture"
                          width={32}
                          height={32}
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-pfp.png'; }}
                        />
                        {hasUnseenRequests && <NotificationDot />}
                      </div>
                    ) : (
                      <div className="relative">
                        <UserCircleIcon className="h-8 w-8 text-gray-500" />
                        {hasUnseenRequests && <NotificationDot />}
                      </div>
                    )}
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {/* Requests Link */}
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/requests"
                          className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700 relative`}
                        >
                          Requests
                          {hasUnseenRequests && (
                            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-red-500" />
                          )}
                        </Link>
                      )}
                    </Menu.Item>
                    {/* Edit Profile Link */}
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/profile/edit"
                          className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700`}
                        >
                          Edit Profile
                        </Link>
                      )}
                    </Menu.Item>
                    {/* Sign Out Button */}
                    <Menu.Item>
                       {({ active }) => (
                         <button
                           onClick={handleSignOut}
                           className={`${active ? 'bg-gray-100' : ''} block w-full px-4 py-2 text-left text-sm text-red-600`}
                         >
                           Sign Out
                         </button>
                       )}
                     </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
              // --- End Profile Dropdown ---
            ) : (
              // Logged Out State (Desktop)
              <div className="hidden md:flex md:items-center md:space-x-4">
                 <Link href="/signin" className="text-gray-600 hover:text-teal-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out">
                   Sign In
                 </Link>
                 <Link href="/signup" className="bg-gradient-to-r from-teal-400 to-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition duration-150 ease-in-out">
                   Sign Up
                 </Link>
              </div>
            )}
          </div>
          {/* Mobile Menu (Removed for brevity) */}
        </div>
      </div>
    </nav>
  );
}