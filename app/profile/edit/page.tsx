'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase/firebaseConfig';
import { doc, getDoc, updateDoc, serverTimestamp, FieldValue } from 'firebase/firestore';

// Helper function to validate time format (H:MM or HH:MM)
const isValidTimeFormat = (time: string): boolean => {
 const timeRegex = /^\d{1,2}:\d{2}$/;
 if (!timeRegex.test(time)) return false;
 return true;
};


// Helper function to validate Instagram handle (basic)
const isValidInstagramHandle = (handle: string): boolean => {
   if (handle === '') return true; // Allow empty
   const instagramRegex = /^[a-zA-Z0-9._]{1,30}$/; // Letters, numbers, periods, underscores, 1-30 chars
   return instagramRegex.test(handle);
}


interface UserProfileData {
 name: string;
 bio: string;
 graduationYear: number;
 interests: string[];
 registrationTime: string;
 instagramHandle?: string;
 email?: string;
 school?: string;
}


type UserProfileUpdateData = Partial<Omit<UserProfileData, 'graduationYear'> & { graduationYear: number; updatedAt: FieldValue }>;
export default function EditProfilePage() {
 const { user, isLoading: authLoading } = useAuth();
 const router = useRouter();


 // Form field states
 const [name, setName] = useState('');
 const [bio, setBio] = useState('');
 const [graduationYear, setGraduationYear] = useState<string>(''); // Keep as string for input control
 const [interestsString, setInterestsString] = useState('');
 const [registrationTime, setRegistrationTime] = useState('');
 const [instagramHandle, setInstagramHandle] = useState('');


 // Read-only display states
 const [email, setEmail] = useState('');
 const [school, setSchool] = useState('');


 // Component status states
 const [isFetching, setIsFetching] = useState(true);
 const [isUpdating, setIsUpdating] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [successMessage, setSuccessMessage] = useState<string | null>(null);


 // Fetch existing profile data
 const fetchProfileData = useCallback(async (userId: string) => {
   setIsFetching(true);
   setError(null);
   const userDocRef = doc(db, 'users', userId);


   try {
     const docSnap = await getDoc(userDocRef);
     if (docSnap.exists()) {
       const data = docSnap.data();
       // Set state from fetched data
       setName(data.name || '');
       setBio(data.bio || '');
       setGraduationYear(data.graduationYear ? data.graduationYear.toString() : '');
       setInterestsString((data.interests || []).join(', '));
       setRegistrationTime(data.registrationTime || '');
       setInstagramHandle(data.instagramHandle || '');
       setEmail(data.email || '');
       setSchool(data.school || '');
     } else {
       setError('Profile data not found.');
     }
   } catch (err) {
     console.error('Error fetching profile data:', err);
     setError('Failed to load profile data.');
   } finally {
     setIsFetching(false);
   }
 }, []);


 // Effect to fetch data or redirect
 useEffect(() => {
   if (!authLoading && user) {
     fetchProfileData(user.uid);
   } else if (!authLoading && !user) {
     router.push('/signin');
   }
 }, [user, authLoading, fetchProfileData, router]);


 // Handle profile update submission
 const handleUpdateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
   event.preventDefault();
   if (!user) {
     setError('You must be logged in.');
     return;
   }


   setError(null);
   setSuccessMessage(null);
   setIsUpdating(true);


   // --- Client-Side Validation ---
   if (!name.trim()) {
     setError("Name cannot be empty.");
     setIsUpdating(false);
     return;
   }


   if (!graduationYear.trim()) { // Check if empty first
       setError('Graduation year is required.');
       setIsUpdating(false);
       return;
   }
   const numericGradYear = parseInt(graduationYear, 10); // Parse only if not empty
   if (isNaN(numericGradYear) || graduationYear.length !== 4) {
       setError('Graduation year must be a valid 4-digit number.');
       setIsUpdating(false);
       return;
   }


   if (!isValidTimeFormat(registrationTime)) {
       setError('Registration time must be in H:MM or HH:MM format.');
       setIsUpdating(false);
       return;
   }
   const cleanedInstagramHandle = instagramHandle.trim().replace(/^@/, '');
   if (!isValidInstagramHandle(cleanedInstagramHandle)) {
        setError('Please enter a valid Instagram username (letters, numbers, ., _ , max 30 chars) or leave it empty.');
        setIsUpdating(false);
        return;
   }
   // --- End Validation ---


   const interestsArray = interestsString
     .split(',')
     .map(interest => interest.trim())
     .filter(interest => interest !== '');


   // Prepare data object for Firestore update using the specific update type
   const dataToUpdate: UserProfileUpdateData = {
     name: name.trim(),
     bio: bio.trim(),
     // Pass the validated numericGradYear
     graduationYear: numericGradYear,
     interests: interestsArray,
     registrationTime: registrationTime.trim(),
     instagramHandle: cleanedInstagramHandle,
     updatedAt: serverTimestamp(),
   };


   // Remove undefined fields if needed, although Firestore handles them
   // Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);


   // Update Firestore
   try {
     const userDocRef = doc(db, 'users', user.uid);
     await updateDoc(userDocRef, dataToUpdate); // Pass the correctly typed data
     setSuccessMessage('Profile updated successfully!');
     console.log('Profile updated successfully');


   } catch (err: unknown) {
     console.error('Error updating profile:', err);
      if (err instanceof Error) {
           setError(`Failed to update profile: ${err.message}`);
       } else {
           setError(`An unexpected error occurred.`);
       }
   } finally {
     setIsUpdating(false);
   }
 };


 // --- Render Logic ---
