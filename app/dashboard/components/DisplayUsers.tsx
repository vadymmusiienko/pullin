// ./components/DisplayUsers.tsx (or your chosen path)
"use client";

import React from "react";
import UserCard from "./UserCard"; // Adjust path as needed
import { UserData, GroupData } from "../page"; // Import interfaces from Dashboard page, adjust path!

interface DisplayUsersProps {
    users: UserData[]; // Ungrouped users to display for potential invites
    onInviteUser: (userId: string) => void;
    currentUserIsLeader: boolean;
    currentGroup: GroupData | null; // The current user's group data
    currentGroupMembers: UserData[]; // Full data of members in the current group
    onDeleteGroup: (groupId: string) => void;
    onRemoveMember: (memberId: string) => void;
    currentUserId: string; // ID of the logged-in user
}

const DisplayUsers: React.FC<DisplayUsersProps> = ({
    users,
    onInviteUser,
    currentUserIsLeader,
    currentGroup,
    currentGroupMembers,
    onDeleteGroup,
    onRemoveMember,
    currentUserId,
}) => {
    const handleRemoveClick = (memberId: string, memberName: string) => {
        if (
            confirm(
                `Are you sure you want to remove ${memberName} from the group?`
            )
        ) {
            onRemoveMember(memberId);
        }
    };

    const handleDeleteClick = () => {
        if (
            currentGroup &&
            confirm(
                `Are you sure you want to permanently delete the group "${currentGroup.groupName}"? This action cannot be undone and will remove all members.`
            )
        ) {
            onDeleteGroup(currentGroup.id);
        }
    };

    return (
        <div className="space-y-8">
            {/* Section for Group Leader Management */}
            {currentUserIsLeader && currentGroup && (
                <div className="p-6 bg-white rounded-xl shadow-lg border border-red-200">
                    <h2 className="text-xl font-bold text-red-700 mb-4">
                        Group Leader Actions
                    </h2>
                    <div className="space-y-4">
                        {/* Manage Members */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                Manage Members
                            </h3>
                            {currentGroupMembers.length > 1 ? (
                                <ul className="space-y-2">
                                    {currentGroupMembers
                                        .filter(
                                            (member) =>
                                                member.uid !== currentUserId
                                        ) // Don't list option to remove self
                                        .map((member) => (
                                            <li
                                                key={member.uid}
                                                className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                            >
                                                <span>{member.name}</span>
                                                <button
                                                    onClick={() =>
                                                        handleRemoveClick(
                                                            member.uid,
                                                            member.name
                                                        )
                                                    }
                                                    className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded shadow transition duration-200"
                                                >
                                                    Remove
                                                </button>
                                            </li>
                                        ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 italic">
                                    You are the only member.
                                </p>
                            )}
                        </div>

                        {/* Delete Group */}
                        <div className="border-t pt-4">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                Delete Group
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                Permanently delete this group and remove all
                                members. This cannot be undone.
                            </p>
                            <button
                                onClick={handleDeleteClick}
                                className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform transition duration-200"
                            >
                                Delete Group Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Section to Invite Ungrouped Users */}
            <div className="p-6 bg-white rounded-xl shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    {currentUserIsLeader
                        ? "Invite Users to Your Group"
                        : "Available Users"}{" "}
                    {/* Adjust title based on role */}
                </h2>
                {users.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.map((user) => (
                            <UserCard
                                key={user.uid}
                                id={user.uid}
                                name={user.name}
                                year={`Class of ${user.graduationYear}`} // Format year
                                school={user.school}
                                interests={user.interests || []} // Handle potential undefined interests
                                bio={user.bio}
                                pfpUrl={user.pfpUrl}
                                onInvite={onInviteUser} // Pass the handler to UserCard's onInvite prop
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">
                        No ungrouped users found to invite.
                    </p>
                )}
            </div>
        </div>
    );
};

export default DisplayUsers;
