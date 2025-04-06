"use client";

import Image from "next/image";

interface UserCardProps {
    id: string;
    name: string;
    year: string;
    school: string;
    interests: string[];
    bio: string;
    pfpUrl?: string;
    onInvite: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({
    id,
    name,
    year,
    school,
    interests,
    bio,
    pfpUrl,
    onInvite,
}) => {
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="p-6 flex flex-col flex-grow">
                {/* User avatar and info */}
                <div className="flex items-center mb-4">
                    <div className="h-14 w-14 rounded-full overflow-hidden bg-gray-200 mr-4">
                        {pfpUrl ? (
                            <Image
                                src={pfpUrl}
                                alt={`${name}'s profile`}
                                width={56}
                                height={56}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 text-xl font-bold">
                                {name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">
                            {name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                            {year} • {school}
                        </p>
                    </div>
                </div>

                {/* User bio */}
                <div className="mb-4 flex-grow">
                    <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                        {bio}
                    </p>
                </div>

                {/* Interests */}
                {interests.length > 0 && (
                    <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Interests</p>
                        <div className="flex flex-wrap gap-1">
                            {interests.slice(0, 3).map((interest, index) => (
                                <span
                                    key={index}
                                    className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full"
                                >
                                    {interest}
                                </span>
                            ))}
                            {interests.length > 3 && (
                                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                                    +{interests.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Invite button */}
            <div className="px-6 pb-6">
                <button
                    onClick={() => onInvite(id)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform transition duration-200"
                >
                    Invite to Group
                </button>
            </div>
        </div>
    );
};

export default UserCard;
