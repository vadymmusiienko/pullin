// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Your global styles
import { AuthProvider } from "@/context/AuthContext"; // Import the AuthProvider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PullIn", // Example title
  description: "Connect with students on campus", // Example description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Wrap the main content with AuthProvider */}
        <AuthProvider>
          {/* You can add common layout elements like Navbar/Header here later */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}