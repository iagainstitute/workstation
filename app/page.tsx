"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Monitor, Calendar, Clock, Rocket } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <main className="h-screen w-full bg-[#f8fafc] relative overflow-hidden flex items-center">
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
      <div className="container mx-auto px-6 py-8 relative z-10 max-w-7xl">
        {/* Logo at Top */}
        <div className="flex items-center justify-center mb-6">
          <Image
            src="/logo-01.png"
            alt="Logo"
            width={300}
            height={300}
            className="rounded-2xl "
          />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Book Your Computer
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            Choose a computer, pick your time, and start learning!
          </p>

          {/* CTA Button */}
          <Link href="/student/login">
            <Button
              size="lg"
              className="h-12 px-8 text-lg bg-[#ee4a62] hover:bg-[#dc3545] text-white font-semibold rounded-lg"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Book Now
            </Button>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mt-10 mx-auto mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Monitor className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 text-center">
              Choose Computer
            </h3>
            <p className="text-sm text-gray-600 text-center">
              Pick Gaming, Design, or Basic
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 text-center">
              Pick Your Time
            </h3>
            <p className="text-sm text-gray-600 text-center">
              Select when you want to use it
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 text-center">
              Get Confirmed
            </h3>
            <p className="text-sm text-gray-600 text-center">
              You're all set to start
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-white mt-10 rounded-xl p-6 shadow-sm max-w-5xl mx-auto border border-gray-200">
          <h2 className="text-2xl font-semibold text-center text-gray-900 mb-4">
            How It Works
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              {
                num: 1,
                title: "Choose Computer Type",
                desc: "Select from Gaming, Design, or Basic",
              },
              {
                num: 2,
                title: "Pick a Computer",
                desc: "Choose which computer you want",
              },
              {
                num: 3,
                title: "Choose Date & Time",
                desc: "Select when you want to use it",
              },
              {
                num: 4,
                title: "Enter Your Details",
                desc: "Complete the booking form",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="flex items-start gap-3 hover:bg-gray-50 p-3 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center shrink-0 text-white font-semibold text-sm">
                  {step.num}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-0.5">
                    {step.title}
                  </h4>
                  <p className="text-xs text-gray-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
