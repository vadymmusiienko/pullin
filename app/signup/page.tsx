"use client";

import React, { useState, Fragment, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Combobox, Transition } from "@headlessui/react";
import Loading from "../components/loading";

// --- College Data Types ---
interface College {
    name: string;
    domain: string;
}

// --- School Data ---
const activeColleges: College[] = [
    { name: "Pomona College", domain: "mymail.pomona.edu" },
    { name: "Scripps College", domain: "scrippscollege.edu" },
    {
        name: "Claremont McKenna College",
        domain: "students.claremontmckenna.edu",
    },
    { name: "Harvey Mudd College", domain: "g.hmc.edu" },
    { name: "Pitzer College", domain: "students.pitzer.edu" },
];

const schoolDomainMap: Record<string, string> = activeColleges.reduce(
    (acc, college) => {
        acc[college.name] = college.domain;
        return acc;
    },
    {} as Record<string, string>
);

const isValidTimeFormat = (time: string): boolean => {
    const timeRegex = /^\d{1,2}:\d{2}$/;
    return timeRegex.test(time);
};

interface FirebaseError {
    code: string;
    message: string;
}

export default function SignUpPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [gradYear, setGradYear] = useState("");
    const [registrationTime, setRegistrationTime] = useState("");

    // Add styles to fix scrolling and combobox focus styles
    useEffect(() => {
        const styleElement = document.createElement("style");
        styleElement.innerHTML = `
            .combobox-options-container {
                max-height: 200px;
                overflow-y: auto !important;
                position: absolute;
                z-index: 50;
                width: 100%;
                margin-top: 0.25rem;
                border-radius: 0.75rem;
                background-color: white;
                padding: 0.25rem 0;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                ring-width: 1px;
                ring-color: rgba(0, 0, 0, 0.05);
            }

            body {
                overflow: auto !important;
            }
            
            .combobox-input-container:focus-within {
                outline: none;
                --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
                --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
                box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
                --tw-ring-color: #14b8a6;
                --tw-ring-opacity: 1;
                border-color: transparent;
            }
        `;
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    const getDomainFromEmail = (email: string): string | null => {
        const parts = email.split("@");
        return parts.length === 2 ? parts[1].toLowerCase() : null;
    };

    const filteredColleges =
        query === ""
            ? activeColleges
            : activeColleges.filter((college) =>
                  college.name
                      .toLowerCase()
                      .replace(/\s+/g, "")
                      .includes(query.toLowerCase().replace(/\s+/g, ""))
              );

    const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (
            !email ||
            !password ||
            !selectedSchool ||
            !firstName ||
            !lastName ||
            !gradYear ||
            !registrationTime
        ) {
            setError("Please fill in all required fields.");
            return;
        }
        if (password.length < 6) {
            setError("Password should be at least 6 characters long.");
            return;
        }
        const expectedDomain = schoolDomainMap[selectedSchool];
        const actualDomain = getDomainFromEmail(email);
        if (
            !actualDomain ||
            !expectedDomain ||
            actualDomain !== expectedDomain
        ) {
            setError(
                expectedDomain
                    ? `Please use a valid @${expectedDomain} email address for ${selectedSchool}.`
                    : "Invalid school selection."
            );
            return;
        }
        const parsedGradYear = parseInt(gradYear, 10);
        if (isNaN(parsedGradYear) || gradYear.length !== 4) {
            setError("Please enter a valid 4-digit graduation year.");
            return;
        }
        if (!isValidTimeFormat(registrationTime)) {
            setError(
                "Please enter the registration time in H:MM or HH:MM format (e.g., 8:45 or 14:30)."
            );
            return;
        }

        setIsLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            const user = userCredential.user;

            const userDocRef = doc(db, "users", user.uid);
            const userData = {
                uid: user.uid,
                email: user.email,
                school: selectedSchool,
                graduationYear: parsedGradYear,
                registrationTime: registrationTime,
                name: `${firstName} ${lastName}`,
                group_leader: false,
                pfpUrl: "",
                is_grouped: false,
                bio: "",
                interests: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(userDocRef, userData);

            alert("Sign up successful! You will be redirected.");
            router.push("/dashboard");
        } catch (err: unknown) {
            const firebaseErr = err as FirebaseError;
            if (firebaseErr.code === "auth/email-already-in-use") {
                setError("This email address is already registered.");
            } else if (firebaseErr.code === "auth/weak-password") {
                setError(
                    "Password is too weak. Please choose a stronger password."
                );
            } else {
                setError(
                    `Failed to sign up. ${
                        firebaseErr.message || "Please try again."
                    }`
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Main container needs to allow scrolling if content overflows viewport
        <main className="min-h-screen flex justify-center bg-gradient-to-br from-teal-400 to-blue-500 p-6 overflow-y-auto">
            {/* Added overflow-y-auto here to ensure the main area scrolls if needed */}
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl my-auto">
                {/* Added my-auto to help center vertically if content is short */}
                <div className="p-8">
                    <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent mb-6">
                        Create Your Pull-In Account
                    </h1>

                    <form onSubmit={handleSignUp} className="space-y-5">
                        {/* --- Form Inputs (remain the same) --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* First Name Input */}
                            <div>
                                <label
                                    htmlFor="firstName-input"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    id="firstName-input"
                                    value={firstName}
                                    onChange={(e) =>
                                        setFirstName(e.target.value)
                                    }
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                                />
                            </div>

                            {/* Last Name Input */}
                            <div>
                                <label
                                    htmlFor="lastName-input"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    id="lastName-input"
                                    value={lastName}
                                    onChange={(e) =>
                                        setLastName(e.target.value)
                                    }
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                                />
                            </div>
                        </div>

                        {/* Email Input */}
                        <div>
                            <label
                                htmlFor="email-input"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                School Email
                            </label>
                            <input
                                type="email"
                                id="email-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                                placeholder="your_email@school.edu"
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label
                                htmlFor="password-input"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                id="password-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                                placeholder="At least 6 characters"
                            />
                        </div>

                        {/* School Combobox */}
                        <div>
                            <Combobox
                                value={selectedSchool}
                                onChange={setSelectedSchool}
                            >
                                <Combobox.Label className="block text-sm font-medium text-gray-700 mb-1">
                                    Your College
                                </Combobox.Label>
                                <div className="relative">
                                    {/* Updated container to have custom class for focusing */}
                                    <div className="w-full cursor-default overflow-hidden rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 combobox-input-container">
                                        <Combobox.Input
                                            id="school-combobox"
                                            className="w-full px-4 py-2.5 text-gray-900 border-none focus:ring-0"
                                            displayValue={(
                                                schoolName: string
                                            ) => schoolName}
                                            onChange={(event) =>
                                                setQuery(event.target.value)
                                            }
                                            placeholder="Search or select your college..."
                                            autoComplete="off"
                                            required
                                        />
                                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            {/* Chevron Icon */}
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                                className="h-5 w-5 text-gray-400"
                                                aria-hidden="true"
                                            >
                                                {" "}
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 3a.75.75 0 0 1 .55.24l3.25 3.5a.75.75 0 1 1-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 0 1-1.1-1.02l3.25-3.5A.75.75 0 0 1 10 3Z"
                                                    clipRule="evenodd"
                                                />{" "}
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 17a.75.75 0 0 1-.55-.24l-3.25-3.5a.75.75 0 1 1 1.1-1.02L10 15.148l2.7-2.91a.75.75 0 0 1 1.1 1.02l-3.25 3.5A.75.75 0 0 1 10 17Z"
                                                    clipRule="evenodd"
                                                />{" "}
                                            </svg>
                                        </Combobox.Button>
                                    </div>
                                    <Transition
                                        as={Fragment}
                                        leave="transition ease-in duration-100"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                        afterLeave={() => setQuery("")}
                                    >
                                        {/* Using custom class for Options */}
                                        <Combobox.Options className="combobox-options-container">
                                            {filteredColleges.length === 0 &&
                                            query !== "" ? (
                                                <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                                                    Nothing found.
                                                </div>
                                            ) : (
                                                filteredColleges.map(
                                                    (college) => (
                                                        <Combobox.Option
                                                            key={college.name}
                                                            value={college.name}
                                                            className={({
                                                                active,
                                                            }) =>
                                                                `relative cursor-default select-none py-2.5 pl-10 pr-4 ${
                                                                    active
                                                                        ? "bg-gradient-to-r from-teal-400 to-blue-500 text-white"
                                                                        : "text-gray-900"
                                                                }`
                                                            }
                                                        >
                                                            {({
                                                                selected,
                                                                active,
                                                            }) => (
                                                                <>
                                                                    <span
                                                                        className={`block truncate ${
                                                                            selected
                                                                                ? "font-medium"
                                                                                : "font-normal"
                                                                        }`}
                                                                    >
                                                                        {
                                                                            college.name
                                                                        }
                                                                    </span>
                                                                    {selected ? (
                                                                        <span
                                                                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                                active
                                                                                    ? "text-white"
                                                                                    : "text-teal-500"
                                                                            }`}
                                                                        >
                                                                            {/* Check Icon */}
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                viewBox="0 0 20 20"
                                                                                fill="currentColor"
                                                                                className="h-5 w-5"
                                                                                aria-hidden="true"
                                                                            >
                                                                                {" "}
                                                                                <path
                                                                                    fillRule="evenodd"
                                                                                    d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                                                                                    clipRule="evenodd"
                                                                                />{" "}
                                                                            </svg>
                                                                        </span>
                                                                    ) : null}
                                                                </>
                                                            )}
                                                        </Combobox.Option>
                                                    )
                                                )
                                            )}
                                        </Combobox.Options>
                                    </Transition>
                                </div>
                            </Combobox>
                        </div>

                        {/* --- Form Inputs (continued, remain the same) --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Graduation Year Input */}
                            <div>
                                <label
                                    htmlFor="gradYear-input"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Graduation Year
                                </label>
                                <input
                                    type="number"
                                    id="gradYear-input"
                                    value={gradYear}
                                    onChange={(e) =>
                                        setGradYear(e.target.value)
                                    }
                                    required
                                    min="2000"
                                    max="2050"
                                    step="1"
                                    placeholder="YYYY"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                            </div>

                            {/* Registration Time Input */}
                            <div>
                                <label
                                    htmlFor="registrationTime-input"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Registration Time
                                </label>
                                <input
                                    type="text"
                                    id="registrationTime-input"
                                    value={registrationTime}
                                    onChange={(e) =>
                                        setRegistrationTime(e.target.value)
                                    }
                                    required
                                    placeholder="H:MM or HH:MM (e.g. 8:45)"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                                />
                            </div>
                        </div>

                        {/* Error Display (remains the same) */}
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Submit Button (remains the same) */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-8 py-3.5 mt-2 bg-gradient-to-r from-teal-400 to-blue-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <Loading loadingText="Creating Account..." />
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
