"use client";

import { useState, useEffect } from "react";
import {
    collection,
    query,
    limit,
    getDocs,
    doc,
    getDoc,
    Timestamp,
    where,
    // Add necessary functions for deleting/updating later
    // writeBatch, deleteDoc, updateDoc, arrayRemove, arrayUnion
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase/firebaseConfig"; // Adjust the import path as needed
import GroupCard from "./components/GroupCard";
import DisplayUsers from "./components/DisplayUsers"; // Ensure this path is correct
import Link from "next/link";

// Define type for color schemes to match the expected values
type ColorScheme = "blue" | "green" | "purple" | "orange" | "pink";

// Interface for minimal user data within a group card
export interface GroupMemberCard {
    id: string;
    name: string;
    year: string;
    registrationTime: string; // Keep if needed, otherwise optional
    pfpUrl?: string; // Add profile picture URL
}

// Interface for full Group Data
export interface GroupData {
    id: string;
    capacity: number;
    currentOccupancy: number;
    groupName: string;
    colorScheme: ColorScheme;
    userCards: GroupMemberCard[]; // Updated type name
    creatorId: string; // Add creatorId if needed for leader check
    members: string[]; // Keep the list of member IDs
    description?: string; // Optional description
    // Add other group fields if they exist
}

// Interface for full User Data fetched from Firestore
export interface UserData {
    name: string;
    email: string;
    bio: string;
    graduationYear: number;
    group_leader: boolean;
    interests: string[];
    is_grouped: boolean;
    registrationTime?: string; // Make optional if not always present
    school: string;
    uid: string;
    pfpUrl?: string; // Optional profile picture
    createdAt: Timestamp;
    updatedAt: Timestamp;
    groupId?: string; // Add groupId if user document stores it
}

export default function Dashboard() {
    const createGroupPath = "/create_group";
    const [recommendedGroups, setRecommendedGroups] = useState<GroupData[]>([]); // Renamed for clarity
    const [userGroup, setUserGroup] = useState<GroupData | null>(null); // State for the user's current group
    const [ungroupedUsers, setUngroupedUsers] = useState<UserData[]>([]); // State for users not in a group
    const [groupMembers, setGroupMembers] = useState<UserData[]>([]); // State for members of the user's group
    const [loading, setLoading] = useState(true);
    const [loadingGroupView, setLoadingGroupView] = useState(true); // Separate loading for grouped view
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [capacityFilter, setCapacityFilter] = useState("All Capacities");
    const [availabilityFilter, setAvailabilityFilter] =
        useState("Any Availability");

    // --- Fetch Current User and Initial Data ---
    useEffect(() => {
        const fetchUserData = async () => {
            const unsubscribe = auth.onAuthStateChanged(async (user) => {
                if (user) {
                    setLoading(true); // Start loading when user is confirmed
                    setLoadingGroupView(true); // Also set group view loading
                    try {
                        // Get user document from Firestore
                        const userDocRef = doc(db, "users", user.uid);
                        const userDoc = await getDoc(userDocRef);

                        if (!userDoc.exists()) {
                            console.error("User document not found");
                            setLoading(false);
                            setLoadingGroupView(false);
                            return;
                        }

                        const userData = {
                            uid: user.uid,
                            ...userDoc.data(),
                        } as UserData;
                        setCurrentUser(userData);

                        if (userData.is_grouped) {
                            // --- Fetch User's Group, Members, and Ungrouped Users ---
                            await fetchUserGroupData(userData); // Pass userData to fetch group details
                        } else {
                            // --- Fetch Recommended Groups for Ungrouped Users ---
                            await fetchRecommendedGroups();
                            setLoadingGroupView(false); // Not loading group view if user isn't grouped
                        }
                    } catch (error) {
                        console.error("Error fetching user data:", error);
                    } finally {
                        setLoading(false); // Stop general loading here
                        // setLoadingGroupView is handled within fetch functions
                    }
                } else {
                    console.log("No user signed in.");
                    setCurrentUser(null);
                    setRecommendedGroups([]);
                    setUserGroup(null);
                    setUngroupedUsers([]);
                    setGroupMembers([]);
                    setLoading(false);
                    setLoadingGroupView(false);
                }
            });

            return unsubscribe; // Return the unsubscribe function
        };

        const unsubscribePromise = fetchUserData();

        // Cleanup subscription on unmount
        return () => {
            unsubscribePromise.then((unsubscribe) => unsubscribe());
        };
    }, []); // Run only once on mount with empty dependency array

    // --- Function to Fetch Recommended Groups ---
    const fetchRecommendedGroups = async () => {
        try {
            const groupsQuery = query(
                collection(db, "groups"),
                limit(6) // Fetch a limited number for recommendations
            );
            const groupsSnapshot = await getDocs(groupsQuery);
            const groupsDataPromises = groupsSnapshot.docs.map(
                async (groupDoc) => {
                    const groupData = groupDoc.data();
                    // 1. Fetch the full UserData for members (rename for clarity)
                    const memberDetails: UserData[] =
                        await fetchGroupMemberDetails(groupData.members || []);

                    // 2. Map UserData[] to GroupMemberCard[]
                    const groupMemberCards: GroupMemberCard[] =
                        memberDetails.map((member) => ({
                            id: member.uid, // Map uid to id
                            name: member.name,
                            year: `Class of ${member.graduationYear}`, // Map graduationYear to year string
                            registrationTime: member.registrationTime || "", // Handle undefined
                            pfpUrl: member.pfpUrl,
                        }));

                    // 3. Construct the final object conforming to GroupData
                    const resultData: GroupData = {
                        // Add explicit type annotation here too
                        id: groupDoc.id,
                        capacity: groupData.capacity,
                        currentOccupancy: (groupData.members || []).length,
                        groupName: groupData.groupName,
                        colorScheme: getColorScheme(groupDoc.id),
                        userCards: groupMemberCards, // Assign the mapped GroupMemberCard[] array
                        creatorId: groupData.creatorId,
                        members: groupData.members || [], // Keep original member IDs
                        description: groupData.description,
                    };
                    return resultData;
                }
            );

            // Await all promises and set state
            const groupsData = await Promise.all(groupsDataPromises);
            setRecommendedGroups(groupsData);
        } catch (error) {
            console.error("Error fetching recommended groups:", error);
            setRecommendedGroups([]); // Clear groups on error
        }
    };

    const fetchUserGroupData = async (userData: UserData) => {
        // ... validation logic ...
        if (!userData.groupId) {
            /* ... handle missing groupId ... */
            setLoadingGroupView(false);
            return;
        }

        try {
            const groupDocRef = doc(db, "groups", userData.groupId);
            const groupDoc = await getDoc(groupDocRef);
            if (!groupDoc.exists()) {
                /* ... handle missing groupDoc ... */
                setLoadingGroupView(false);
                return;
            }

            const groupData = groupDoc.data();
            // Fetches the full UserData for members
            const memberDetails: UserData[] = await fetchGroupMemberDetails(
                groupData.members || []
            );

            // *** FIX IS HERE: Map UserData[] to GroupMemberCard[] ***
            const groupMemberCards: GroupMemberCard[] = memberDetails.map(
                (member) => ({
                    id: member.uid, // Use uid for id
                    name: member.name,
                    year: `Class of ${member.graduationYear}`, // Format year
                    registrationTime: member.registrationTime || "", // Handle potential undefined
                    pfpUrl: member.pfpUrl,
                })
            );

            const userGroupData: GroupData = {
                id: groupDoc.id,
                capacity: groupData.capacity,
                currentOccupancy: (groupData.members || []).length,
                groupName: groupData.groupName,
                colorScheme: getColorScheme(groupDoc.id),
                userCards: groupMemberCards, // Assign the correctly typed array
                creatorId: groupData.creatorId,
                members: groupData.members || [],
                description: groupData.description,
            };

            setUserGroup(userGroupData);
            setGroupMembers(memberDetails); // Keep storing full data separately if needed

            const usersCollectionRef = collection(db, "users"); // Get reference to 'users' collection
            const ungroupedUsersQuery = query(
                usersCollectionRef, // 1. REQUIRED: The collection to query
                where("is_grouped", "==", false), // 2. Constraint: Filter for ungrouped users
                limit(20) // 3. Constraint: Limit results (good practice)
            );
            const ungroupedSnapshot = await getDocs(ungroupedUsersQuery);
            const ungroupedUsersData = ungroupedSnapshot.docs.map(
                (doc) => ({ uid: doc.id, ...doc.data() } as UserData)
            );
            setUngroupedUsers(ungroupedUsersData); // Set state with fetched users
        } catch (error) {
            console.error("Error fetching group view data:", error);
            // ... reset states ...
        } finally {
            setLoadingGroupView(false);
        }
    };

    // --- Helper Function to Fetch Member Details ---
    // Updated to fetch full UserData for group members display
    const fetchGroupMemberDetails = async (
        memberIds: string[]
    ): Promise<UserData[]> => {
        const memberPromises = memberIds.map(async (memberId) => {
            const memberDocRef = doc(db, "users", memberId);
            const memberDoc = await getDoc(memberDocRef);
            if (memberDoc.exists()) {
                // Return full UserData
                return { uid: memberId, ...memberDoc.data() } as UserData;
            }
            return null; // Return null if member doc doesn't exist
        });

        const membersData = await Promise.all(memberPromises);
        return membersData.filter((member) => member !== null) as UserData[]; // Filter out nulls
    };

    // Assign a color scheme based on group ID (for visual variety)
    const getColorScheme = (groupId: string): ColorScheme => {
        const colors: ColorScheme[] = [
            "blue",
            "green",
            "purple",
            "orange",
            "pink",
        ];
        const hashCode = groupId
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hashCode % colors.length];
    };

    // Filter recommended groups based on search and filters
    const filteredRecommendedGroups = recommendedGroups.filter((group) => {
        // Search term filter
        const matchesSearch =
            searchTerm === "" ||
            group.groupName.toLowerCase().includes(searchTerm.toLowerCase());

        // Capacity filter
        let matchesCapacity = true;
        if (capacityFilter === "2-4 People") {
            matchesCapacity = group.capacity >= 2 && group.capacity <= 4;
        } else if (capacityFilter === "5+ People") {
            matchesCapacity = group.capacity >= 5;
        }

        // Availability filter
        let matchesAvailability = true;
        if (availabilityFilter === "Has Open Spots") {
            matchesAvailability = group.currentOccupancy < group.capacity;
        } else if (availabilityFilter === "Full Groups") {
            matchesAvailability = group.currentOccupancy === group.capacity;
        }

        return matchesSearch && matchesCapacity && matchesAvailability;
    });

    // --- Placeholder Handlers for Actions ---
    // Implement the actual Firestore logic for these
    const handleInviteUser = async (userIdToInvite: string) => {
        if (!userGroup || !currentUser) {
            console.error("Cannot invite: group or current user data missing.");
            alert("Error: Missing group data.");
            return;
        }
        if (userGroup.currentOccupancy >= userGroup.capacity) {
            console.warn("Cannot invite: Group is full.");
            alert("Cannot invite: Group is already full.");
            return;
        }
        if (userGroup.members.includes(userIdToInvite)) {
            console.warn("Cannot invite: User is already in the group.");
            alert("User is already in this group.");
            return;
        }

        console.log(`Inviting user ${userIdToInvite} to group ${userGroup.id}`);
        alert(
            `TODO: Implement Firestore logic to invite user ${userIdToInvite}`
        );
        // --- Firestore Logic (Example using batch write) ---
        // const batch = writeBatch(db);
        // const groupRef = doc(db, "groups", userGroup.id);
        // const userToInviteRef = doc(db, "users", userIdToInvite);

        // batch.update(groupRef, {
        //     members: arrayUnion(userIdToInvite)
        // });
        // batch.update(userToInviteRef, {
        //     is_grouped: true,
        //     groupId: userGroup.id
        // });

        // try {
        //     await batch.commit();
        //     console.log("User invited successfully!");
        //     // Refresh data
        //     fetchUserGroupData(currentUser);
        // } catch (error) {
        //     console.error("Error inviting user:", error);
        //     alert("Failed to invite user. Please try again.");
        // }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (
            !currentUser ||
            !currentUser.group_leader ||
            !userGroup ||
            userGroup.id !== groupId
        ) {
            console.error("Unauthorized or incorrect group ID for deletion.");
            alert("Error: You are not authorized to delete this group.");
            return;
        }
        if (
            !confirm(
                `Are you sure you want to permanently delete the group "${userGroup.groupName}"? This cannot be undone.`
            )
        ) {
            return;
        }

        console.log(`Deleting group ${groupId}`);
        alert(
            `TODO: Implement Firestore logic to delete group ${groupId} and update members.`
        );
        // --- Firestore Logic (Example using batch write) ---
        // const batch = writeBatch(db);
        // const groupRef = doc(db, "groups", groupId);

        // // Update all members to be ungrouped
        // userGroup.members.forEach(memberId => {
        //     const userRef = doc(db, "users", memberId);
        //     batch.update(userRef, {
        //         is_grouped: false,
        //         groupId: deleteField(), // Remove groupId field
        //         group_leader: false // Ensure leader status is also removed
        //     });
        // });

        // // Delete the group document
        // batch.delete(groupRef);

        // try {
        //     await batch.commit();
        //     console.log("Group deleted successfully!");
        //     // Reset state or navigate away
        //     setUserGroup(null);
        //     setUngroupedUsers([]);
        //     setGroupMembers([]);
        //     // Force a state update on currentUser to reflect is_grouped = false
        //     setCurrentUser(prev => prev ? { ...prev, is_grouped: false, group_leader: false, groupId: undefined } : null);
        //     // Optionally fetch recommended groups now
        //     fetchRecommendedGroups();

        // } catch (error) {
        //     console.error("Error deleting group:", error);
        //     alert("Failed to delete group. Please try again.");
        // }
    };

    const handleRemoveMember = async (memberIdToRemove: string) => {
        if (
            !currentUser ||
            !currentUser.group_leader ||
            !userGroup ||
            memberIdToRemove === currentUser.uid
        ) {
            console.error(
                "Unauthorized, cannot remove self, or missing group data."
            );
            alert("Error: Cannot remove member.");
            return;
        }
        if (!userGroup.members.includes(memberIdToRemove)) {
            console.warn("Cannot remove: User is not in this group.");
            alert("This user is not currently in your group.");
            return;
        }
        if (
            !confirm(
                `Are you sure you want to remove this member from the group?`
            )
        ) {
            return;
        }

        console.log(
            `Removing member ${memberIdToRemove} from group ${userGroup.id}`
        );
        alert(
            `TODO: Implement Firestore logic to remove member ${memberIdToRemove}`
        );
        // --- Firestore Logic (Example using batch write) ---
        // const batch = writeBatch(db);
        // const groupRef = doc(db, "groups", userGroup.id);
        // const memberToRemoveRef = doc(db, "users", memberIdToRemove);

        // batch.update(groupRef, {
        //     members: arrayRemove(memberIdToRemove)
        // });
        // batch.update(memberToRemoveRef, {
        //     is_grouped: false,
        //     groupId: deleteField() // Remove groupId field
        // });

        // try {
        //     await batch.commit();
        //     console.log("Member removed successfully!");
        //     // Refresh data
        //     fetchUserGroupData(currentUser);
        // } catch (error) {
        //     console.error("Error removing member:", error);
        //     alert("Failed to remove member. Please try again.");
        // }
    };

    // --- Render Logic ---

    // Loading state for initial user check or recommended groups
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
                <div className="text-center py-10">
                    <div
                        className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-white border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
                        role="status"
                    >
                        <span className="sr-only">Loading...</span>
                    </div>
                    <p className="mt-4 text-white text-lg">
                        Loading Dashboard...
                    </p>
                </div>
            </div>
        );
    }

    // --- Display for Grouped Users ---
    if (currentUser?.is_grouped) {
        // Loading state specifically for the grouped user's view data
        if (loadingGroupView) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center">
                    <div className="text-center py-10">
                        <div
                            className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
                            role="status"
                        >
                            <span className="sr-only">Loading...</span>
                        </div>
                        <p className="mt-4 text-gray-700 text-lg">
                            Loading Your Group...
                        </p>
                    </div>
                </div>
            );
        }

        if (!userGroup) {
            // Handle case where user is grouped but group data couldn't be loaded
            return (
                <div className="min-h-screen bg-gradient-to-br from-red-100 to-red-300 py-10 px-4 sm:px-6">
                    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg text-center">
                        <h2 className="text-2xl font-bold text-red-700 mb-4">
                            Error Loading Group
                        </h2>
                        <p className="text-gray-600 mb-6">
                            We couldn&apos;t load the details for your group. It
                            might have been deleted, or there was a network
                            issue.
                        </p>
                        <p className="text-gray-600">
                            Please try refreshing the page. If the problem
                            persists, contact support.
                        </p>
                        {/* Optional: Add a button to try manually marking as ungrouped if stuck */}
                    </div>
                </div>
            );
        }

        // Render the grouped user's view (Your Group Info + Ungrouped Users for Invite)
        return (
            <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Display User's Current Group Info Here (Optional) */}
                    <div className="mb-8 p-6 bg-white rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Your Group: {userGroup.groupName}
                        </h2>
                        <p className="text-gray-600 mb-2">
                            Capacity: {userGroup.currentOccupancy} /{" "}
                            {userGroup.capacity}
                        </p>
                        {userGroup.description && (
                            <p className="text-gray-600 mb-4">
                                Description: {userGroup.description}
                            </p>
                        )}
                        {/* Maybe list current members simply here */}
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            Members:
                        </h3>
                        <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                            {groupMembers.map((member) => (
                                <li key={member.uid}>
                                    {member.name}{" "}
                                    {member.uid === currentUser.uid
                                        ? "(You)"
                                        : ""}{" "}
                                    {member.uid === userGroup.creatorId
                                        ? "(Leader)"
                                        : ""}
                                </li>
                            ))}
                        </ul>
                        {/* Leader actions can also go here */}
                        {currentUser.group_leader && (
                            <div className="mt-4 flex flex-col sm:flex-row gap-3 border-t pt-4">
                                {/* <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow transition duration-200">
                                     Edit Group Details
                                 </button> */}
                                {/* Delete/Remove actions might be better placed within DisplayUsers or a dedicated Manage section */}
                            </div>
                        )}
                    </div>

                    {/* Display Ungrouped Users using DisplayUsers Component */}
                    <DisplayUsers
                        users={ungroupedUsers}
                        onInviteUser={handleInviteUser}
                        currentUserIsLeader={currentUser.group_leader}
                        currentGroup={userGroup} // Pass group data
                        currentGroupMembers={groupMembers} // Pass full member data
                        onDeleteGroup={handleDeleteGroup} // Pass delete handler
                        onRemoveMember={handleRemoveMember} // Pass remove handler
                        currentUserId={currentUser.uid} // Pass current user's ID
                    />
                </div>
            </div>
        );
    }

    // --- Default View: Display for UNGROUPED Users (Recommended Groups) ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-400 to-blue-500 py-10 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Recommended Available Groups
                    </h1>
                    <p className="text-white text-opacity-80 max-w-2xl mx-auto">
                        Find the perfect housing group to join or create your
                        own to invite others.
                    </p>
                </div>

                {/* Search and filters */}
                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 mb-8 flex flex-wrap gap-4 items-center justify-between">
                    <div className="relative flex-grow max-w-md">
                        <input
                            type="text"
                            placeholder="Search groups..."
                            className="w-full py-2 px-4 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <select
                            className="py-2 px-4 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
                            value={capacityFilter}
                            onChange={(e) => setCapacityFilter(e.target.value)}
                        >
                            <option>All Capacities</option>
                            <option>2-4 People</option>
                            <option>5+ People</option>
                        </select>
                        <select
                            className="py-2 px-4 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
                            value={availabilityFilter}
                            onChange={(e) =>
                                setAvailabilityFilter(e.target.value)
                            }
                        >
                            <option>Any Availability</option>
                            <option>Has Open Spots</option>
                            <option>Full Groups</option>
                        </select>
                    </div>
                </div>

                {/* Loading state handled above */}

                {/* Group cards grid */}
                {!loading &&
                    !currentUser?.is_grouped && ( // Only show recommended if not loading and not grouped
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRecommendedGroups.map((group) => (
                                <div key={group.id} className="flex">
                                    {" "}
                                    {/* Ensure flex container takes full height */}
                                    <GroupCard
                                        // Pass necessary props from GroupData to GroupCard
                                        // Adjust GroupCard props if they differ from GroupData fields
                                        capacity={group.capacity}
                                        currentOccupancy={
                                            group.currentOccupancy
                                        }
                                        groupName={group.groupName}
                                        userCards={group.userCards} // Pass the simplified user cards
                                        colorScheme={group.colorScheme}
                                        //groupId={group.id} // Pass groupId if needed by GroupCard for actions
                                        // Add other props GroupCard might need
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                {/* No results message */}
                {!loading &&
                    !currentUser?.is_grouped &&
                    filteredRecommendedGroups.length === 0 && (
                        <div className="bg-white rounded-2xl shadow-lg p-8 text-center mt-8">
                            <h3 className="text-xl font-medium text-gray-700 mb-2">
                                No groups found
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Try adjusting your search criteria or create a
                                new group.
                            </p>
                        </div>
                    )}

                {/* Create new group button */}
                {!currentUser?.is_grouped && ( // Only show create if not grouped
                    <div className="mt-10 flex justify-center">
                        <Link
                            href={createGroupPath}
                            className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300"
                        >
                            + Create New Group
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
