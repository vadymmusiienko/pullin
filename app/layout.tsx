import type { Metadata } from "next";
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
            <body>{children}</body>
        </html>
    );
}
