"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Squares from "../../../components/Sqaure";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card } from "@/components/ui/card";
// import { Monitor, Lock, Mail } from "lucide-react";
import Image from "next/image";
// import Squares from "./Square";
// import { ShinyButton } from "../../../../src/components/ui/shiny-button";
// import Lanyard from "./Lanyard";

export default function StudentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if already logged in
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      router.push("/student/book");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        },
      );

      if (authError) {
        throw authError;
      }

      if (data.user) {
        // Check if user is a student
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profile?.role !== "student") {
          await supabase.auth.signOut();
          setError("Only students can login here");
          setLoading(false);
          return;
        }

        router.push("/student/book");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="min-h-screen w-full bg-white relative text-gray-800">
        {/* Left Masked Circuit Board - Light Pattern */}
        <div className="min-h-screen w-full bg-white relative overflow-hidden">
          {/* Purple Corner Grid Background */}
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
            {/* Login Card */}
            <div className="w-full max-w-md">
              <div className="bg-white rounded-lg p-8 shadow-2xl">
                {/* Logo inside card */}
                <div className="flex justify-center mb-6">
                  <Image
                    src="/logo-01.png"
                    alt="IAGA Logo"
                    width={1000}
                    height={1000}
                    className="h-24 w-auto object-contain"
                  />
                </div>

                {/* Welcome text inside card */}
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold mb-2">
                    Workstation Portal
                  </h1>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Your Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="piyush@123"
                      required
                      className="w-full h-12 px-4 border border-pink-200 bg-pink-50 rounded-md focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Your Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full h-12 px-4 border border-pink-200 bg-pink-50 rounded-md focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all"
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>{" "}
      </div>
    </div>
  );
}
