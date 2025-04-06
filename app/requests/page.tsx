'use client';


import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase/firebaseConfig';
import {
 collection,
 query,
 where,
 onSnapshot,
 doc,
 serverTimestamp,
 Timestamp,
 runTransaction,
 arrayUnion,
 deleteDoc,
 arrayRemove,
} from 'firebase/firestore';


// Updated interface to support both types of requests with fromGroup field
interface RequestData {
 id: string; // Firestore document ID
 fromGroup: boolean; // true for group-to-user, false for user-to-group
  // Common fields
 status: string;
 createdAt: Timestamp;
  // User-to-group requests (fromGroup is false)
 userid?: string; // Sender user ID
 GroupId?: string; // Recipient group ID
 GroupName?: string; // Recipient group name
 GroupLeaderId?: string; // Group leader ID 
}


export default function RequestsPage() {
 const { user, isLoading: authLoading } = useAuth();
 const router = useRouter();


 const [incomingRequests, setIncomingRequests] = useState<RequestData[]>([]);
 const [outgoingRequests, setOutgoingRequests] = useState<RequestData[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);


 useEffect(() => {
   if (authLoading) return;
   if (!user) {
     router.push('/signin');
     return;
   }


   setLoading(true);
   setError(null);


   // Type 1: User is a group leader receiving user-to-group requests
   // These are requests where fromGroup is false
   const incomingGroupRequests = query(
     collection(db, 'requests'),
     where('GroupLeaderId', '==', user.uid),
     where('status', '==', 'pending'),
     where('fromGroup', '==', false)
   );


   // Type 2: User is receiving group-to-user requests
   const incomingUserRequests = query(
     collection(db, 'requests'),
     where('userid', '==', user.uid),
     where('status', '==', 'pending'),
     where('fromGroup', '==', true)
   );


   const unsubscribeIncomingGroup = onSnapshot(incomingGroupRequests, (snapshot) => {
     const requests: RequestData[] = snapshot.docs.map(doc => {
       const data = doc.data();
       return {
         id: doc.id,
         ...data,
       } as RequestData;
     });
     console.log("Incoming group requests:", requests); // Debug
     // We'll combine both types of incoming requests
     setIncomingRequests(prevRequests => {
       // Filter out user-to-group requests to avoid duplication
       const filteredRequests = prevRequests.filter(req => req.fromGroup === true);
       return [...filteredRequests, ...requests];
     });
     setLoading(false);
   }, (err) => {
     console.error("Error fetching incoming group requests:", err);
     setError("Failed to load incoming requests to your group.");
     setLoading(false);
   });


   const unsubscribeIncomingUser = onSnapshot(incomingUserRequests, (snapshot) => {
     const requests: RequestData[] = snapshot.docs.map(doc => {
       const data = doc.data();
       return {
         id: doc.id,
         ...data
       } as RequestData;
     });
     console.log("Incoming user requests:", requests); // Debug
     setIncomingRequests(prevRequests => {
       // Filter out group-to-user requests to avoid duplication
       const filteredRequests = prevRequests.filter(req => req.fromGroup !== true);
       return [...filteredRequests, ...requests];
     });
     setLoading(false);
   }, (err) => {
     console.error("Error fetching incoming user requests:", err);
     setError("Failed to load incoming requests from groups.");
     setLoading(false);
   });


   // Outgoing requests - user sending requests to join groups
   const outgoingGroupRequests = query(
     collection(db, 'requests'),
     where('userid', '==', user.uid),
     where('status', '==', 'pending'),
     where('fromGroup', '==', false)
   );


   // Outgoing requests - user as group leader sending invites to users
   const outgoingUserRequests = query(
     collection(db, 'requests'),
     where('GroupLeaderId', '==', user.uid),
     where('status', '==', 'pending'),
     where('fromGroup', '==', true)
   );


   const unsubscribeOutgoingGroup = onSnapshot(outgoingGroupRequests, (snapshot) => {
     const requests: RequestData[] = snapshot.docs.map(doc => {
       const data = doc.data();
       return {
         id: doc.id,
         ...data,
       } as RequestData;
     });
     console.log("Outgoing group requests:", requests); // Debug
     setOutgoingRequests(prevRequests => {
       // Filter out user-to-group requests to avoid duplication
       const filteredRequests = prevRequests.filter(req => req.fromGroup === true);
       return [...filteredRequests, ...requests];
     });
     setLoading(false);
   }, (err) => {
     console.error("Error fetching outgoing group requests:", err);
     if (!error) setError("Failed to load your outgoing requests to groups.");
   });


   const unsubscribeOutgoingUser = onSnapshot(outgoingUserRequests, (snapshot) => {
     const requests: RequestData[] = snapshot.docs.map(doc => {
       const data = doc.data();
       return {
         id: doc.id,
         ...data
       } as RequestData;
     });
     console.log("Outgoing user requests:", requests); // Debug
     setOutgoingRequests(prevRequests => {
       // Filter out group-to-user requests to avoid duplication
       const filteredRequests = prevRequests.filter(req => req.fromGroup !== true);
       return [...filteredRequests, ...requests];
     });
     setLoading(false);
   }, (err) => {
     console.error("Error fetching outgoing user requests:", err);
     if (!error) setError("Failed to load your group's outgoing requests to users.");
   });


   return () => {
     unsubscribeIncomingGroup();
     unsubscribeIncomingUser();
     unsubscribeOutgoingGroup();
     unsubscribeOutgoingUser();
   };
 }, [user, authLoading, router, error]);


 // Handle accepting user-to-group request
 const handleAcceptUserToGroupRequest = async (request: RequestData) => {
   if (processingRequestId || !user) return;
   setProcessingRequestId(request.id);
   setError(null);


   const requestRef = doc(db, 'requests', request.id);
   const groupRef = doc(db, 'groups', request.GroupId!);
   const userRef = doc(db, 'users', request.userid!);


   try {
     await runTransaction(db, async (transaction) => {
       const requestSnap = await transaction.get(requestRef);
       const groupSnap = await transaction.get(groupRef);
       const userSnap = await transaction.get(userRef);


       if (!requestSnap.exists() || requestSnap.data().status !== 'pending') {
         throw new Error("Request no longer exists or is not pending.");
       }
       if (!groupSnap.exists()) {
         transaction.update(requestRef, { status: "declined", updatedAt: serverTimestamp() });
         throw new Error("Group no longer exists.");
       }
       if (!userSnap.exists()) {
         transaction.update(requestRef, { status: "declined", updatedAt: serverTimestamp() });
         throw new Error("Requesting user no longer exists.");
       }


       const groupData = groupSnap.data();
       const userData = userSnap.data();


       if (userData && userData.is_grouped) {
         transaction.update(requestRef, {
           status: "declined",
           reason: "User already in a group",
           updatedAt: serverTimestamp()
         });
         throw new Error("Requesting user is already in a group.");
       }
       if (groupData && groupData.members.length >= groupData.capacity) {
         transaction.update(requestRef, {
           status: "declined",
           reason: "Group is full",
           updatedAt: serverTimestamp()
         });
         throw new Error("Group is already full.");
       }
       if (groupData && groupData.members.includes(request.userid)) {
         transaction.update(requestRef, {
           status: "accepted",
           updatedAt: serverTimestamp()
         });
         console.warn("User was already in the group members list.");
         if (userData && (!userData.is_grouped || userData.groupId !== request.GroupId)) {
           transaction.update(userRef, {
             is_grouped: true,
             groupId: request.GroupId,
             group_leader: false,
             updatedAt: serverTimestamp()
           });
         }
         return;
       }


       transaction.update(requestRef, { status: "accepted", updatedAt: serverTimestamp() });
       transaction.update(groupRef, { members: arrayUnion(request.userid), updatedAt: serverTimestamp(), pendingUsers: arrayRemove(request.userid) });
       transaction.update(userRef, {
         is_grouped: true,
         groupId: request.GroupId,
         group_leader: false,
         updatedAt: serverTimestamp()
       });
     });
     console.log(`User-to-group request ${request.id} accepted successfully.`);
   } catch (err: unknown) {
     console.error("Error accepting request:", err);
     setError(err instanceof Error ?
       `Failed to accept request: ${err.message}` :
       "An unexpected error occurred while accepting the request."
     );
   } finally {
     setProcessingRequestId(null);
   }
 };


 // Handle accepting group-to-user request
 const handleAcceptGroupToUserRequest = async (request: RequestData) => {
   if (processingRequestId || !user) return;
   setProcessingRequestId(request.id);
   setError(null);


   const requestRef = doc(db, 'requests', request.id);
   const groupRef = doc(db, 'groups', request.GroupId!);
   const userRef = doc(db, 'users', user.uid); // Current user is the recipient


   try {
     await runTransaction(db, async (transaction) => {
       const requestSnap = await transaction.get(requestRef);
       const groupSnap = await transaction.get(groupRef);
       const userSnap = await transaction.get(userRef);


       if (!requestSnap.exists() || requestSnap.data().status !== 'pending') {
         throw new Error("Request no longer exists or is not pending.");
       }
       if (!groupSnap.exists()) {
         transaction.update(requestRef, { status: "declined", updatedAt: serverTimestamp() });
         throw new Error("Group no longer exists.");
       }


       const groupData = groupSnap.data();
       const userData = userSnap.data();


       if (userData && userData.is_grouped) {
         transaction.update(requestRef, {
           status: "declined",
           reason: "User already in a group",
           updatedAt: serverTimestamp()
         });
         throw new Error("You are already in a group.");
       }
       if (groupData && groupData.members.length >= groupData.capacity) {
         transaction.update(requestRef, {
           status: "declined",
           reason: "Group is full",
           updatedAt: serverTimestamp()
         });
         throw new Error("The group is already full.");
       }


       transaction.update(requestRef, { status: "accepted", updatedAt: serverTimestamp() });
       transaction.update(groupRef, { members: arrayUnion(user.uid), updatedAt: serverTimestamp(), pendingUsers: arrayRemove(request.userid) });
       transaction.update(userRef, {
         is_grouped: true,
         groupId: request.GroupId,
         group_leader: false,
         updatedAt: serverTimestamp()
       });
     });
     console.log(`Group-to-user request ${request.id} accepted successfully.`);
   } catch (err: unknown) {
     console.error("Error accepting request:", err);
     setError(err instanceof Error ?
       `Failed to accept request: ${err.message}` :
       "An unexpected error occurred while accepting the request."
     );
   } finally {
     setProcessingRequestId(null);
   }
 };


 const handleAcceptRequest = (request: RequestData) => {
   if (request.fromGroup === true) {
     return handleAcceptGroupToUserRequest(request);
   } else {
     return handleAcceptUserToGroupRequest(request);
   }
 };


 const handleDeclineRequest = async (request: RequestData) => {
   if (processingRequestId) return;
   setProcessingRequestId(request.id);
   setError(null);
   const requestRef = doc(db, 'requests', request.id);
   try {
     // Delete the request document instead of updating its status
     await deleteDoc(requestRef);
     console.log(`Request ${request.id} declined and deleted successfully.`);
   } catch (err: unknown) {
     console.error("Error declining request:", err);
     setError(err instanceof Error ?
       `Failed to decline request: ${err.message}` :
       "An unexpected error occurred while declining the request."
     );
   } finally {
     setProcessingRequestId(null);
   }
 };


 // Handle cancelling an outgoing request
 const handleCancelRequest = async (request: RequestData) => {
   if (processingRequestId) return;
   setProcessingRequestId(request.id);
   setError(null);
   const requestRef = doc(db, 'requests', request.id);
   try {
     // Delete the request document instead of updating its status
     await deleteDoc(requestRef);
     console.log(`Request ${request.id} cancelled and deleted successfully.`);
   } catch (err: unknown) {
     console.error("Error cancelling request:", err);
     setError(err instanceof Error ?
       `Failed to cancel request: ${err.message}` :
       "An unexpected error occurred while cancelling the request."
     );
   } finally {
     setProcessingRequestId(null);
   }
 };


 // Render incoming request item based on type
 const renderIncomingRequestItem = (req: RequestData) => {
   // Check fromGroup flag - false means user-to-group
   if (req.fromGroup !== true) {
     return (
       <li key={req.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
         <div className="flex items-center space-x-3 flex-grow">
           <div className="flex-grow">
             <p className="text-xs text-gray-500">
               {req.createdAt?.toDate().toLocaleDateString()}
             </p>
           </div>
         </div>
         <div className="flex space-x-2 flex-shrink-0 self-end sm:self-center">
           <button
             onClick={() => handleAcceptRequest(req)}
             disabled={processingRequestId === req.id}
             className={`px-3 py-1 text-xs font-semibold rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${processingRequestId === req.id
               ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
               : 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500'
               }`}
           >
             {processingRequestId === req.id ? '...' : 'Accept'}
           </button>
           <button
             onClick={() => handleDeclineRequest(req)}
             disabled={processingRequestId === req.id}
             className={`px-3 py-1 text-xs font-semibold rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${processingRequestId === req.id
               ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
               : 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
               }`}
           >
             {processingRequestId === req.id ? '...' : 'Decline'}
           </button>
         </div>
       </li>
     );
   } else {
     // Group-to-user request
     return (
       <li key={req.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
         <div className="flex items-center space-x-3 flex-grow">
           <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
             {req.GroupName?.charAt(0) || 'G'}
           </div>
           <div className="flex-grow">
             <p className="text-sm font-medium text-gray-900 leading-snug">
               <span className='font-semibold'>{req.GroupName}</span> invites you to join their group
             </p>
             <p className="text-xs text-gray-500">
               {req.createdAt?.toDate().toLocaleDateString()}
             </p>
           </div>
         </div>
         <div className="flex space-x-2 flex-shrink-0 self-end sm:self-center">
           <button
             onClick={() => handleAcceptRequest(req)}
             disabled={processingRequestId === req.id}
             className={`px-3 py-1 text-xs font-semibold rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${processingRequestId === req.id
               ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
               : 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500'
               }`}
           >
             {processingRequestId === req.id ? '...' : 'Accept'}
           </button>
           <button
             onClick={() => handleDeclineRequest(req)}
             disabled={processingRequestId === req.id}
             className={`px-3 py-1 text-xs font-semibold rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${processingRequestId === req.id
               ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
               : 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
               }`}
           >
             {processingRequestId === req.id ? '...' : 'Decline'}
           </button>
         </div>
       </li>
     );
   }
 };


    const renderOutgoingRequestItem = (req: RequestData) => {
    // Check fromGroup flag - false means user-to-group
    if (req.fromGroup !== true) {
        return (
        <li key={req.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-3 flex-grow">
            <div className="flex-grow">
                <p className="text-sm font-medium text-gray-900">
                Request to join <span className='font-semibold'>{req.GroupName}</span>
                </p>
                <p className="text-xs text-gray-500">
                Sent: {req.createdAt?.toDate().toLocaleDateString()}
                </p>
            </div>
            </div>
            <div className="flex space-x-2 flex-shrink-0 self-end sm:self-center">
            <span className="px-3 py-1 text-xs font-semibold rounded-md bg-yellow-100 text-yellow-800">
                Pending
            </span>
            <button
                onClick={() => handleCancelRequest(req)}
                disabled={processingRequestId === req.id}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                processingRequestId === req.id
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
                }`}
            >
                {processingRequestId === req.id ? '...' : 'Cancel'}
            </button>
            </div>
        </li>
        );
    } else {
        // Group-to-user request
        return (
        <li key={req.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-3 flex-grow">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {req.GroupName?.charAt(0) || 'G'}
            </div>
            <div className="flex-grow">
                <p className="text-sm font-medium text-gray-900 leading-snug">
                Invitation sent to user
                </p>
                <p className="text-xs text-gray-500">
                Sent: {req.createdAt?.toDate().toLocaleDateString()}
                </p>
            </div>
            </div>
            <div className="flex space-x-2 flex-shrink-0 self-end sm:self-center">
            <span className="px-3 py-1 text-xs font-semibold rounded-md bg-yellow-100 text-yellow-800">
                Pending
            </span>
            <button
                onClick={() => handleCancelRequest(req)}
                disabled={processingRequestId === req.id}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                processingRequestId === req.id
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
                }`}
            >
                {processingRequestId === req.id ? '...' : 'Cancel'}
            </button>
            </div>
        </li>
        );
    }
    };

    if (authLoading || loading) {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-teal-50 to-blue-100">
        <p className="text-gray-600 text-xl">Loading Requests...</p>
        <svg className="animate-spin ml-3 h-5 w-5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        </div>
    );
    }


 return (
   <div className="min-h-screen bg-gradient-to-br from-teal-400 to-blue-500 py-10 px-4 sm:px-6">
     <div className="max-w-7xl mx-auto">
       <div className="mb-10 text-center">
         <h1 className="text-3xl font-bold text-white mb-2">
           Requests & Invitations
         </h1>
         <p className="text-white text-opacity-80 max-w-2xl mx-auto">
           Review incoming requests and invitations, and track your outgoing requests.
         </p>
       </div>


       {error && (
         <div className="max-w-4xl mx-auto bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow" role="alert">
           <p className="font-bold">Error</p>
           <p>{error}</p>
         </div>
       )}


       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
         <section>
           <h2 className="text-2xl font-semibold text-white mb-5">
             Incoming
           </h2>
           <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-xl shadow-lg min-h-[200px]">
             {incomingRequests.length === 0 ? (
               <p className="text-gray-500 italic text-center pt-4">No pending incoming requests or invitations.</p>
             ) : (
               <ul className="space-y-4">
                 {incomingRequests.map((req) => renderIncomingRequestItem(req))}
               </ul>
             )}
           </div>
         </section>


         <section>
           <h2 className="text-2xl font-semibold text-white mb-5">
             Outgoing
           </h2>
           <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-xl shadow-lg min-h-[200px]">
             {outgoingRequests.length === 0 ? (
               <p className="text-gray-500 italic text-center pt-4">No pending outgoing requests or invitations.</p>
             ) : (
               <ul className="space-y-3">
                 {outgoingRequests.map((req) => renderOutgoingRequestItem(req))}
               </ul>
             )}
           </div>
         </section>
       </div>
     </div>
   </div>
 );
}

