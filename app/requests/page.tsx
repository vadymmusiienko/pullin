'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase/firebaseConfig';
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    serverTimestamp,
    Timestamp,
    runTransaction,
    arrayUnion,
} from 'firebase/firestore';

// Updated interface to support both types of requests with fromGroup field
interface RequestData {
    id: string; // Firestore document ID
    fromGroup?: boolean; // true for group-to-user, false or undefined for user-to-group
    senderId: string;
    senderName: string;
    senderPfpUrl?: string;
    // For user-to-group requests (fromGroup is false/undefined)
    recipientGroupId?: string;
    recipientGroupLeaderId?: string;
    recipientGroupName?: string;
    // For group-to-user requests (fromGroup is true)
    GroupId?: string;
    GroupName?: string;
    GroupLeaderId?: string;
    recipientUserId?: string;
    recipientUserName?: string;
    // Common fields
    status: string; // Using string to match your database
    createdAt: Timestamp;
    rid?: string; // Add this since it's in your current schema
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
        // These are requests where fromGroup is false or doesn't exist
        const incomingGroupRequests = query(
            collection(db, 'requests'),
            where('recipientGroupLeaderId', '==', user.uid),
            where('status', '==', 'pending')
            // No need to filter on fromGroup since older requests won't have it
        );

        // Type 2: User is receiving group-to-user requests
        // Using the fromGroup field to identify these requests
        const incomingUserRequests = query(
            collection(db, 'requests'),
            where('recipientUserId', '==', user.uid),
            where('status', '==', 'pending'),
            where('fromGroup', '==', true)
        );

