"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setIsLoggedIn(false);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white p-4">
      <div className="text-center space-y-8">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
          Secure Authentication Portal
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          A robust cyber security project demonstrating secure logins, 2FA, password hashing, and session management.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          {!isLoggedIn ? (
            <>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3 font-semibold text-white bg-green-600 rounded-lg shadow-lg hover:bg-green-700 transition"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-3 font-semibold text-white bg-purple-600 rounded-lg shadow-lg hover:bg-purple-700 transition"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="w-full sm:w-auto px-8 py-3 font-semibold text-white bg-red-600 rounded-lg shadow-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
