"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Monitor, Clock, User, Mail, Phone, Calendar, CheckCircle2 } from "lucide-react";
import dayjs from "dayjs";

const bookingSchema = z.object({
  purpose: z.string().optional(),
  notes: z.string().max(500).optional(),
});

type BookingForm = z.infer<typeof bookingSchema>;

export default function DesktopBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1=type, 2=desktop, 3=time, 4=form
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedDesktop, setSelectedDesktop] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState(60);
  const [allocationId, setAllocationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        router.push('/student/login');
      }
    };
    getUser();
  }, [router]);

  const { data: desktopTypes } = api.desktop.getTypes.useQuery();
  const { data: availableDesktops } = api.desktop.listAvailable.useQuery(
    { typeId: selectedTypeId! },
    { enabled: !!selectedTypeId }
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
  });

  const createAllocationMutation = api.allocation.create.useMutation({
    onSuccess: (data) => {
      setAllocationId(data.id);
      setStep(5); // Success
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
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

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) break;
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        const displayTime = dayjs(`2000-01-01 ${time}`).format("h:mm A");
        slots.push({ time, displayTime });
      }
    }
    return slots;
  };

  const dates = generateDates();
  const timeSlots = generateTimeSlots();

  const onSubmit = async (data: BookingForm) => {
    if (!selectedDesktop || !selectedDate || !selectedTime || !userId) return;

    const startTime = new Date(`${selectedDate}T${selectedTime}`).toISOString();

    await createAllocationMutation.mutateAsync({
      desktopId: selectedDesktop.id,
      studentId: userId,
      startTime,
      durationMinutes: duration,
      purpose: data.purpose,
      notes: data.notes,
    });
  };

  if (step === 5) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full text-center">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">✅ Booking Confirmed!</h1>
          <p className="text-xl text-gray-700 mb-8">
            Yaay! Your computer is booked successfully!
          </p>
          <div className="bg-blue-50 rounded-2xl p-6 mb-8 text-left">
            <p className="text-lg mb-2">
              <strong>{selectedDesktop?.desktopType?.icon} Computer:</strong> {selectedDesktop?.desktopName}
            </p>
            <p className="text-lg mb-2">
              <strong>📅 Date:</strong> {dayjs(selectedDate).format("MMMM D, YYYY")}
            </p>
            <p className="text-lg mb-2">
              <strong>⏰ Time:</strong> {dayjs(`2000-01-01 ${selectedTime}`).format("h:mm A")} ({duration} minutes)
            </p>
            <p className="text-lg">
              <strong>📍 Type:</strong> {selectedDesktop?.desktopType?.displayName}
            </p>
          </div>
          <p className="text-gray-600 mb-8">
            Remember your booking ID: <strong>{allocationId}</strong>
          </p>
          <Button
            onClick={() => window.location.href = "/book"}
            className="w-full h-14 text-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            Book Another Computer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            🖥️ Book a Computer
          </h1>
          <p className="text-2xl text-gray-700">Choose your computer and time!</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                    s <= step
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {s}
                </div>
                {s < 4 && <div className="w-16 h-1 bg-gray-300 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Choose Computer Type */}
        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Step 1: Choose Computer Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {desktopTypes?.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedTypeId(type.id);
                    setStep(2);
                  }}
                  className="bg-gradient-to-br from-white to-gray-50 border-4 border-gray-200 hover:border-blue-400 rounded-3xl p-8 transition-all hover:scale-105 hover:shadow-2xl"
                >
                  <div className="text-6xl mb-4">{type.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{type.displayName}</h3>
                  <p className="text-gray-600">{type.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Choose Desktop */}
        {step === 2 && (
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <Button onClick={() => setStep(1)} variant="outline" className="mb-6">
              ← Back
            </Button>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Step 2: Choose Computer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableDesktops?.map((desktop) => (
                <button
                  key={desktop.id}
                  onClick={() => {
                    setSelectedDesktop(desktop);
                    setStep(3);
                  }}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 border-4 border-blue-200 hover:border-purple-400 rounded-2xl p-6 transition-all hover:scale-105"
                >
                  <Monitor className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">{desktop.desktopName}</h3>
                  {desktop.ipAddress && (
                    <p className="text-sm text-gray-600 mt-2">IP: {desktop.ipAddress}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Choose Date & Time */}
        {step === 3 && (
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <Button onClick={() => setStep(2)} variant="outline" className="mb-6">
              ← Back
            </Button>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Step 3: Choose Date & Time</h2>

            {!selectedDate && (
              <div>
                <p className="text-xl font-medium text-gray-700 mb-4">Pick a date:</p>
                <div className="grid grid-cols-7 gap-3">
                  {dates.map((date) => (
                    <button
                      key={date.date}
                      onClick={() => setSelectedDate(date.date)}
                      className="flex flex-col items-center p-4 rounded-xl border-4 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                      <span className="text-sm text-gray-500 mb-1">{date.dayName}</span>
                      <span className="text-2xl font-bold text-gray-900">{date.dayNumber}</span>
                      <span className="text-sm text-gray-500">{date.month}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedDate && !selectedTime && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xl font-medium text-gray-700">
                    Pick a time on {dayjs(selectedDate).format("MMMM D")}:
                  </p>
                  <Button variant="outline" onClick={() => setSelectedDate(null)}>
                    Change Date
                  </Button>
                </div>

                <div className="mb-6">
                  <label className="text-lg font-medium text-gray-700 mb-2 block">How long do you need?</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full p-4 border-4 border-gray-200 rounded-xl text-lg"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => {
                        setSelectedTime(slot.time);
                        setStep(4);
                      }}
                      className="px-4 py-4 rounded-xl border-4 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all font-bold text-lg text-gray-900"
                    >
                      {slot.displayTime}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Enter Details */}
        {step === 4 && (
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <Button onClick={() => {
              setStep(3);
              setSelectedTime(null);
            }} variant="outline" className="mb-6">
              ← Back
            </Button>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Step 4: Confirm Booking</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-xl font-medium text-gray-900 mb-2">📝 What will you use it for?</label>
                <Input {...register("purpose")} placeholder="e.g., Homework, Gaming, Learning" className="h-14 text-lg" />
              </div>

              <div>
                <label className="block text-xl font-medium text-gray-900 mb-2">📋 Additional Notes (Optional)</label>
                <Input {...register("notes")} placeholder="Any special requests?" className="h-14 text-lg" />
                {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-16 text-2xl bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                {isSubmitting ? "Booking..." : "🎉 Confirm Booking!"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