        const unsubscribeIncomingGroup = onSnapshot(incomingGroupRequests, (snapshot) => {
            const requests: RequestData[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id, 
                    ...data,
                    // Keep fromGroup flag if it exists, otherwise it's a user-to-group request
                    fromGroup: data.fromGroup || false
                } as RequestData;
            });
            console.log("Incoming group requests:", requests); // Debug
            // We'll combine both types of incoming requests
            setIncomingRequests(prevRequests => {
                // Filter out user-to-group requests (where fromGroup is false) to avoid duplication
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
                    // fromGroup should already be true based on the query
                } as RequestData;
            });
            console.log("Incoming user requests:", requests); // Debug
            setIncomingRequests(prevRequests => {
                // Filter out group-to-user requests (where fromGroup is true) to avoid duplication
                const filteredRequests = prevRequests.filter(req => req.fromGroup !== true);
                return [...filteredRequests, ...requests];
            });
            setLoading(false);
        }, (err) => {
            console.error("Error fetching incoming user requests:", err);
            setError("Failed to load incoming requests from groups.");
            setLoading(false);
        });

        // Listener for all Outgoing Requests (both types)
        // Type 1: User sending user-to-group requests
        const outgoingGroupRequests = query(
            collection(db, 'requests'),
            where('senderId', '==', user.uid),
            where('status', '==', 'pending')
            // Not filtering by type yet
        );

        // Type 2: User is a group leader sending group-to-user requests
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
                    // Keep fromGroup flag if it exists, otherwise it's a user-to-group request
                    fromGroup: data.fromGroup || false
                } as RequestData;
            });
            console.log("Outgoing group requests:", requests); // Debug
            setOutgoingRequests(prevRequests => {
                // Filter out user-to-group requests to avoid duplication
                const filteredRequests = prevRequests.filter(req => req.fromGroup === true);
                return [...filteredRequests, ...requests];
            });
        }, (err) => {
            console.error("Error fetching outgoing group requests:", err);
            if (!error) setError("Failed to load your outgoing requests to groups.");
            setLoading(false);
        });

        const unsubscribeOutgoingUser = onSnapshot(outgoingUserRequests, (snapshot) => {
            const requests: RequestData[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id, 
                    ...data
                    // fromGroup should already be true based on the query
                } as RequestData;
            });
            console.log("Outgoing user requests:", requests); // Debug
            setOutgoingRequests(prevRequests => {
                // Filter out group-to-user requests to avoid duplication
                const filteredRequests = prevRequests.filter(req => req.fromGroup !== true);
                return [...filteredRequests, ...requests];
            });
        }, (err) => {
            console.error("Error fetching outgoing user requests:", err);
            if (!error) setError("Failed to load your group's outgoing requests to users.");
            setLoading(false);
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
        const groupRef = doc(db, 'groups', request.recipientGroupId!);
        const userRef = doc(db, 'users', request.senderId);

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
                if (groupData && groupData.members.includes(request.senderId)) {
                    transaction.update(requestRef, { 
                        status: "accepted", 
                        updatedAt: serverTimestamp() 
                    }); 
                    console.warn("User was already in the group members list.");
                    if (userData && (!userData.is_grouped || userData.groupId !== request.recipientGroupId)) { 
                        transaction.update(userRef, { 
                            is_grouped: true, 
                            groupId: request.recipientGroupId, 
                            group_leader: false, 
                            updatedAt: serverTimestamp() 
                        }); 
                    }
                    return;
                }

                transaction.update(requestRef, { status: "accepted", updatedAt: serverTimestamp() });
                transaction.update(groupRef, { members: arrayUnion(request.senderId), updatedAt: serverTimestamp() });
                transaction.update(userRef, { 
                    is_grouped: true, 
                    groupId: request.recipientGroupId, 
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
                transaction.update(groupRef, { members: arrayUnion(user.uid), updatedAt: serverTimestamp() });
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
            await updateDoc(requestRef, { status: "declined", updatedAt: serverTimestamp() });
            console.log(`Request ${request.id} declined successfully.`);
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
            await updateDoc(requestRef, { status: "cancelled", updatedAt: serverTimestamp() });
            console.log(`Request ${request.id} cancelled successfully.`);
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
        // Check fromGroup flag - false or undefined means user-to-group
        if (req.fromGroup !== true) {
            return (
                <li key={req.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-3 flex-grow">
                        <Image
                            src={req.senderPfpUrl || '/placeholder-pfp.png'}
                            alt={`${req.senderName}'s profile picture`}
                            width={40}
                            height={40}
                            className="rounded-full object-cover flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-pfp.png'; }}
                        />
                        <div className="flex-grow">
                            <p className="text-sm font-medium text-gray-900 leading-snug">
                                <span className='font-semibold'>{req.senderName}</span> wants to join <span className='font-semibold'>{req.recipientGroupName}</span>
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

    // Render outgoing request item based on type
    const renderOutgoingRequestItem = (req: RequestData) => {
        // Check fromGroup flag - false or undefined means user-to-group
        if (req.fromGroup !== true) {
            return (
                <li key={req.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex items-center justify-between space-x-4">
                    <div>
                        <p className="text-sm font-medium text-gray-900">
                            Request to join <span className='font-semibold'>{req.recipientGroupName}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                            Sent: {req.createdAt?.toDate().toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-yellow-800 bg-yellow-100 px-2.5 py-1 rounded-full flex-shrink-0">
                            Pending
                        </span>
                        <button
                            onClick={() => handleCancelRequest(req)}
                            disabled={processingRequestId === req.id}
                            className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 transition-colors
                                ${processingRequestId === req.id
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
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
                <li key={req.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex items-center justify-between space-x-4">
                    <div>
                        <p className="text-sm font-medium text-gray-900">
                            Invitation sent to <span className='font-semibold'>{req.recipientUserName}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                            Sent: {req.createdAt?.toDate().toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-yellow-800 bg-yellow-100 px-2.5 py-1 rounded-full flex-shrink-0">
                            Pending
                        </span>
                        <button
                            onClick={() => handleCancelRequest(req)}
                            disabled={processingRequestId === req.id}
                            className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 transition-colors
                                ${processingRequestId === req.id
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
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