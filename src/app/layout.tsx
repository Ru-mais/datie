import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "MalluLove | Premium Kerala Dating App",
  description: "The most exclusive dating experience for the Malayali community. Find your Keralite soulmate today.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <Toaster position="top-center" />
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
