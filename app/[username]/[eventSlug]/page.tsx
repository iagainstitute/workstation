"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Calendar as CalendarIcon, MapPin, User, Mail, ArrowLeft } from "lucide-react";
import dayjs from "dayjs";
import Link from "next/link";

const bookingSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  notes: z.string().max(500).optional(),
});

type BookingForm = z.infer<typeof bookingSchema>;

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const eventSlug = params.eventSlug as string;

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: eventType, isLoading } = api.eventType.getBySlug.useQuery({ username, slug: eventSlug });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
  });

  const createBookingMutation = api.booking.create.useMutation({
    onSuccess: () => {
      router.push(`/${username}/${eventSlug}/success`);
    },
  });

  // Generate next 30 days
  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 30; i++) {
      const date = dayjs().add(i, "day");
      dates.push({
        date: date.format("YYYY-MM-DD"),
        dayName: date.format("ddd"),
        dayNumber: date.format("D"),
        month: date.format("MMM"),
      });
    }
    return dates;
  };

  // Generate time slots (9 AM - 5 PM)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 17 && minute > 0) break;
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        const displayTime = dayjs(`2000-01-01 ${time}`).format("h:mm A");
        slots.push({ time, displayTime });
      }
    }
    return slots;
  };

  const dates = generateDates();
  const timeSlots = generateTimeSlots();

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setShowForm(true);
  };

  const onSubmit = async (data: BookingForm) => {
    if (!selectedDate || !selectedTime || !eventType) return;

    const startTime = new Date(`${selectedDate}T${selectedTime}`);
    const endTime = new Date(startTime.getTime() + eventType.duration * 60000);

    await createBookingMutation.mutateAsync({
      eventTypeId: eventType.id,
      startTime,
      endTime,
      attendeeName: data.name,
      attendeeEmail: data.email,
      attendeeTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      attendeeNotes: data.notes,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!eventType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Event type not found</h3>
          <Link href={`/${username}`}>
            <Button>Back to Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Link href={`/${username}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {username}
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Event Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 sticky top-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
                {username.charAt(0).toUpperCase()}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{eventType.title}</h1>

              <div className="space-y-3 text-gray-600">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>{eventType.duration} minutes</span>
                </div>
                {eventType.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <span>{eventType.location}</span>
                  </div>
                )}
                {selectedDate && (
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-purple-600" />
                    <span>{dayjs(selectedDate).format("dddd, MMMM D, YYYY")}</span>
                  </div>
                )}
                {selectedTime && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span>{dayjs(`2000-01-01 ${selectedTime}`).format("h:mm A")}</span>
                  </div>
                )}
              </div>

              {eventType.description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-gray-600 text-sm">{eventType.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Date & Time Selection */}
          <div className="lg:col-span-3">
            {!showForm ? (
              <div className="bg-white rounded-2xl border-2 border-gray-100 p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Select a Date & Time</h2>

                {/* Date Selection */}
                {!selectedDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-4">Choose a date:</p>
                    <div className="grid grid-cols-7 gap-2">
                      {dates.map((date) => (
                        <button
                          key={date.date}
                          onClick={() => setSelectedDate(date.date)}
                          className="flex flex-col items-center p-3 rounded-lg border-2 border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all"
                        >
                          <span className="text-xs text-gray-500 mb-1">{date.dayName}</span>
                          <span className="text-lg font-semibold text-gray-900">{date.dayNumber}</span>
                          <span className="text-xs text-gray-500">{date.month}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Time Selection */}
                {selectedDate && !selectedTime && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-medium text-gray-700">
                        Choose a time on {dayjs(selectedDate).format("MMMM D")}:
                      </p>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                        Change Date
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => handleTimeSelect(slot.time)}
                          className="px-4 py-3 rounded-lg border-2 border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all font-medium text-gray-900"
                        >
                          {slot.displayTime}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-gray-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Enter Your Details</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedTime(null);
                    }}
                  >
                    Change Time
                  </Button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <Input {...register("name")} placeholder="Your full name" className="flex-1" />
                    </div>
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <Input {...register("email")} type="email" placeholder="your@email.com" className="flex-1" />
                    </div>
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Additional Notes (Optional)</label>
                    <textarea
                      {...register("notes")}
                      placeholder="Anything you'd like to share..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-lg"
                  >
                    {isSubmitting ? "Booking..." : "Confirm Booking"}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
