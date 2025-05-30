"use client";

import { useState, useEffect } from "react";
import UserDetailsModal from "./components/UserDetailsModal";
import {
    collection,
    query,
    limit,
    getDocs,
    doc,
    getDoc,
    Timestamp,
    where,
    writeBatch,
    //deleteDoc,
    arrayRemove,
    deleteField,
    serverTimestamp,
    arrayUnion,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase/firebaseConfig";
import GroupCard from "./components/GroupCard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Loading from "../components/loading";

// Define type for color schemes to match the expected values
type ColorScheme = "blue" | "green" | "purple" | "orange" | "pink";

// Interface for minimal user data within a group card
export interface GroupMemberCard {
    id: string;
    name: string;
    year?: string;
    registrationTime?: string;
    pfp?: string;
    bio?: string;
    interests?: string[];
    contactInfo?: string;
    joinedDate?: string;
    instagramHandle?: string; // Optional Instagram handle
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
    pendingUsers?: string[]; // Optional pending users
    // Add other group fields if they exist
}

// Interface for full User Data fetched from Firestore
export interface UserData {
    name: string;
    email: string;
    bio?: string;
    graduationYear: number;
    group_leader: boolean;
    interests?: string[];
    is_grouped: boolean;
    registrationTime?: string; // Make optional if not always present
    school: string;
    uid: string;
    pfpUrl?: string; // Optional profile picture
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    groupId?: string; // Add groupId if user document stores it
    pendingRequests?: string[]; // Array of group IDs the user has requested to join
    instagramHandle?: string; // Optional Instagram handle
}

export default function Dashboard() {
    const router = useRouter();
    const createGroupPath = "/create_group";
    const [recommendedGroups, setRecommendedGroups] = useState<GroupData[]>([]); // Renamed for clarity
    const [userGroup, setUserGroup] = useState<GroupData | null>(null); // State for the user's current group
    const [ungroupedUsers, setUngroupedUsers] = useState<UserData[]>([]); // State for users not in a group
    const [groupMembers, setGroupMembers] = useState<UserData[]>([]); // State for members of the user's group
    const [loading, setLoading] = useState(true);
    const [loadingGroupView, setLoadingGroupView] = useState(true); // Separate loading for grouped view
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [userSearchTerm, setUserSearchTerm] = useState(""); // New state for user search
    const [capacityFilter, setCapacityFilter] = useState("All Capacities");
    const [availabilityFilter, setAvailabilityFilter] =
        useState("Any Availability");

    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);

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
                    setCurrentUser(null);
                    setRecommendedGroups([]);
                    setUserGroup(null);
                    setUngroupedUsers([]);
                    setGroupMembers([]);
                    setLoadingGroupView(false);
                    router.replace("/signin");
                }
            });

            return unsubscribe; // Return the unsubscribe function
        };

        const unsubscribePromise = fetchUserData();

        // Cleanup subscription on unmount
        return () => {
            unsubscribePromise.then((unsubscribe) => unsubscribe());
        };
    }, []);

    useEffect(() => {
        const runFetch = async () => {
            if (!currentUser) return;

            if (currentUser.is_grouped) {
                await fetchUserGroupData(currentUser);
            } else {
                await fetchRecommendedGroups();
                setLoadingGroupView(false);
            }
        };

        runFetch();
    }, [currentUser]);

    // --- Function to handle user click on profile card ---
    // Add a function to handle user clicks
    const handleUserClick = (user: UserData) => {
        setSelectedUser(user);
        setShowUserDetailsModal(true);
    };

    // Add a function to close the modal
    const closeUserDetailsModal = () => {
        setShowUserDetailsModal(false);
        setSelectedUser(null);
    };

    // --- Function to handle requests to joing a group ---
    const handleRequestToJoinGroup = async (groupId: string) => {
        if (!currentUser) {
            console.error("User must be logged in to request joining a group");
            alert("Please log in to request joining a group");
            return;
        }
        if (currentUser.is_grouped) {
            console.error("User is already in a group");
            alert(
                "You are already in a group. Leave your current group to join another one."
            );
            return;
        }
        try {
            // Get the group data to access necessary information
            const groupDocRef = doc(db, "groups", groupId);
            const groupDoc = await getDoc(groupDocRef);
            if (!groupDoc.exists()) {
                console.error("Group not found");
                alert("This group no longer exists");
                return;
            }
            const groupData = groupDoc.data();
            // Check if group is already full
            if (
                groupData.members &&
                groupData.members.length >= groupData.capacity
            ) {
                console.error("Group is already full");
                alert("This group is already at full capacity");
                return;
            }
            // Check if user already has a pending request to this group using the user's array
            if (
                currentUser.pendingRequests &&
                currentUser.pendingRequests.includes(groupId)
            ) {
                console.warn(
                    "A pending request potentially exists (checked via user.pendingRequests array)"
                );
                alert("You already have a pending request to join this group");
                return;
            }
            // Create a batch to ensure operations are atomic
            const batch = writeBatch(db);
            // Prepare the request document data
            const requestData = {
                userid: currentUser.uid,
                nameuser: currentUser.name,
                GroupId: groupId,
                GroupName: groupData.groupName,
                GroupLeaderId: groupData.creatorId,
                status: "pending",
                createdAt: serverTimestamp(),
                fromGroup: false,
                hasSeen: false,
            };
            // Create a new request document in the 'requests' collection
            const newRequestRef = doc(collection(db, "requests"));
            batch.set(newRequestRef, requestData);
            // Update the user's pendingRequests array in the 'users' collection
            const userDocRef = doc(db, "users", currentUser.uid);
            batch.update(userDocRef, {
                pendingRequests: arrayUnion(groupId),
            });

            // Update the group's pendingUsers array
            batch.update(groupDocRef, {
                pendingUsers: arrayUnion(currentUser.uid),
            });

            // Commit all batched operations
            await batch.commit();
            alert("Your request to join the group has been sent!");
            // Update *local* current user state to include the new pending request
            // for immediate UI feedback.
            setCurrentUser({
                ...currentUser,
                // Ensure pendingRequests array exists before spreading/adding
                pendingRequests: [
                    ...(currentUser.pendingRequests || []),
                    groupId,
                ],
            });
            // Update the UI to reflect changes (e.g., refresh list of groups)
            await fetchRecommendedGroups();
        } catch (error) {
            console.error("Error sending join request:", error);
            alert("Failed to send join request. Please try again.");
        }
    };

    // --- Function to Fetch Recommended Groups ---
    const fetchRecommendedGroups = async () => {
        if (!currentUser || !currentUser.school) return;

        try {
            const groupsQuery = query(
                collection(db, "groups"),
                where("school", "==", currentUser.school),
                limit(6) // Fetch a limited number for recommendations
            );
            const groupsSnapshot = await getDocs(groupsQuery);
            const groupsDataPromises = groupsSnapshot.docs.map(
                async (groupDoc) => {
                    const groupData = groupDoc.data();

                    // 1. Fetch the full UserData for members
                    const memberDetails: UserData[] =
                        await fetchGroupMemberDetails(groupData.members || []);

                    // 2. Map UserData[] to GroupMemberCard[] with all the expanded fields
                    const groupMemberCards: GroupMemberCard[] =
                        memberDetails.map((member) => ({
                            id: member.uid,
                            name: member.name,
                            year: `Class of ${member.graduationYear}`,
                            registrationTime: member.registrationTime || "",
                            pfpUrl: member.pfpUrl || "",
                            bio: member.bio || "",
                            interests: member.interests || [],
                            contactInfo: member.email,
                            joinedDate: member.createdAt
                                ? member.createdAt
                                      .toDate()
                                      .toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                      })
                                : "",
                            instagramHandle: member.instagramHandle || "",
                        }));

                    // 3. Construct the final object conforming to GroupData
                    const resultData: GroupData = {
                        id: groupDoc.id,
                        capacity: groupData.capacity,
                        currentOccupancy: (groupData.members || []).length,
                        groupName: groupData.groupName,
                        colorScheme: getColorScheme(groupDoc.id),
                        userCards: groupMemberCards,
                        creatorId: groupData.creatorId,
                        members: groupData.members || [],
                        description: groupData.description,
                        pendingUsers: groupData.pendingUsers || [],
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
                pendingUsers: groupData.pendingUsers || [], // Make sure to include pendingUsers
            };

            setUserGroup(userGroupData);
            setGroupMembers(memberDetails); // Keep storing full data separately if needed

            const usersCollectionRef = collection(db, "users"); // Get reference to 'users' collection

            // First, get all ungrouped users
            const ungroupedUsersQuery = query(
                usersCollectionRef,
                where("is_grouped", "==", false),
                where("school", "==", groupData.school),
                limit(20)
            );
            const ungroupedSnapshot = await getDocs(ungroupedUsersQuery);

            // Convert to UserData array
            const ungroupedUsersData = ungroupedSnapshot.docs.map(
                (doc) => ({ uid: doc.id, ...doc.data() } as UserData)
            );

            // Filter out users who have pending invitations
            const pendingUserIds = groupData.pendingUsers || [];
            const filteredUngroupedUsers = ungroupedUsersData.filter(
                (user) => !pendingUserIds.includes(user.uid)
            );

            setUngroupedUsers(filteredUngroupedUsers); // Set state with filtered users
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
        // Search term filter - convert to lowercase for case-insensitive comparison
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

    // Filter ungrouped users based on the search term
    const filteredUngroupedUsers = ungroupedUsers.filter((user) => {
        if (userSearchTerm === "") return true;

        const searchTermLower = userSearchTerm.toLowerCase();
        const fullName = user.name.toLowerCase();

        // Check for match in full name
        if (fullName.includes(searchTermLower)) return true;

        // Check for match in last name (if there's a space in the name)
        const nameParts = fullName.split(" ");
        if (nameParts.length > 1) {
            // Get last name (everything after the first space)
            const lastName = fullName.substring(fullName.indexOf(" ") + 1);
            if (lastName.includes(searchTermLower)) return true;
        }

        return false;
    });

    // Check if a group is in the user's pending requests
    const isGroupRequestPending = (groupId: string) => {
        return currentUser?.pendingRequests?.includes(groupId) || false;
    };

    const handleInviteUser = async (userIdToInvite: string) => {
        if (!userGroup || !currentUser) {
            console.error("Cannot invite: group or current user data missing.");
            alert("Error: Missing group data.");
            return;
        }

        // Check if user is authorized to invite
        if (!currentUser.group_leader) {
            console.error("Only group leaders can invite new members.");
            alert("Error: Only group leaders can invite new members.");
            return;
        }

        // Check if group has space
        if (userGroup.currentOccupancy >= userGroup.capacity) {
            console.warn("Cannot invite: Group is full.");
            alert("Cannot invite: Group is already full.");
            return;
        }

        // Check if user is already in this group
        if (userGroup.members.includes(userIdToInvite)) {
            console.warn("Cannot invite: User is already in the group.");
            alert("User is already in this group.");
            return;
        }

        try {
            // Check if there's already a pending invite for this user
            const groupDocRef = doc(db, "groups", userGroup.id);
            const groupDoc = await getDoc(groupDocRef);
            const groupData = groupDoc.data();

            // Check if pendingUsers array exists and if the user is already invited
            if (
                groupData?.pendingUsers &&
                groupData?.pendingUsers.includes(userIdToInvite)
            ) {
                console.warn("This user already has a pending invitation.");
                alert(
                    "This user already has a pending invitation to your group."
                );
                return;
            }

            // Check if there's already a pending request in the requests collection
            const requestsCollection = collection(db, "requests");
            const existingRequestsQuery = query(
                requestsCollection,
                where("recipientGroupId", "==", userGroup.id),
                where("recipientUserId", "==", userIdToInvite),
                where("status", "==", "pending")
            );

            const existingRequestsSnapshot = await getDocs(
                existingRequestsQuery
            );

            if (!existingRequestsSnapshot.empty) {
                console.warn("A pending invite already exists for this user.");
                alert("There's already a pending invitation for this user.");
                return;
            }

            // Create a batch to ensure both operations succeed or fail together
            const batch = writeBatch(db);

            // Update the group's pendingUsers array
            batch.update(groupDocRef, {
                pendingUsers: arrayUnion(userIdToInvite),
            });

            const userToInviteRef = doc(db, "users", userIdToInvite);
            const userToInviteSnap = await getDoc(userToInviteRef);

            if (!userToInviteSnap.exists()) {
                throw new Error("User to invite not found");
            }
            const userToInviteData = userToInviteSnap.data();

            // Prepare the request document data
            const requestData = {
                GroupId: userGroup.id,
                GroupName: userGroup.groupName,
                GroupLeaderId: userGroup.creatorId,
                userid: userIdToInvite,
                status: "pending",
                createdAt: serverTimestamp(),
                fromGroup: true,
                hasSeen: false,
                nameuser: userToInviteData.name,
            };

            // Create a new request document reference
            const newRequestRef = doc(collection(db, "requests"));
            batch.set(newRequestRef, requestData);

            // Commit the batch
            await batch.commit();

            console.log(
                `Invitation sent successfully with ID: ${newRequestRef.id}`
            );
            alert("Invitation sent successfully!");

            // Update the local state to reflect the pending invitation
            setUserGroup({
                ...userGroup,
                pendingUsers: [
                    ...(userGroup.pendingUsers || []),
                    userIdToInvite,
                ],
            });

            // Remove the invited user from the displayed list of ungrouped users
            setUngroupedUsers(
                ungroupedUsers.filter((user) => user.uid !== userIdToInvite)
            );
        } catch (error) {
            console.error("Error sending invitation:", error);
            alert("Failed to send invitation. Please try again.");
        }
    };

    const handleLeaveGroup = async (groupId: string) => {
        if (!currentUser || !userGroup || userGroup.id !== groupId) {
            console.error("Unauthorized or incorrect group ID for deletion.");
            alert("Error: You are not authorized to leave this group.");
            return;
        }

        if (
            !confirm(
                `Are you sure you want to leave the group "${userGroup.groupName}"?`
            )
        ) {
            return;
        }

        try {
            setLoading(true);
            const batch = writeBatch(db);
            const groupRef = doc(db, "groups", groupId);
            const userRef = doc(db, "users", currentUser.uid);

            // Update user document to mark as ungrouped
            batch.update(userRef, {
                is_grouped: false,
                group_leader: false,
                groupId: deleteField(), // Remove the groupId field
            });

            // Remove user from group members array
            batch.update(groupRef, {
                members: arrayRemove(currentUser.uid),
            });

            // If user is the group leader and there are other members, assign new leader
            if (currentUser.group_leader && userGroup.members.length > 1) {
                // Find another member that's not the current user
                const otherMembers = userGroup.members.filter(
                    (memberId) => memberId !== currentUser.uid
                );
                // Select random member as new leader
                const newLeaderId =
                    otherMembers[
                        Math.floor(Math.random() * otherMembers.length)
                    ];
                const newLeaderRef = doc(db, "users", newLeaderId);

                // Update group document with new creator
                batch.update(groupRef, {
                    creatorId: newLeaderId,
                });

                // Update the new leader's user document
                batch.update(newLeaderRef, {
                    group_leader: true,
                });
            }
            // If this was the last member, delete the group
            else if (userGroup.members.length <= 1) {
                // Delete the group document instead of updating it
                batch.delete(groupRef);
            }

            // Commit all the batched writes
            await batch.commit();

            // Refresh the UI - we can use the existing fetchRecommendedGroups since the user is now ungrouped
            setUserGroup(null);
            setGroupMembers([]);
            await fetchRecommendedGroups();

            // Update the current user data to reflect the changes
            setCurrentUser({
                ...currentUser,
                is_grouped: false,
                group_leader: false,
                groupId: undefined,
            });
        } catch (error) {
            console.error("Error leaving group:", error);
            alert("Failed to leave the group. Please try again.");
        } finally {
            setLoading(false);
        }
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

        const batch = writeBatch(db);
        const groupRef = doc(db, "groups", userGroup.id);
        const memberToRemoveRef = doc(db, "users", memberIdToRemove);

        batch.update(groupRef, {
            members: arrayRemove(memberIdToRemove),
        });
        batch.update(memberToRemoveRef, {
            is_grouped: false,
            groupId: deleteField(),
        });

        try {
            await batch.commit();
            console.log("Member removed successfully!");
            // Refresh data
            fetchUserGroupData(currentUser);
        } catch (error) {
            console.error("Error removing member:", error);
            alert("Failed to remove member. Please try again.");
        }
    };

    // --- Render Logic ---

    // Loading state for initial user check or recommended groups
    if (loading) {
        return <Loading loadingText="loading dashboard..." />;
    }

    // --- Display for Grouped Users ---
    if (currentUser?.is_grouped) {
        // Loading state specifically for the grouped user's view data
        if (loadingGroupView) {
            return <Loading loadingText="loading your group..." />;
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
            <div className="min-h-screen bg-gradient-to-br from-teal-400 to-blue-500 py-10 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-10 text-center">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Your Housing Group
                        </h1>
                        <p className="text-white text-opacity-80 max-w-2xl mx-auto">
                            Manage your group and invite new members to join.
                        </p>
                    </div>

                    {/* Group Info Card */}
                    <div className="mb-8 bg-white bg-opacity-95 rounded-xl shadow-lg overflow-hidden">
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                        {userGroup.groupName}
                                    </h2>
                                    <div className="flex items-center space-x-4 mb-4">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                            {userGroup.currentOccupancy} /{" "}
                                            {userGroup.capacity} Members
                                        </span>
                                        {currentUser.group_leader && (
                                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                                Group Leader
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 md:mt-0">
                                    <button
                                        onClick={() =>
                                            handleLeaveGroup(userGroup.id)
                                        }
                                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow transition duration-200"
                                    >
                                        Leave Group
                                    </button>
                                </div>
                            </div>

                            {userGroup.description && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                    <h3 className="text-md font-semibold text-gray-700 mb-2">
                                        About Our Group
                                    </h3>
                                    <p className="text-gray-600">
                                        {userGroup.description}
                                    </p>
                                </div>
                            )}

                            {/* Group Members */}
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">
                                    Group Members
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groupMembers.map((member) => (
                                        <div
                                            key={member.uid}
                                            className="flex items-center p-3 bg-gray-50 rounded-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300 cursor-pointer"
                                        >
                                            <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold mr-3">
                                                {member.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                            <div className="flex-grow">
                                                <div className="font-medium">
                                                    {member.name}
                                                    {member.uid ===
                                                        currentUser.uid && (
                                                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                                            You
                                                        </span>
                                                    )}
                                                    {member.uid ===
                                                        userGroup.creatorId && (
                                                        <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                                            Leader
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Class of{" "}
                                                    {member.graduationYear}
                                                </div>
                                            </div>
                                            {currentUser.group_leader &&
                                                member.uid !==
                                                    currentUser.uid && (
                                                    <button
                                                        onClick={() =>
                                                            handleRemoveMember(
                                                                member.uid
                                                            )
                                                        }
                                                        className="text-red-500 hover:text-red-700 transition-colors"
                                                        title="Remove member"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-5 w-5"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </button>
                                                )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invitations Section */}
                    <div className="bg-white bg-opacity-95 rounded-xl shadow-lg overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                {userGroup.currentOccupancy < userGroup.capacity
                                    ? "Invite New Members"
                                    : "Group is Full"}
                            </h2>

                            {/* Allow search and filtering of ungrouped users */}
                            {userGroup.currentOccupancy <
                                userGroup.capacity && (
                                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search for users to invite..."
                                            className="w-full py-2 px-4 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                            value={userSearchTerm}
                                            onChange={(e) =>
                                                setUserSearchTerm(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            {userGroup.currentOccupancy >=
                            userGroup.capacity ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                                    <p className="text-yellow-700">
                                        Your group has reached maximum capacity.
                                        To invite new members, someone must
                                        leave first.
                                    </p>
                                </div>
                            ) : ungroupedUsers.length === 0 ? (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                    <p className="text-gray-600">
                                        No users available to invite at the
                                        moment.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    {/* Ungrouped Users Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredUngroupedUsers.map((user) => (
                                            <div
                                                key={user.uid}
                                                onClick={() =>
                                                    handleUserClick(user)
                                                }
                                                className="border border-gray-200 rounded-lg p-4 flex items-center hover:shadow-xl transform hover:-translate-y-1 transition duration-300 cursor-pointer"
                                            >
                                                <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold mr-3">
                                                    {user.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="font-medium text-gray-900">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Class of{" "}
                                                        {user.graduationYear}
                                                    </div>
                                                    {user.interests &&
                                                        user.interests.length >
                                                            0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {user.interests
                                                                    .slice(0, 2)
                                                                    .map(
                                                                        (
                                                                            interest,
                                                                            idx
                                                                        ) => (
                                                                            <span
                                                                                key={
                                                                                    idx
                                                                                }
                                                                                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                                                                            >
                                                                                {
                                                                                    interest
                                                                                }
                                                                            </span>
                                                                        )
                                                                    )}
                                                                {user.interests
                                                                    .length >
                                                                    2 && (
                                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                                        +
                                                                        {user
                                                                            .interests
                                                                            .length -
                                                                            2}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        handleInviteUser(
                                                            user.uid
                                                        )
                                                    }
                                                    className="ml-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition duration-200"
                                                >
                                                    Invite
                                                </button>
                                            </div>
                                        ))}
                                        {/* Add the modal to your JSX */}
                                        <UserDetailsModal
                                            user={selectedUser}
                                            isOpen={showUserDetailsModal}
                                            onClose={closeUserDetailsModal}
                                        />
                                    </div>

                                    {/* Add pagination controls if needed */}
                                </div>
                            )}
                        </div>
                    </div>
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
                                        capacity={group.capacity}
                                        currentOccupancy={
                                            group.currentOccupancy
                                        }
                                        groupName={group.groupName}
                                        userCards={group.userCards}
                                        colorScheme={group.colorScheme}
                                        groupId={group.id} // Pass the group ID
                                        onRequestJoin={handleRequestToJoinGroup} // Pass the handler
                                        isPending={isGroupRequestPending(
                                            group.id
                                        )}
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
