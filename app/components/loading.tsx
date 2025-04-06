interface Loading {
    /** Optional additional classes for the container div (e.g., for background, padding). */
    className?: string;
    /** Optional size class for the spinner (e.g., "h-12 w-12"). Defaults to "h-10 w-10". */
    spinnerSize?: string;
    /** Optional color class for the spinner (e.g., "text-blue-500"). Defaults to "text-white". */
    spinnerColor?: string;
    /** Optional text to display below the spinner. */
    loadingText?: string;
}

const Loading: React.FC<Loading> = ({
    className = "",
    spinnerSize = "h-10 w-10",
    spinnerColor = "text-white", // Defaulting to white as used in Home
    loadingText,
}) => {
    const spinnerClasses = `animate-spin ${spinnerSize} ${spinnerColor}`;

    return (
        // Container div allows applying background, centering, etc., via the className prop
        <div
            className={`flex flex-col items-center justify-center ${className} bg-gradient-to-br from-teal-400 to-blue-500
min-h-screen`}
        >
            <svg
                className={spinnerClasses}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                role="status" // Accessibility: Indicate this element represents a status
                aria-live="polite" // Accessibility: Announce changes politely
            >
                {/* Accessibility: Provide a title for screen readers */}
                <title>{loadingText || "Loading"}</title>
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                ></circle>
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
            </svg>
            {loadingText && (
                <p className={`mt-3 text-sm ${spinnerColor}`}>
                    {" "}
                    {/* Match text color */}
                    {loadingText}
                </p>
            )}
        </div>
    );
};

export default Loading;
