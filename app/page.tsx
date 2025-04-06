import Link from 'next/link';
import Image from 'next/image';
        
export default function Home() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 to-blue-500 p-6">
            <div className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="flex flex-col md:flex-row">
                    {/* Left Content Area */}
                    <div className="p-8 md:p-12 flex flex-col justify-center md:w-3/5">
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent mb-6">
                            Pull-In
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
                    <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-teal-400 to-blue-500 p-12">
                        <div className="h-full flex items-center justify-center">
                            {/* 2. Replace the nested circle divs with the Image component */}
                            <Image
                                src="/logo.png" // <-- 3. IMPORTANT: Update this path to your logo file in the /public folder
                                alt="Pull-In Logo" // <-- 4. Add descriptive alt text
                                width={1000} // <-- 5. Set desired width (adjust as needed)
                                height={1000} // <-- 6. Set desired height (adjust as needed)
                                priority // Optional: Add if the logo is critical for LCP (Largest Contentful Paint)
                                // You can add className for extra styling if necessary, e.g.,
                                // className="rounded-full" // If you want the logo container itself to be round
                            />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}