"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AccessGatePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/verify-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store access token in cookie with dynamic expiry
        const maxAge = data.expiresIn || 3600; // Use returned expiry or default to 1 hour
        const expiryTime = Date.now() + maxAge * 1000; // Calculate expiry timestamp
        document.cookie = `access_verified=true; path=/; max-age=${maxAge}`;
        document.cookie = `access_expiry=${expiryTime}; path=/; max-age=${maxAge}`;
        // Redirect to home page - user can now access entire website
        router.push("/");
      } else {
        setError(data.message || "Invalid or expired access code");
      }
    } catch (err) {
      setError("Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Lock Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#ee4a62] to-[#f7acb7] rounded-full mb-4">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Access Required
          </h1>
          <p className="text-gray-600">
            Enter the access code provided by your administrator
          </p>
        </div>

        {/* Access Code Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Access Code
              </label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest h-14"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full h-12 text-lg rounded-lg bg-[#ee4a62] hover:bg-[#ee4a62]"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Don't have an access code?</p>
            <p className="mt-1">Contact your administrator to get one.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
