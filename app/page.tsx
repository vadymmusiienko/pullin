"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/firebaseConfig";
import Loading from "./components/loading";

import Link from "next/link";
import Image from "next/image";

export default function Home() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("User authenticated, redirecting to dashboard...");
                router.replace("/dashboard");
            } else {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (isLoading) {
        return <Loading />;
    }

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
                            <Link
                                href="/signup"
                                className="text-center px-8 py-3 bg-gradient-to-r from-teal-400 to-teal-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition duration-300"
                            >
                                Sign Up
                            </Link>
                            <Link
                                href="/signin"
                                className="text-center px-8 py-3 bg-white border-2 border-teal-400 text-teal-500 font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition duration-300"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>

                    {/* Right Decorative Area */}
                    <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-teal-400 to-blue-500 p-12">
                        <div className="h-full flex items-center justify-center">
                            <Image
                                src="/logo.png" // Make sure this path is correct (in /public folder)
                                alt="Pull-In Logo"
                                width={1000} // Adjust as needed
                                height={1000} // Adjust as needed
                                priority
                            />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
