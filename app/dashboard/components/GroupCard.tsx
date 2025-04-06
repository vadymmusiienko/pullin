import Image from "next/image";

// Define the type for the user card data
type UserCard = {
    id: string;
    name: string;
    year?: string;
    registrationTime?: string;
    avatar?: string;
};

// Define props for the GroupCard component
type GroupCardProps = {
    capacity: number;
    currentOccupancy: number;
    groupName: string;
    userCards: UserCard[];
    colorScheme?: "blue" | "green" | "purple" | "orange" | "pink";
};

const GroupCard: React.FC<GroupCardProps> = ({
    capacity,
    currentOccupancy,
    groupName,
    userCards,
    colorScheme = "blue",
}) => {
    // Color schemes
    const colorSchemes = {
        blue: {
            header: "bg-blue-600",
            button: "bg-blue-600 hover:bg-blue-700",
            avatarBg: "bg-blue-500",
        },
        green: {
            header: "bg-emerald-600",
            button: "bg-emerald-600 hover:bg-emerald-700",
            avatarBg: "bg-emerald-500",
        },
        purple: {
            header: "bg-indigo-600",
            button: "bg-indigo-600 hover:bg-indigo-700",
            avatarBg: "bg-indigo-500",
        },
        orange: {
            header: "bg-orange-500",
            button: "bg-orange-500 hover:bg-orange-600",
            avatarBg: "bg-orange-400",
        },
        pink: {
            header: "bg-pink-600",
            button: "bg-pink-600 hover:bg-pink-700",
            avatarBg: "bg-pink-500",
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
                        <span className={`font-medium text-${colorScheme}-600`}>
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
                <div className="space-y-3">
                    {userCards.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center p-3 bg-gray-50 rounded-xl hover:shadow-md transition-shadow duration-200 cursor-pointer"
                            //TODO: onClick={handleProfileClick}
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
                    <button
                        className={`w-full py-3 ${colors.button} text-white font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition duration-300 cursor-pointer`}
                    >
                        Request to Join Group
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupCard;
