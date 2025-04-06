'use client';

import React, { Fragment } from 'react'; 
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase/firebaseConfig';
import { signOut } from 'firebase/auth';
import { Menu, Transition } from '@headlessui/react';

const UserCircleIcon = ({ className = "w-8 h-8 text-gray-500" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);


export default function Navbar() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

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

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">

          {/* Left Section */}
          <div className="flex items-center">

            {/* Logo/Brand Link */}
            <div className="flex-shrink-0 flex items-center">
              <Link href={user ? "/dashboard" : "/"} className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent">
                Pull-In
              </Link>
            </div>
          </div>


          {/* Right Section */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {isLoading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : user ? (
              <Menu as="div" className="relative ml-3">
                <div>
                  <Menu.Button className="relative flex rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Open user menu</span>
                    {pfpUrl ? (
                       <Image
                         className="h-8 w-8 rounded-full object-cover"
                         src={pfpUrl}
                         alt="User profile picture"
                         width={32}
                         height={32}
                         onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-pfp.png'; }}
                       />
                    ) : (
                       <UserCircleIcon className="h-8 w-8 text-gray-500" />
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
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/requests" className={`${ active ? 'bg-gray-100' : '' } block px-4 py-2 text-sm text-gray-700`}>
                          Requests
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/profile/edit" className={`${ active ? 'bg-gray-100' : '' } block px-4 py-2 text-sm text-gray-700`}>
                          Edit Profile
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                       {({ active }) => (
                         <button onClick={handleSignOut} className={`${ active ? 'bg-gray-100' : '' } block w-full px-4 py-2 text-left text-sm text-red-600`} >
                           Sign Out
                         </button>
                       )}
                     </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              // Logged Out State
              <div className="flex items-center space-x-4">
                 <Link href="/signin" className="text-gray-600 hover:text-teal-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out">
                   Sign In
                 </Link>
                 <Link href="/signup" className="bg-gradient-to-r from-teal-400 to-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition duration-150 ease-in-out">
                   Sign Up
                 </Link>
              </div>
            )}
          </div>

        </div>
      </div>

    </nav>
  );
}