import Link from 'next/link';
        
export default function Home() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 to-blue-500 p-6">
            <div className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="flex flex-col md:flex-row">
                    {/* Left Content Area */}
                    <div className="p-8 md:p-12 flex flex-col justify-center md:w-3/5">
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent mb-6">
                            Pull𝕚n
                        </h1>
                        <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                            Effortlessly connect students with housing
                            registration times to peers looking for suites.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* TODO: Work on sign in and sign up buttons */}
                            <Link href="/signup" className="px-8 py-3 bg-gradient-to-r from-teal-400 to-teal-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition duration-300">
                                Sign Up
                            </Link>
                            <Link href="/signin" className="px-8 py-3 bg-white border-2 border-teal-400 text-teal-500 font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition duration-300">
                                Sign In
                            </Link>
                        </div>
                    </div>

                    {/* Right Decorative Area */}
                    <div className="hidden md:block md:w-2/5 bg-gradient-to-br from-teal-400 to-blue-500 p-12">
                        <div className="h-full flex items-center justify-center">
                            <div className="w-32 h-32 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                                <div className="w-24 h-24 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
                                    <div className="w-16 h-16 rounded-full bg-white bg-opacity-40"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}