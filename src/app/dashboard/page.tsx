"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  username: string;
  email: string | null;
  passwordHash: string;
  twoFactorSecret: string | null;
  isTwoFactorEnabled: boolean;
  createdAt: string;
}

export default function DashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Basic frontend authentication check
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users);
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-blue-400">Admin Dashboard</h1>
        <Link href="/" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition font-semibold">
          Back to Home
        </Link>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-700 text-gray-300 font-semibold">
              <tr>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Password Hash (bcrypt)</th>
                <th className="px-6 py-4">2FA Secret (AES-256 Encrypted)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-750 transition-colors overflow-hidden">
                  <td className="px-6 py-4">{user.username}</td>
                  <td className="px-6 py-4 text-gray-400">{user.email || "N/A"}</td>
                  <td className="px-6 py-4">
                     <div className="max-w-[250px] truncate hover:max-w-none hover:whitespace-normal break-all text-xs font-mono bg-gray-900 p-2 rounded text-green-400 hover:cursor-pointer transition-all">
                       {user.passwordHash}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="max-w-[200px] truncate hover:max-w-none hover:whitespace-normal break-all text-xs font-mono bg-gray-900 p-2 rounded text-yellow-400 hover:cursor-pointer transition-all">
                       {user.twoFactorSecret || "Not Enabled"}
                     </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-400">
                    No users found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
