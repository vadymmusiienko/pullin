// src/app/layout.tsx
import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext"; // Import the AuthProvider
import "./globals.css";

export const metadata: Metadata = {
    title: "PullIn",
    description:
        "PullIn connects students with available housing registration times to peers looking to join suites, making roommate matching effortless and efficient.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* Wrap the main content with AuthProvider */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
};
