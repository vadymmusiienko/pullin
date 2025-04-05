import GroupCard from "./components/GroupCard";

// TODO: Mock data for groups
const mockGroups = [
    {
        id: "group1",
        capacity: 4,
        currentOccupancy: 2,
        groupName: "The Awesome Suite",
        colorScheme: "blue" as const,
        userCards: [
            {
                id: "user1",
                name: "Alex Johnson",
                year: "Sophomore",
                registrationTime: "April 10, 9:30 AM",
            },
            {
                id: "user2",
                name: "Jamie Smith",
                year: "Junior",
                registrationTime: "April 9, 10:15 AM",
            },
        ],
    },
    {
        id: "group2",
        capacity: 6,
        currentOccupancy: 4,
        groupName: "Mountaintop View",
        colorScheme: "green" as const,
        userCards: [
            {
                id: "user3",
                name: "Taylor Wilson",
                year: "Senior",
                registrationTime: "April 7, 8:00 AM",
            },
            {
                id: "user4",
                name: "Jordan Lee",
                year: "Junior",
                registrationTime: "April 8, 11:45 AM",
            },
            {
                id: "user5",
                name: "Casey Rivera",
                year: "Sophomore",
                registrationTime: "April 10, 2:30 PM",
            },
            {
                id: "user6",
                name: "Morgan Chen",
                year: "Senior",
                registrationTime: "April 7, 9:15 AM",
            },
        ],
    },
    {
        id: "group3",
        capacity: 3,
        currentOccupancy: 1,
        groupName: "Sunset Corner",
        colorScheme: "purple" as const,
        userCards: [
            {
                id: "user7",
                name: "Riley Thompson",
                year: "Junior",
                registrationTime: "April 9, 1:00 PM",
            },
        ],
    },
    {
        id: "group4",
        capacity: 5,
        currentOccupancy: 3,
        groupName: "The Penthouse",
        colorScheme: "orange" as const,
        userCards: [
            {
                id: "user8",
                name: "Sam Washington",
                year: "Senior",
                registrationTime: "April 7, 10:30 AM",
            },
            {
                id: "user9",
                name: "Drew Garcia",
                year: "Junior",
                registrationTime: "April 8, 3:15 PM",
            },
            {
                id: "user10",
                name: "Alex Patel",
                year: "Sophomore",
                registrationTime: "April 10, 4:45 PM",
            },
        ],
    },
    {
        id: "group5",
        capacity: 4,
        currentOccupancy: 4,
        groupName: "Full House",
        colorScheme: "pink" as const,
        userCards: [
            {
                id: "user11",
                name: "Jordan Kim",
                year: "Senior",
                registrationTime: "April 7, 8:45 AM",
            },
            {
                id: "user12",
                name: "Casey Williams",
                year: "Junior",
                registrationTime: "April 8, 1:30 PM",
            },
            {
                id: "user13",
                name: "Taylor Brown",
                year: "Senior",
                registrationTime: "April 7, 9:00 AM",
            },
            {
                id: "user14",
                name: "Morgan Davis",
                year: "Sophomore",
                registrationTime: "April 10, 11:15 AM",
            },
        ],
    },
];

// TODO: Dashboard component
export default function Dashboard() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-400 to-blue-500 py-10 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Available Groups
                    </h1>
                    <p className="text-white text-opacity-80 max-w-2xl mx-auto">
                        Find the perfect housing group to join or create your
                        own to invite others.
                    </p>
                </div>

                {/* Search and filters - placeholders for now */}
                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 mb-8 flex flex-wrap gap-4 items-center justify-between">
                    <div className="relative flex-grow max-w-md">
                        <input
                            type="text"
                            placeholder="Search groups..."
                            className="w-full py-2 px-4 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select className="py-2 px-4 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300">
                            <option>All Capacities</option>
                            <option>2-4 People</option>
                            <option>5+ People</option>
                        </select>
                        <select className="py-2 px-4 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300">
                            <option>Any Availability</option>
                            <option>Has Open Spots</option>
                            <option>Full Groups</option>
                        </select>
                    </div>
                </div>

                {/* Group cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockGroups.map((group) => (
                        <div key={group.id} className="flex">
                            <GroupCard
                                capacity={group.capacity}
                                currentOccupancy={group.currentOccupancy}
                                groupName={group.groupName}
                                userCards={group.userCards}
                                colorScheme={group.colorScheme}
                            />
                        </div>
                    ))}
                </div>

                {/* No results placeholder (conditionally rendered) */}
                {mockGroups.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                        <h3 className="text-xl font-medium text-gray-700 mb-2">
                            No groups found
                        </h3>
                        <p className="text-gray-500 mb-6">
                            Try adjusting your search criteria or create a new
                            group.
                        </p>
                        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition duration-300">
                            Create New Group
                        </button>
                    </div>
                )}

                {/* Create new group button */}
                <div className="mt-10 flex justify-center">
                    <button className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300">
                        + Create New Group
                    </button>
                </div>
            </div>
        </div>
    );
}
