// src/app/signup/page.tsx
'use client';

import React, { useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { auth, firestore } from '@/lib/firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Combobox, Transition } from '@headlessui/react';

// --- School Data (remains the same) ---
const activeColleges = [
  { name: "Pomona College", domain: "mymail.pomona.edu" },
  { name: "Scripps College", domain: "scrippscollege.edu" },
  { name: "Claremont McKenna College", domain: "students.claremontmckenna.edu" },
  { name: "Harvey Mudd College", domain: "g.hmc.edu" },
  { name: "Pitzer College", domain: "students.pitzer.edu" },
];

const schoolDomainMap: { [key: string]: string } = activeColleges.reduce((acc, college) => {
  acc[college.name] = college.domain;
  return acc;
}, {} as { [key: string]: string });

const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^\d{1,2}:\d{2}$/;
  if (!timeRegex.test(time)) {
    return false;
  }
  return true;
};


export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gradYear, setGradYear] = useState(''); 
  const [registrationTime, setRegistrationTime] = useState('');

  const getDomainFromEmail = (email: string): string | null => {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1].toLowerCase() : null;
  };

  const filteredColleges =
    query === ''
      ? activeColleges
      : activeColleges.filter((college) =>
          college.name
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(query.toLowerCase().replace(/\s+/g, ''))
        );

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email || !password || !selectedSchool || !firstName || !lastName || !gradYear || !registrationTime) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters long.');
      return;
    }

    const expectedDomain = schoolDomainMap[selectedSchool];
    const actualDomain = getDomainFromEmail(email);
    if (!actualDomain || !expectedDomain || actualDomain !== expectedDomain) {
      setError(expectedDomain ? `Please use a valid @${expectedDomain} email address for ${selectedSchool}.` : 'Invalid school selection.');
      return;
    }

    const parsedGradYear = parseInt(gradYear, 10);
    if (isNaN(parsedGradYear) || gradYear.length !== 4) {
         setError('Please enter a valid 4-digit graduation year.');
         return;
    }

    if (!isValidTimeFormat(registrationTime)) {
      setError('Please enter the registration time in H:MM or HH:MM format (e.g., 8:45 or 14:30).');
      return;
    }


    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User created in Auth:', user);

      const userDocRef = doc(firestore, "users", user.uid);
      const userData = {
        uid: user.uid,
        email: user.email, 
        school: selectedSchool, 
        graduationYear: parsedGradYear, 
        registrationTime: registrationTime, 
        name: `${firstName} ${lastName}`, 
        pfpUrl: "",
        bio:"",
        interests: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userDocRef, userData);
      console.log('User profile created in Firestore with new fields');

      alert('Sign up successful! You will be redirected.');
      router.push('/');

    } catch (err: any) {
      console.error("Error signing up:", err);
       if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already registered.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError(`Failed to sign up. ${err.message || 'Please try again.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto my-12 max-w-md rounded-lg border border-gray-200 p-6 shadow-md">
      <h1 className="mb-6 text-center text-2xl font-semibold">Sign Up</h1>
      <form onSubmit={handleSignUp} className="space-y-4">

        {/* First Name Input */}
        <div>
          <label htmlFor="firstName-input" className="mb-1 block text-sm font-medium text-gray-700">First Name:</label>
          <input
            type="text"
            id="firstName-input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        {/* Last Name Input */}
        <div>
          <label htmlFor="lastName-input" className="mb-1 block text-sm font-medium text-gray-700">Last Name:</label>
          <input
            type="text"
            id="lastName-input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        {/* Email Input (no change) */}
        <div>
          <label htmlFor="email-input" className="mb-1 block text-sm font-medium text-gray-700">School Email:</label>
          <input
            type="email"
            id="email-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="your_school_email@..."
          />
        </div>

        {/* Password Input (no change) */}
        <div>
          <label htmlFor="password-input" className="mb-1 block text-sm font-medium text-gray-700">Password:</label>
          <input
            type="password"
            id="password-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="At least 6 characters"
          />
        </div>

         {/* Graduation Year Input */}
        <div>
          <label htmlFor="gradYear-input" className="mb-1 block text-sm font-medium text-gray-700">Graduation Year:</label>
          <input
            type="number" // Use number type for better mobile UX, but state is string
            id="gradYear-input"
            value={gradYear}
            onChange={(e) => setGradYear(e.target.value)}
            required
            min="2000" // Optional: set min/max
            max="2050"
            step="1"
            placeholder="YYYY"
            className="block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" // Hide number spinners
          />
        </div>

         {/* Registration Time Input */}
         <div>
           <label htmlFor="registrationTime-input" className="mb-1 block text-sm font-medium text-gray-700">Registration Time:</label>
           <input
            type="text" // Use text as time input type has inconsistent support/UI
            id="registrationTime-input"
            value={registrationTime}
            onChange={(e) => setRegistrationTime(e.target.value)}
            required
            placeholder="H:MM or HH:MM (e.g. 8:45)"
            className="block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
           />
         </div>


        {/* School Combobox (no functional change needed here) */}
        <div>
          <Combobox value={selectedSchool} onChange={setSelectedSchool}>
             <Combobox.Label className="mb-1 block text-sm font-medium text-gray-700">Active College:</Combobox.Label>
              <div className="relative mt-1">
                <div className="relative w-full cursor-default overflow-hidden rounded-md bg-white text-left border border-gray-300 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                  <Combobox.Input
                    id="school-combobox"
                    className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                    displayValue={(schoolName: string) => schoolName}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search or select your college..."
                    autoComplete="off"
                    required // Ensure combobox selection is also required by the browser
                  />
                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                     {/* Chevron Icon (no change) */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-gray-400" aria-hidden="true"><path fillRule="evenodd" d="M10 3a.75.75 0 0 1 .55.24l3.25 3.5a.75.75 0 1 1-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 0 1-1.1-1.02l3.25-3.5A.75.75 0 0 1 10 3Z" clipRule="evenodd" /><path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.55-.24l-3.25-3.5a.75.75 0 1 1 1.1-1.02L10 15.148l2.7-2.91a.75.75 0 0 1 1.1 1.02l-3.25 3.5A.75.75 0 0 1 10 17Z" clipRule="evenodd" /></svg>
                  </Combobox.Button>
                </div>
                 {/* Transition and Options (no change) */}
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" afterLeave={() => setQuery('')}>
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {filteredColleges.length === 0 && query !== '' ? (<div className="relative cursor-default select-none px-4 py-2 text-gray-700">Nothing found.</div>)
                     : (filteredColleges.map((college) => (
                        <Combobox.Option key={college.name} value={college.name} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${ active ? 'bg-indigo-600 text-white' : 'text-gray-900' }`}>
                          {({ selected, active }) => (<>
                              <span className={`block truncate ${ selected ? 'font-medium' : 'font-normal' }`}>{college.name}</span>
                              {selected ? (<span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${ active ? 'text-white' : 'text-indigo-600' }`}>
                                  {/* Checkmark Icon (no change) */}
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                                </span>)
                               : null}
                            </>)}
                        </Combobox.Option>
                      )))}
                  </Combobox.Options>
                </Transition>
              </div>
          </Combobox>
        </div>
        {/* --- End School Combobox --- */}


        {error && <p className="text-sm text-red-600">{error}</p>}
        {/* Submit Button (no change) */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}