if (authLoading || isFetching) {
   return ( <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-teal-400 to-blue-500"> <p className="text-white text-xl">Loading Profile...</p> </div> );
 }


 if (!user) {
   return ( <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-teal-400 to-blue-500"> <p className="text-white text-xl">Please sign in.</p> </div> );
 }




 return (
   <div className="min-h-screen bg-gradient-to-br from-teal-400 to-blue-500 py-10 px-4 sm:px-6 lg:px-8">
     <div className="max-w-2xl mx-auto">
       <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">
         <h1 className="text-center text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
           Edit Your Profile
         </h1>
          <div className="mb-6 text-center text-sm text-gray-500">
            <p>Email: {email}</p>
            <p>School: {school}</p>
          </div>


         <form onSubmit={handleUpdateProfile} className="space-y-6">
           {/* Name */}
           <div>
             <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
             <input type="text" id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100}
               className="w-full py-2 px-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition duration-150 ease-in-out sm:text-sm" />
           </div>


           {/* Bio */}
           <div>
             <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
             <textarea id="bio" name="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={500}
               className="w-full py-2 px-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition duration-150 ease-in-out sm:text-sm" placeholder='Tell us about yourself...'/>
           </div>


            {/* Instagram Handle Input */}
            <div>
              <label htmlFor="instagramHandle" className="block text-sm font-medium text-gray-700 mb-1">Instagram Handle</label>
              <div className="relative rounded-lg shadow-sm">
                   <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                       <span className="text-gray-500 sm:text-sm">@</span>
                   </div>
                   <input type="text" id="instagramHandle" name="instagramHandle" value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} placeholder="your_username" maxLength={30}
                       className="w-full py-2 pl-7 pr-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition duration-150 ease-in-out sm:text-sm" />
              </div>
               <p className="text-xs text-gray-500 mt-1">Enter your Instagram username (without @).</p>
            </div>


           {/* Graduation Year */}
           <div>
             {/* MODIFIED: Added red asterisk */}
             <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 mb-1">Graduation Year <span className="text-red-500">*</span></label>
             <input type="number" id="graduationYear" name="graduationYear" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)}
               // MODIFIED: Added required attribute
               required
               placeholder='YYYY' min="2000" max="2050" step="1"
               className="w-28 py-2 px-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition duration-150 ease-in-out sm:text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
           </div>


           {/* Registration Time */}
            <div>
              <label htmlFor="registrationTime" className="block text-sm font-medium text-gray-700 mb-1">Registration Time <span className="text-red-500">*</span></label>
              <input type="text" id="registrationTime" name="registrationTime" value={registrationTime} onChange={(e) => setRegistrationTime(e.target.value)} required placeholder="H:MM or HH:MM"
               className="w-32 py-2 px-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition duration-150 ease-in-out sm:text-sm" />
            </div>


           {/* Interests */}
           <div>
              <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-1">Interests</label>
              <input type="text" id="interests" name="interests" value={interestsString} onChange={(e) => setInterestsString(e.target.value)} placeholder="Hiking, Coding, Reading"
               className="w-full py-2 px-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition duration-150 ease-in-out sm:text-sm" />
              <p className="text-xs text-gray-500 mt-1">Separate interests with commas.</p>
           </div>

           {/* --- Submission & Feedback --- */}
           <div className="pt-5">
               {error && <p className="text-red-600 text-sm mb-4 text-center font-medium">{error}</p>}
               {successMessage && <p className="text-green-600 text-sm mb-4 text-center font-medium">{successMessage}</p>}


               <button type="submit" disabled={isUpdating || authLoading}
                 className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-70 transition duration-300 ease-in-out text-base"
               >
                 {isUpdating ? 'Saving Changes...' : 'Save Changes'}
               </button>
           </div>
         </form>
       </div>
     </div>
   </div>
 );
}

