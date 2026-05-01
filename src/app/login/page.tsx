"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [backupSecret, setBackupSecret] = useState("");
  const [useBackupMode, setUseBackupMode] = useState(false);
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            email, 
            password,
            userAgent: navigator.userAgent
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Login failed");
      } else {
        if (data.requiresTwoFactor) {
          setUserId(data.userId);
          setStep(2);
        }
      }
    } catch (err: any) {
      setMessage("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);
    setMessage("");

    try {
      const payload: any = { userId };
      if (useBackupMode) {
        payload.secretKey = backupSecret;
      } else {
        payload.code = twoFactorCode;
      }

      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Invalid 2FA authentication");
      } else {
        localStorage.setItem('auth_token', data.token);
        router.push("/dashboard"); // Successful login redirect
      }
    } catch (err: any) {
      setMessage("An unexpected error occurred during verification.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl">
        <Link href="/" className="text-2xl sm:text-3xl font-bold text-center">
          Secure Login
        </Link>

        {message && <div className="p-3 text-xs sm:text-sm text-center text-white bg-red-500 rounded">{message}</div>}

        {step === 1 && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                required
                className="w-full p-2 mt-1 bg-gray-700 border border-gray-600 rounded focus:ring focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full p-2 pr-10 bg-gray-700 border border-gray-600 rounded focus:ring focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {isLoading ? "Authenticating..." : "Login"}
            </button>
            <p className="text-xs sm:text-sm text-center text-gray-400">
               Don't have an account? <Link href="/register" className="text-blue-500 hover:underline">Register here</Link>.
             </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerify2FA} className="space-y-4">
            
            <div className="flex justify-center space-x-4 mb-4 border-b border-gray-600 pb-2">
              <button 
                type="button" 
                onClick={() => { setUseBackupMode(false); setMessage(""); }}
                className={`pb-2 text-sm font-semibold transition-colors ${!useBackupMode ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Use Authenticator App
              </button>
              <button 
                type="button" 
                onClick={() => { setUseBackupMode(true); setMessage(""); }}
                className={`pb-2 text-sm font-semibold transition-colors ${useBackupMode ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Use Backup Secret
              </button>
            </div>

            {!useBackupMode ? (
              <>
                <p className="text-sm text-center text-gray-300">
                  Please enter the 6-digit code from your authenticator app.
                </p>
                <div>
                  <label className="block text-sm font-medium pr-1">2FA Code</label>
                  <input
                    type="text"
                    required={!useBackupMode}
                    maxLength={6}
                    className="w-full p-2 mt-1 text-center tracking-widest text-lg bg-gray-700 border border-gray-600 rounded focus:ring focus:ring-blue-500"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-center text-gray-300">
                  Lost your device? Enter your raw 2FA Setup Secret Key to login.
                </p>
                <div>
                  <label className="block text-sm font-medium pr-1">Backup Secret Key</label>
                  <input
                    type="text"
                    required={useBackupMode}
                    className="w-full p-2 mt-1 text-center font-mono text-sm bg-gray-700 border border-gray-600 rounded focus:ring focus:ring-blue-500"
                    value={backupSecret}
                    onChange={(e) => setBackupSecret(e.target.value.trim())}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 font-semibold text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 transition"
            >
              {isLoading ? "Verifying..." : "Verify Identity"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
