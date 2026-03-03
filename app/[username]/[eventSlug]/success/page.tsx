"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Home } from "lucide-react";

export default function SuccessPage() {
  const params = useParams();
  const username = params.username as string;
  const eventSlug = params.eventSlug as string;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl border-2 border-gray-100 p-12 text-center">
        {/* Success Icon */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Booking Confirmed! 🎉
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your meeting has been successfully scheduled.
        </p>

        {/* Info Box */}
        <div className="bg-blue-50 rounded-2xl border-2 border-blue-100 p-6 mb-8 text-left">
          <div className="flex items-start gap-3 mb-4">
            <Calendar className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <p className="font-semibold text-blue-900 mb-2">What happens next?</p>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• You'll receive a confirmation email with all the details</li>
                <li>• A calendar invite will be sent to your email</li>
                <li>• You'll get a reminder before the meeting</li>
                <li>• Check your email for the meeting link (if applicable)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`/${username}`}>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto">
              <Calendar className="w-4 h-4 mr-2" />
              Book Another Meeting
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need to reschedule or cancel? Check your confirmation email for options.
          </p>
        </div>
      </div>
    </div>
  );
}
