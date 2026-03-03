"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Monitor, Calendar, Clock, Rocket } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-all duration-300"></div>
              <div className="relative w-28 h-28 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-300">
                <Monitor className="w-16 h-16 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                <span className="text-white text-lg font-bold">✓</span>
              </div>
            </div>
          </div>

          <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-2">
            Book Your Computer!
          </h1>

          <p className="text-2xl md:text-3xl text-gray-700 mb-10 max-w-3xl mx-auto font-medium">
            Choose a computer, pick your time, and start learning!
            <br />
            <span className="text-purple-600">Super easy! 🎉</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center flex-wrap mb-4">
            <Link href="/student/login">
              <Button
                size="lg"
                className="h-16 px-10 text-2xl bg-gradient-to-r from-green-400 via-blue-500 to-blue-600 hover:from-green-500 hover:via-blue-600 hover:to-blue-700 text-white shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 font-bold rounded-xl"
              >
                <Rocket className="w-6 h-6 mr-2" />
                Book Now!
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-purple-100">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Monitor className="w-11 h-11 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
              Choose Computer
            </h3>
            <p className="text-lg text-gray-700 text-center leading-relaxed">
              Pick Gaming 🎮, Design 🎨, or Basic 💻 computer!
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-cyan-100">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Clock className="w-11 h-11 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
              Pick Your Time
            </h3>
            <p className="text-lg text-gray-700 text-center leading-relaxed">
              Select when you want to use it. Easy!
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-pink-100">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Calendar className="w-11 h-11 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
              Get Confirmed!
            </h3>
            <p className="text-lg text-gray-700 text-center leading-relaxed">
              You're all set! Come and start using it! ✨
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-16 bg-white/90 backdrop-blur-sm rounded-3xl p-10 md:p-12 shadow-2xl max-w-4xl mx-auto border border-purple-100">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-10 flex items-center justify-center gap-3">
            How It Works?
            <span className="text-5xl">🤔</span>
          </h2>
          <div className="space-y-6">
            {[
              { num: 1, title: "Choose Computer Type", desc: "Pick Gaming 🎮, Design 🎨, or Basic 💻", color: "bg-blue-500" },
              { num: 2, title: "Pick a Computer", desc: "Choose which one you want to use", color: "bg-purple-500" },
              { num: 3, title: "Choose Date & Time", desc: "When do you want to use it?", color: "bg-green-500" },
              { num: 4, title: "Enter Your Details", desc: "Tell us who you are", color: "bg-pink-500" },
              { num: 5, title: "Done! 🎉", desc: "Your computer is booked! Come and use it!", color: "bg-yellow-500" },
            ].map((step) => (
              <div key={step.num} className="flex items-start gap-4 hover:bg-purple-50 p-4 rounded-xl transition-colors">
                <div className={`w-12 h-12 ${step.color} rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xl shadow-md`}>
                  {step.num}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {step.title}
                  </h4>
                  <p className="text-lg text-gray-600">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Start? 🚀
          </h2>
          <Link href="/student/login">
            <Button
              size="lg"
              className="h-20 px-16 text-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 font-bold rounded-2xl"
            >
              Book Now!
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
