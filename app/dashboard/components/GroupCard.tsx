import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Calendar, Instagram } from "lucide-react";

// Enhanced type for user cards with additional information
type UserCard = {
    id: string;
    name: string;
    year?: string;
    registrationTime?: string;
    avatar?: string;
    // Additional fields for expanded view
    bio?: string;
    interests?: string[];
    // Removed major field
    contactInfo?: string;
    joinedDate?: string;
    instagramHandle?: string; // Added Instagram handle
};

// Define props for the GroupCard component
type GroupCardProps = {
    capacity: number;
    currentOccupancy: number;
    groupName: string;
    userCards: UserCard[];
    colorScheme?: "blue" | "green" | "purple" | "orange" | "pink";
    groupId: string;
    onRequestJoin: (groupId: string) => void;
    isPending?: boolean;
};

const GroupCard: React.FC<GroupCardProps> = ({
    capacity,
    currentOccupancy,
    groupName,
    userCards,
    colorScheme = "blue",
    groupId,
    onRequestJoin,
    isPending = false,
}) => {
    // Track which user card is expanded
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const expandedContentRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    // Toggle expanded state for a user
    const toggleUserExpand = (userId: string) => {
        if (expandedUserId === userId) {
            setExpandedUserId(null);
        } else {
            setExpandedUserId(userId);
        }
    };

    // Close expanded card when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                cardRef.current &&
                !cardRef.current.contains(event.target as Node)
            ) {
                setExpandedUserId(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Color schemes
    const colorSchemes = {
        blue: {
            header: "bg-blue-600",
            button: "bg-blue-600 hover:bg-blue-700",
            avatarBg: "bg-blue-500",
            tagBg: "bg-blue-100",
            tagText: "text-blue-700",
        },
        green: {
            header: "bg-emerald-600",
            button: "bg-emerald-600 hover:bg-emerald-700",
            avatarBg: "bg-emerald-500",
            tagBg: "bg-emerald-100",
            tagText: "text-emerald-700",
        },
        purple: {
            header: "bg-indigo-600",
            button: "bg-indigo-600 hover:bg-indigo-700",
            avatarBg: "bg-indigo-500",
            tagBg: "bg-indigo-100",
            tagText: "text-indigo-700",
        },
        orange: {
            header: "bg-orange-500",
            button: "bg-orange-500 hover:bg-orange-600",
            avatarBg: "bg-orange-400",
            tagBg: "bg-orange-100",
            tagText: "text-orange-700",
        },
        pink: {
            header: "bg-pink-600",
            button: "bg-pink-600 hover:bg-pink-700",
            avatarBg: "bg-pink-500",
            tagBg: "bg-pink-100",
            tagText: "text-pink-700",
        },
    };

    const colors = colorSchemes[colorScheme];

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full">
            <div className={`${colors.header} p-4`}>
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">
                        {groupName}
                    </h3>
                    <div className="bg-white rounded-lg px-3 py-1">
                        <span
                            className="font-medium"
                            style={{ color: `var(--${colorScheme}-600)` }}
                        >
                            {currentOccupancy}/{capacity} Members
                        </span>
                    </div>
                </div>
            </div>

            {/* Group members section */}
            <div className="p-6">
                <h4 className="text-gray-700 font-semibold mb-4">
                    Group Members
                </h4>

                {/* Member cards */}
                <div className="space-y-4">
                    {userCards.map((user) => (
                        <div
                            key={user.id}
                            ref={expandedUserId === user.id ? cardRef : null}
                            className={`bg-gray-50 rounded-xl transition-all duration-300 relative ${
                                expandedUserId === user.id
                                    ? "shadow-md z-10"
                                    : "hover:shadow-md"
                            }`}
                        >
                            {/* Clickable header */}
                            <div
                                onClick={() => toggleUserExpand(user.id)}
                                className="flex items-center p-3 cursor-pointer"
                            >
                                {/* Avatar */}
                                <div
                                    className={`h-12 w-12 rounded-full ${colors.avatarBg} flex items-center justify-center mr-4`}
                                >
                                    {user.avatar ? (
                                        <div className="relative h-12 w-12 rounded-full overflow-hidden">
                                            <Image
                                                src={user.avatar}
                                                alt={user.name}
                                                fill
                                                sizes="48px"
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-white font-medium text-lg">
                                            {user.name.charAt(0)}
                                        </span>
                                    )}
                                </div>

                                {/* User info */}
                                <div className="flex-1">
                                    <h5 className="font-medium text-gray-800">
                                        {user.name}
                                    </h5>
                                    <div className="flex text-sm text-gray-500">
                                        {user.year && (
                                            <span className="mr-4">
                                                {user.year}
                                            </span>
                                        )}
                                        {user.registrationTime && (
                                            <span>
                                                Registration:{" "}
                                                {user.registrationTime}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Expand/collapse indicator */}
                                <div className="text-gray-400">
                                    {expandedUserId === user.id ? (
                                        <ChevronUp size={20} />
                                    ) : (
                                        <ChevronDown size={20} />
                                    )}
                                </div>
                            </div>

                            {/* Expanded user details - Now using absolute positioning */}
                            {expandedUserId === user.id && (
                                <div
                                    ref={expandedContentRef}
                                    className="absolute left-0 right-0 z-20 px-4 pb-4 mt-1 pt-3 border-t border-gray-200 bg-gray-50 rounded-b-xl shadow-lg"
                                >
                                    {/* Bio section */}
                                    {user.bio && (
                                        <div className="mb-3">
                                            <p className="text-xs text-gray-500 mb-1">
                                                About
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                {user.bio}
                                            </p>
                                        </div>
                                    )}

                                    {/* Interests */}
                                    {user.interests &&
                                        user.interests.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-xs text-gray-500 mb-1">
                                                    Interests
                                                </p>
                                                <div className="flex flex-wrap gap-1">
                                                    {user.interests.map(
                                                        (interest, index) => (
                                                            <span
                                                                key={index}
                                                                className={`${colors.tagBg} ${colors.tagText} text-xs px-2 py-1 rounded-full`}
                                                            >
                                                                {interest}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {/* Additional info - Changed to stacked layout */}
                                    <div className="flex flex-col gap-3 text-sm">
                                        {user.contactInfo && (
                                            <div className="flex items-center text-gray-700">
                                                <span className="font-medium mr-2">
                                                    Contact:
                                                </span>
                                                <span>{user.contactInfo}</span>
                                            </div>
                                        )}

                                        {user.instagramHandle && (
                                            <div className="flex items-center text-gray-700">
                                                <Instagram
                                                    size={16}
                                                    className="mr-2"
                                                />
                                                <span>
                                                    {user.instagramHandle}
                                                </span>
                                            </div>
                                        )}

                                        {user.joinedDate && (
                                            <div className="flex items-center text-gray-700">
                                                <Calendar
                                                    size={16}
                                                    className="mr-2"
                                                />
                                                <span>
                                                    Joined: {user.joinedDate}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Empty slots indicator */}
                {currentOccupancy < capacity && (
                    <div className="mt-4 p-3 border-2 border-dashed border-gray-300 rounded-xl flex justify-center items-center text-gray-500">
                        {capacity - currentOccupancy}{" "}
                        {capacity - currentOccupancy === 1 ? "spot" : "spots"}{" "}
                        remaining
                    </div>
                )}

                {/* Request to join button */}
                <div className="mt-6">
                    {currentOccupancy < capacity ? (
                        <button
                            onClick={() => onRequestJoin(groupId)}
                            disabled={isPending}
                            className={`w-full py-2 rounded-lg text-white transition-colors ${
                                isPending
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : `${colors.button}`
                            }`}
                        >
                            {isPending ? "Request Pending" : "Request to Join"}
                        </button>
                    ) : (
                        <button
                            disabled
                            className="w-full py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                        >
                            Group Full
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupCard;
