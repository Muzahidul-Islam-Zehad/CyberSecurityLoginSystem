"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";
import Link from "next/link";

export default function RegisterPge() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const passwordValidations = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordValidations).every(Boolean);
  const isFormValid = username.length >= 4 && email.includes("@") && isPasswordValid && !!captchaToken;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      setMessage("Please complete the CAPTCHA.");
      return;
    }
    
    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, captchaToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Registration failed");
      } else {
        setMessage(data.message);
        if (data.qrCodeUrl) {
          setQrCode(data.qrCodeUrl);
          setManualSecret(data.secret);
        }
      }
    } catch (err: any) {
      setMessage("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl">
        <Link href="/" className="text-2xl sm:text-3xl font-bold text-center">
          Secure Register
        </Link>
        {message && <div className={`p-3 sm:p-4 text-sm sm:text-base text-center rounded text-white ${qrCode ? "bg-green-500" : "bg-red-500"}`}>{message}</div>}

        {!qrCode ? (
           <form className="space-y-4">
             <div>
               <label className="block text-sm font-medium">Username</label>
               <input
                 type="text"
                 required
                 className="w-full p-2 mt-1 bg-gray-700 border border-gray-600 rounded focus:ring focus:ring-blue-500"
                 value={username}
                 onChange={(e) => setUsername(e.target.value)}
                 minLength={4}
               />
             </div>
             <div>
               <label className="block text-sm font-medium">Email</label>
               <input
                 type="email"
                 required
                 className="w-full p-2 mt-1 bg-gray-700 border border-gray-600 rounded focus:ring focus:ring-blue-500"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
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
                   minLength={8}
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
               <div className="text-xs mt-2 space-y-1">
                 <p className={passwordValidations.length ? "text-green-500" : "text-red-500"}>
                   {passwordValidations.length ? "✔" : "✘"} Requires 8+ chars
                 </p>
                 <p className={passwordValidations.uppercase ? "text-green-500" : "text-red-500"}>
                   {passwordValidations.uppercase ? "✔" : "✘"} Requires uppercase letter
                 </p>
                 <p className={passwordValidations.lowercase ? "text-green-500" : "text-red-500"}>
                   {passwordValidations.lowercase ? "✔" : "✘"} Requires lowercase letter
                 </p>
                 <p className={passwordValidations.number ? "text-green-500" : "text-red-500"}>
                   {passwordValidations.number ? "✔" : "✘"} Requires number
                 </p>
                 <p className={passwordValidations.special ? "text-green-500" : "text-red-500"}>
                   {passwordValidations.special ? "✔" : "✘"} Requires special character
                 </p>
               </div>
             </div>
             
             <div className="flex justify-center my-4 overflow-hidden transform scale-90 sm:scale-100 origin-center">
               <ReCAPTCHA
                 sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"} // Fallback to Google's test key
                 onChange={(token) => setCaptchaToken(token)}
                 theme="dark"
               />
             </div>

             <button
               type="button"
               disabled={isLoading}
               onClick={(e) => {
                 if (!isFormValid) {
                   setMessage("Please ensure all fields match the requirements and the CAPTCHA is checked.");
                   return;
                 }
                 handleRegister(e as any);
               }}
               className={`w-full py-2 font-semibold text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                 isFormValid && !isLoading ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 cursor-not-allowed opacity-50"
               }`}
             >
               {isLoading ? "Registering..." : "Register"}
             </button>
             <p className="text-sm text-center text-gray-400">
               Already have an account? <Link href="/login" className="text-blue-500 hover:underline">Login here</Link>
             </p>
           </form>
        ) : (
          <div className="flex flex-col items-center space-y-4">
             <p className="text-sm sm:text-base text-center">Registration complete. Please scan this QR code with your Authenticator App (Google Authenticator, Authy, etc) to finalize 2FA setup.</p>
             <img src={qrCode} alt="2FA QR Code" className="w-2/3 sm:w-1/2 rounded-lg shadow-md" />
             
             {manualSecret && (
               <div className="w-full text-center bg-gray-700 p-4 rounded mt-2 border border-blue-500 shadow-md">
                 <p className="text-sm font-semibold text-blue-400 mb-1">⚠️ One-Time Setup Key</p>
                 <p className="text-xs text-gray-300 mb-3">Please store this secret key safely. You can use it to recover your account if you lose your Authenticator app.</p>
                 
                 <div className="bg-gray-800 p-2 rounded border border-gray-600 mb-3">
                   <code className="text-sm sm:text-base text-green-400 tracking-widest break-all font-mono">
                     {manualSecret}
                   </code>
                 </div>
                 
                 <div className="flex justify-center space-x-3">
                   <button
                     onClick={() => navigator.clipboard.writeText(manualSecret)}
                     className="text-xs bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded transition font-semibold"
                   >
                     📋 Copy Code
                   </button>
                   <button
                     onClick={() => {
                       const element = document.createElement("a");
                       const file = new Blob([`CyberSecurityApp 2FA Secret Key:\n\n${manualSecret}\n\nKeep this safe!`], {type: 'text/plain'});
                       element.href = URL.createObjectURL(file);
                       element.download = "2FA_Secret_Backup.txt";
                       document.body.appendChild(element);
                       element.click();
                     }}
                     className="text-xs bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded transition font-semibold"
                   >
                     💾 Download .txt
                   </button>
                 </div>
               </div>
             )}

             <button
               onClick={() => router.push("/login")}
               className="w-full py-2 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition mt-4"
             >
               Proceed to Login
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
