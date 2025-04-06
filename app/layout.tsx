// src/app/layout.tsx
import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext"; // Import the AuthProvider
import Navbar from "./components/navbar"; // <--- Import your Navbar component (adjust path if needed)
import "./globals.css";

export const metadata: Metadata = {
    title: "Pull-In",
    description:
        "Pull-In connects students with available housing registration times to peers looking to join suites, making roommate matching effortless and efficient.",
    icons: {
        icon: "/logo.png"
    },
      
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* Wrap the main content AND Navbar with AuthProvider */}
        <AuthProvider>
          <Navbar /> {/* <--- Add the Navbar component here */}
          {/* Optional: Wrap children in <main> for semantic HTML */}
          <main>
            {children} 
          </main>
        </AuthProvider>
      </body>
    </html>
  );
};