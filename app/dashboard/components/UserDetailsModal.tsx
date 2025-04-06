import Image from "next/image";
import { UserData } from "../page"; // Adjust import path as needed

interface UserDetailsModalProps {
    user: UserData | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function UserDetailsModal({
    user,
    isOpen,
    onClose,
}: UserDetailsModalProps) {
    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-opacity-100 z-50 flex items-center justify-center p-4 shadow-lg">
            <div className="bg-white rounded-lg max-w-md w-full max-h-90vh overflow-y-auto border border-gray-300 shadow-lg">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-900">
                            {user.name}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <span className="sr-only">Close</span>
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Profile image */}
                    {user.pfpUrl && (
                        <div className="flex justify-center mb-4">
                            <Image
                                src={user.pfpUrl}
                                alt={`${user.name}'s profile`}
                                className="h-24 w-24 rounded-full object-cover"
                            />
                        </div>
                    )}

                    {/* User details */}
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                School
                            </p>
                            <p className="text-gray-900">{user.school}</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Graduation Year
                            </p>
                            <p className="text-gray-900">
                                Class of {user.graduationYear}
                            </p>
                        </div>

                        {user.bio && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Bio
                                </p>
                                <p className="text-gray-900">{user.bio}</p>
                            </div>
                        )}

                        {user.interests && user.interests.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Interests
                                </p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {user.interests.map((interest, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                        >
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {user.instagramHandle && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Instagram
                                </p>
                                <p className="text-gray-900">
                                    @{user.instagramHandle}
                                </p>
                            </div>
                        )}

                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Contact
                            </p>
                            <p className="text-gray-900">{user.email}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
