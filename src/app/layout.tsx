import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PWAHandler from "@/components/PWAHandler";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from "react-hot-toast";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export const metadata: Metadata = {
  title: "Datie. | The Elite Malayali Dating Protocol",
  description: "Secure, Verified, and AI-Powered connections for the premium Malayali community.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Datie."
  },
  icons: {
    icon: "/favicon.ico",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-white dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
        <ThemeProvider>
          <AuthProvider>
            <Toaster position="top-center" />
            <Navbar />
            <PWAHandler />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
