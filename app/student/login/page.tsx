"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Squares from "../../../components/Sqaure";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { api } from "@/trpc/react";

export default function StudentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const studentLoginMutation = api.auth.studentLogin.useMutation({
    onSuccess: (data) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("workstation_student", JSON.stringify(data.user));
        localStorage.setItem("workstation_token", data.token);
        // Also set auth cookie
        document.cookie = `iaga-auth-token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
      }
      router.push("/student/book");
    },
    onError: (err) => {
      console.error("Login error:", err);
      setError(err.message || "Invalid email or password");
      setLoading(false);
    },
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("workstation_student");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user?.id) {
            router.push("/student/book");
          }
        } catch (e) {
          localStorage.removeItem("workstation_student");
        }
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await studentLoginMutation.mutateAsync({
        email,
        password,
      });
    } catch (err: any) {
      // handled in onError
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="min-h-screen w-full bg-white relative text-gray-800">
        <div className="min-h-screen w-full bg-white relative overflow-hidden">
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `
       linear-gradient(to right, #f0f0f0 1px, transparent 1px),
       linear-gradient(to bottom, #f0f0f0 1px, transparent 1px),
       radial-gradient(circle 600px at 0% 200px, #d5c5ff, transparent),
       radial-gradient(circle 600px at 100% 200px, #d5c5ff, transparent)
     `,
              backgroundSize: "20px 20px, 20px 20px, 100% 100%, 100% 100%",
            }}
          />

          <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border border-gray-200 shadow-xl rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={40}
                    height={40}
                    className="rounded-full"
                    onError={(e) => {
                      (e.target as any).style.display = "none";
                    }}
                  />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Student Portal</h1>
                <p className="text-sm text-gray-500 mt-1">Book your lab workstation</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition text-gray-900 bg-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing in..." : "Sign In to Book Lab"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
