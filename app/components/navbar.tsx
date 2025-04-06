'use client';

import React, { useState, Fragment } from 'react'; // Ensure Fragment is imported
import Link from 'next/link';
import Image from 'next/image'; // Import next/image
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Adjust path if needed
import { auth } from '@/lib/firebase/firebaseConfig'; // Adjust path if needed
import { signOut } from 'firebase/auth';
import { Menu, Transition } from '@headlessui/react'; // Import Menu and Transition

// --- Icons (using simple SVG placeholders) ---
const UserCircleIcon = ({ className = "w-8 h-8 text-gray-500" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);
const MenuIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
);
const CloseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
);
// --- End Icons ---

export default function Navbar() {
  const { user, isLoading } = useAuth(); // Assumes useAuth provides user object
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("User signed out successfully");
      setIsMobileMenuOpen(false);
      router.push('/signin');
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out.");
    }
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Assume photoURL comes from user object. Needs fetching in AuthContext eventually.
  const pfpUrl = user?.photoURL;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">

          {/* Left Section */}
          <div className="flex items-center">
            {/* Mobile Menu Button */}
            <div className="absolute inset-y-0 left-0 flex items-center md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>

            {/* Logo/Brand Link */}
            <div className="flex-shrink-0 flex items-center ml-10 md:ml-0">
              <Link href={user ? "/dashboard" : "/"} className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent">
                Pull-In
              </Link>
            </div>
          </div>

          {/* Center Section - REMOVED Requests Link */}

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
                    {/* ADDED REQUESTS LINK HERE */}
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/requests"
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } block px-4 py-2 text-sm text-gray-700`}
                        >
                          Requests
                        </Link>
                      )}
                    </Menu.Item>
                    {/* Edit Profile Link */}
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/profile/edit"
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } block px-4 py-2 text-sm text-gray-700`}
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
                           className={`${
                             active ? 'bg-gray-100' : ''
                           } block w-full px-4 py-2 text-left text-sm text-red-600`}
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

        </div>
      </div>

      {/* Mobile Menu Panel */}
      <Transition
        show={isMobileMenuOpen}
        as="div"
        className="md:hidden"
        id="mobile-menu"
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div className="space-y-1 px-2 pb-3 pt-2">
           {/* Mobile: Requests link */}
           {user && (
            <Link href="/requests" onClick={closeMobileMenu} className="text-gray-700 hover:bg-gray-100 block rounded-md px-3 py-2 text-base font-medium">
              Requests
            </Link>
           )}
           {/* Add any other essential mobile links here */}

           {/* Mobile Auth Links/Actions */}
           <div className="border-t border-gray-200 pt-4 pb-3">
               {!isLoading && !user && (
                   <div className="space-y-1">
                        <Link href="/signin" onClick={closeMobileMenu} className="text-gray-700 hover:bg-gray-100 block rounded-md px-3 py-2 text-base font-medium">
                           Sign In
                        </Link>
                        <Link href="/signup" onClick={closeMobileMenu} className="text-gray-700 hover:bg-gray-100 block rounded-md px-3 py-2 text-base font-medium">
                           Sign Up
                        </Link>
                   </div>
               )}
               {user && (
                   <>
                       <div className="flex items-center px-5 mb-2">
                          <div className="flex-shrink-0">
                             {pfpUrl ? (
                                <Image className="h-10 w-10 rounded-full object-cover" src={pfpUrl} alt="User profile picture" width={40} height={40} />
                             ) : (
                                <UserCircleIcon className="h-10 w-10 text-gray-400" />
                             )}
                          </div>
                          <div className="ml-3">
                             <div className="text-sm font-medium text-gray-500">{user.email}</div>
                          </div>
                       </div>
                       <div className="mt-3 space-y-1 px-2">
                          {/* Mobile Requests link also lives above, could remove from here if desired */}
                          <Link href="/profile/edit" onClick={closeMobileMenu} className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100">
                             Edit Profile
                          </Link>
                          <button
                             onClick={handleSignOut}
                             className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50"
                             >
                             Sign Out
                          </button>
                       </div>
                   </>
               )}
           </div>
        </div>
      </Transition>
    </nav>
  );
}