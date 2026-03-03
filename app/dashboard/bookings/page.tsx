"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Mail, MapPin, X, RefreshCw, CheckCircle } from "lucide-react";
import dayjs from "dayjs";

type BookingStatus = "upcoming" | "past" | "cancelled";

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeeNotes?: string;
  eventType: {
    title: string;
    duration: number;
    location?: string;
  };
  cancelReason?: string;
}

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<BookingStatus>("upcoming");
  const utils = api.useUtils();

  const { data: bookings, isLoading } = api.booking.list.useQuery();
  const cancelMutation = api.booking.cancel.useMutation({
    onSuccess: () => {
      utils.booking.list.invalidate();
    },
  });

  const handleCancel = async (id: string, title: string) => {
    const reason = prompt(`Why are you cancelling "${title}"?`);
    if (reason !== null) {
      await cancelMutation.mutateAsync({ id, reason: reason || "No reason provided" });
    }
  };

  const filterBookings = () => {
    if (!bookings) return [];
    const now = new Date();

    switch (activeTab) {
      case "upcoming":
        return bookings.filter((b: Booking) => b.status === "ACCEPTED" && new Date(b.startTime) >= now);
      case "past":
        return bookings.filter((b: Booking) => b.status === "ACCEPTED" && new Date(b.startTime) < now);
      case "cancelled":
        return bookings.filter((b: Booking) => b.status === "CANCELLED");
      default:
        return [];
    }
  };

  const filteredBookings = filterBookings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Bookings
        </h1>
        <p className="text-gray-600 mt-2">Manage your scheduled meetings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(["upcoming", "past", "cancelled"] as BookingStatus[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium capitalize transition-colors ${
              activeTab === tab
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab}
            {bookings && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100">
                {filterBookings().length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-100">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No {activeTab} bookings</h3>
          <p className="text-gray-600">
            {activeTab === "upcoming" && "You don't have any upcoming meetings scheduled."}
            {activeTab === "past" && "You haven't had any past meetings yet."}
            {activeTab === "cancelled" && "No cancelled bookings."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking: Booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl border-2 border-gray-100 p-6 hover:border-blue-200 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Event Title */}
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{booking.eventType.title}</h3>
                    {booking.status === "CANCELLED" && (
                      <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                        Cancelled
                      </span>
                    )}
                    {booking.status === "ACCEPTED" && new Date(booking.startTime) >= new Date() && (
                      <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Confirmed
                      </span>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    {/* Date & Time */}
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {dayjs(booking.startTime).format("dddd, MMMM D, YYYY")}
                        </p>
                        <p className="flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4" />
                          {dayjs(booking.startTime).format("h:mm A")} -{" "}
                          {dayjs(booking.endTime).format("h:mm A")}
                        </p>
                      </div>
                    </div>

                    {/* Attendee */}
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{booking.attendeeName}</p>
                        <p className="flex items-center gap-2 mt-1">
                          <Mail className="w-4 h-4" />
                          {booking.attendeeEmail}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    {booking.eventType.location && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Location</p>
                          <p className="mt-1">{booking.eventType.location}</p>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {booking.attendeeNotes && (
                      <div className="flex items-start gap-3 md:col-span-2">
                        <div className="w-5 h-5 flex items-center justify-center text-blue-600 mt-0.5">
                          💬
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Notes</p>
                          <p className="mt-1 text-gray-600">{booking.attendeeNotes}</p>
                        </div>
                      </div>
                    )}

                    {/* Cancel Reason */}
                    {booking.status === "CANCELLED" && booking.cancelReason && (
                      <div className="flex items-start gap-3 md:col-span-2 bg-red-50 p-3 rounded-lg">
                        <X className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-900">Cancellation Reason</p>
                          <p className="mt-1 text-red-700">{booking.cancelReason}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {booking.status === "ACCEPTED" && new Date(booking.startTime) >= new Date() && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      onClick={() => handleCancel(booking.id, booking.eventType.title)}
                      disabled={cancelMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
