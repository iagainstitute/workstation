"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { api } from "@/trpc/react";

interface Booking {
  id: string;
  startTime: string;
  status: string;
}

interface EventType {
  id: string;
  title: string;
  slug: string;
  duration: number;
  description?: string | null;
  color?: string;
}

export default function DashboardPage() {
  const { data: eventTypes, isLoading } = api.eventType.list.useQuery();
  const { data: bookings } = api.booking.list.useQuery();

  // Filter upcoming bookings on client side
  const upcomingBookings = bookings?.filter(
    (b: Booking) => b.status === "ACCEPTED" && new Date(b.startTime) >= new Date()
  ) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage your event types and bookings
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Event Types</p>
              <p className="text-2xl font-bold text-gray-900">
                {eventTypes?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Upcoming Bookings</p>
              <p className="text-2xl font-bold text-gray-900">
                {upcomingBookings.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Event Types Section */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Your Event Types</h2>
          <Link href="/dashboard/event-types/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Event Type
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-6 text-center text-gray-600">Loading...</div>
        ) : eventTypes && eventTypes.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eventTypes.map((eventType: EventType) => (
              <Link
                key={eventType.id}
                href={`/dashboard/event-types/${eventType.id}`}
                className="group rounded-lg border border-gray-200 bg-white p-6 hover:border-blue-600 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      {eventType.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {eventType.duration} minutes
                    </p>
                    {eventType.description && (
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                        {eventType.description}
                      </p>
                    )}
                  </div>
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: eventType.color }}
                  />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No event types yet
            </h3>
            <p className="mt-2 text-gray-600">
              Get started by creating your first event type
            </p>
            <Link href="/dashboard/event-types/new" className="mt-6 inline-block">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Event Type
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
