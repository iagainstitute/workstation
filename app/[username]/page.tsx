"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/trpc/react";
import { Clock, Calendar, ArrowRight } from "lucide-react";

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const { data: eventTypes, isLoading } = api.eventType.listByUsername.useQuery({ username });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Profile Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-3xl font-bold">
            {username.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {username}
          </h1>
          <p className="text-gray-600 text-lg">Welcome! Schedule a meeting with me.</p>
        </div>

        {/* Event Types */}
        {!eventTypes || eventTypes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-100">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No event types available</h3>
            <p className="text-gray-600">This user hasn't set up any meeting types yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {eventTypes.map((eventType) => (
              <Link key={eventType.id} href={`/${username}/${eventType.slug}`}>
                <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 hover:border-blue-300 hover:shadow-xl transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {eventType.title}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{eventType.duration} minutes</span>
                      </div>
                    </div>
                    <div className="text-blue-600 group-hover:translate-x-1 transition-transform">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>

                  {eventType.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">{eventType.description}</p>
                  )}

                  {eventType.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>📍</span>
                      <span>{eventType.location}</span>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-blue-600 font-medium text-sm group-hover:text-blue-700">
                      Select a time →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          Powered by <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Cal Clone</span>
        </div>
      </div>
    </div>
  );
}
