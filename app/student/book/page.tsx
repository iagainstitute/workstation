"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogOut, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function StudentBookingPage() {
  const router = useRouter();

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Booking state
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [selectedDesktopId, setSelectedDesktopId] = useState<string>("");
  const [duration, setDuration] = useState<number>(60); // Custom duration in minutes
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);

  // Auto-logout timer (5 minutes)
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(
        () => {
          handleLogout();
        },
        5 * 60 * 1000,
      ); // 5 minutes
    };

    // Reset timer on user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (timeout) clearTimeout(timeout);
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/student/login");
        return;
      }

      setUser(user);

      // Get student profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setStudentProfile(profile);
      setLoading(false);
    } catch (error) {
      console.error("Auth error:", error);
      router.push("/student/login");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/student/login");
  };

  // Fetch data
  const { data: settings } = api.desktop.getSettings.useQuery();
  const { data: types } = api.desktop.getTypes.useQuery();
  const { data: holidays } = api.holiday.list.useQuery({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  });

  // Get today's bookings for the student to show remaining hours
  const { data: todayUsage } = api.allocation.getStudentDailyUsage.useQuery(
    {
      studentId: studentProfile?.id || "",
      date: selectedDate || new Date().toISOString().split("T")[0],
    },
    {
      enabled: !!studentProfile?.id && !!selectedDate,
    }
  );

  // Calculate remaining hours
  const maxHoursPerDay = 3;
  const usedHours = todayUsage?.totalHours || 0;
  const remainingHours = Math.max(0, maxHoursPerDay - usedHours);
  const remainingMinutes = Math.round(remainingHours * 60);

  // Filter to only show basic 2D and 3D types (exclude Pro and Ultra)
  const filteredTypes = types?.filter((type: any) => {
    const name = type.display_name.toLowerCase();
    return (
      (name.includes("2d") || name.includes("3d")) &&
      !name.includes("pro") &&
      !name.includes("ultra")
    );
  });

  const { data: availableDesktops } = api.desktop.listAvailable.useQuery(
    {
      typeId: selectedTypeId || undefined,
      date: selectedDate || undefined,
      time: selectedTime || undefined,
      durationMinutes: duration,
      showAll: true, // Show all desktops including booked ones
    },
    {
      enabled: !!selectedDate && !!selectedTypeId && !!selectedTime,
    },
  );

  // Auto-select first available (not booked) desktop when list changes
  useEffect(() => {
    if (availableDesktops && availableDesktops.length > 0) {
      const firstAvailable = availableDesktops.find((d: any) => !d.isBooked);
      if (firstAvailable) {
        setSelectedDesktopId(firstAvailable.id);
      } else {
        setSelectedDesktopId("");
      }
    } else {
      setSelectedDesktopId("");
    }
  }, [availableDesktops]);

  const checkAvailabilityQuery = api.allocation.checkAvailability.useQuery(
    {
      desktopId: selectedDesktopId,
      startTime: `${selectedDate}T${selectedTime}:00`,
      durationMinutes: duration,
      studentId: studentProfile?.id,
    },
    {
      enabled:
        !!selectedDesktopId &&
        !!selectedDate &&
        !!selectedTime &&
        !!studentProfile,
    },
  );

  const createBooking = api.allocation.create.useMutation({
    onSuccess: (data) => {
      setBookingData(data);
      setBookingSuccess(true);
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  // Generate available dates (only Today and Tomorrow)
  const getAvailableDates = () => {
    const dates = [];
    const holidayDates = new Set(holidays?.map((h: any) => h.date) || []);

    for (let i = 0; i <= 1; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

      // Check if Sunday or Holiday
      const isSunday = dayOfWeek === 0;
      const isHoliday = holidayDates.has(dateStr);
      const isDisabled = isSunday || isHoliday;

      dates.push({
        value: dateStr,
        label: i === 0 ? "Today" : "Tomorrow",
        disabled: isDisabled,
        reason: isSunday ? "Sunday" : isHoliday ? "Holiday" : null,
      });
    }

    return dates.filter((d) => !d.disabled); // Only return non-disabled dates
  };

  // Generate time options (every 15 minutes, ending at 6:30 PM)
  const getTimeOptions = () => {
    const times = [];
    const startHour = 9; // 9 AM
    const endHour = 19; // 7 PM
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const isToday = selectedDate === now.toISOString().split("T")[0];

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        // Stop at 6:30 PM (18:30)
        if (hour === 18 && minute > 30) continue;

        const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        const displayTime = new Date(
          `2000-01-01T${timeStr}`,
        ).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

        // Disable past times if today is selected
        const isPast =
          isToday &&
          (hour < currentHour ||
            (hour === currentHour && minute <= currentMinute));

        times.push({
          value: timeStr,
          label: displayTime,
          disabled: isPast,
        });
      }
    }

    return times;
  };

  const handleBookNow = async () => {
    if (
      !selectedDesktopId ||
      !selectedDate ||
      !selectedTime ||
      !studentProfile
    ) {
      alert("Please fill all required fields");
      return;
    }

    const startDateTime = `${selectedDate}T${selectedTime}:00`;

    createBooking.mutate({
      desktopId: selectedDesktopId,
      studentId: studentProfile.id,
      startTime: startDateTime,
      durationMinutes: duration,
    });
  };

  const handleBackToHome = () => {
    // Reset form to allow booking again
    setSelectedDate("");
    setSelectedTime("");
    setSelectedDesktopId("");
    setSelectedTypeId("");
    setDuration(60);
    setBookingSuccess(false);
    setBookingData(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-2xl font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  if (bookingSuccess && bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-12 text-center shadow-2xl">
            <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Booking Confirmed! 🎉
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your computer is ready for you!
            </p>

            <div className="bg-gray-50 rounded-xl p-6 mb-8 space-y-3 text-left">
              <div className="text-xl text-gray-900">
                <span className="font-bold">Student:</span>{" "}
                {studentProfile?.full_name || studentProfile?.email || "Student"}
              </div>
              <div className="text-xl text-gray-900">
                <span className="font-bold">Computer:</span>{" "}
                {bookingData.desktop?.desktop_name}
              </div>
              <div className="text-xl text-gray-900">
                <span className="font-bold">Date:</span>{" "}
                {new Date(bookingData.start_time).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="text-xl text-gray-900">
                <span className="font-bold">Time:</span>{" "}
                {new Date(bookingData.start_time).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                -{" "}
                {new Date(bookingData.end_time).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>
              <div className="text-xl text-gray-900">
                <span className="font-bold">Duration:</span>{" "}
                {Math.floor(
                  (new Date(bookingData.end_time).getTime() -
                    new Date(bookingData.start_time).getTime()) /
                    (1000 * 60)
                )}{" "}
                minutes
              </div>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleBackToHome}
                size="lg"
                className="w-full text-xl py-6 bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Back to Home
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="lg"
                className="w-full text-xl py-6"
              >
                Logout
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🖥️ Book Your Computer
            </h1>
            <p className="text-gray-600">
              Hello, {studentProfile?.full_name || user?.email}!
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Daily Limit Info */}
      {selectedDate && todayUsage && (
        <div className="max-w-6xl mx-auto mb-4">
          <div
            className={`p-4 rounded-lg border-2 ${
              remainingHours <= 0
                ? "bg-red-50 border-red-300"
                : remainingHours <= 1
                  ? "bg-yellow-50 border-yellow-300"
                  : "bg-blue-50 border-blue-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900 text-lg">
                  Daily Booking Limit: {maxHoursPerDay} hours maximum
                </p>
                <p className="text-gray-700">
                  Used today: {usedHours.toFixed(1)} hours • Remaining:{" "}
                  {remainingHours.toFixed(1)} hours ({remainingMinutes} minutes)
                </p>
              </div>
              {remainingHours <= 0 && (
                <span className="text-red-600 font-bold">❌ Limit Reached</span>
              )}
              {remainingHours > 0 && remainingHours <= 1 && (
                <span className="text-yellow-600 font-bold">⚠️ Low Time</span>
              )}
              {remainingHours > 1 && (
                <span className="text-green-600 font-bold">✅ Available</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Booking Interface */}
      <div className="max-w-6xl mx-auto">
        <Card className="p-8 shadow-xl">
          <div className="space-y-6">
            {/* Select Date, Time & Duration */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Select Date, Time & Duration
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-lg mb-2 text-gray-900 font-semibold">
                    Select Date
                  </Label>
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger className="text-lg h-12">
                      <SelectValue placeholder="Choose a date" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableDates().map((date) => (
                        <SelectItem
                          key={date.value}
                          value={date.value}
                          className="text-lg"
                        >
                          {date.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-lg mb-2 text-gray-900 font-semibold">
                    Select Time
                  </Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger className="text-lg h-12">
                      <SelectValue placeholder="Choose a time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {getTimeOptions().map((time) => (
                        <SelectItem
                          key={time.value}
                          value={time.value}
                          className="text-lg"
                          disabled={time.disabled}
                        >
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-lg mb-2 text-gray-900 font-semibold">
                    Duration
                  </Label>
                  <Select
                    value={duration.toString()}
                    onValueChange={(value) => setDuration(parseInt(value))}
                  >
                    <SelectTrigger className="text-lg h-12">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15" className="text-lg">
                        15 minutes
                      </SelectItem>
                      <SelectItem value="30" className="text-lg">
                        30 minutes
                      </SelectItem>
                      <SelectItem value="45" className="text-lg">
                        45 minutes
                      </SelectItem>
                      <SelectItem value="60" className="text-lg">
                        1 hour
                      </SelectItem>
                      <SelectItem value="90" className="text-lg">
                        1.5 hours
                      </SelectItem>
                      <SelectItem value="120" className="text-lg">
                        2 hours
                      </SelectItem>
                      <SelectItem value="180" className="text-lg">
                        3 hours
                      </SelectItem>
                      <SelectItem value="240" className="text-lg">
                        4 hours
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Select Computer Type (2D or 3D only) */}
            {selectedDate && selectedTime && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Select Computer Type
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {filteredTypes?.map((type: any) => (
                    <Button
                      key={type.id}
                      onClick={() => setSelectedTypeId(type.id)}
                      variant={
                        selectedTypeId === type.id ? "default" : "outline"
                      }
                      size="lg"
                      className="text-2xl h-32 font-bold"
                    >
                      {type.display_name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Show all desktops with booking status */}
            {selectedTypeId &&
              availableDesktops &&
              availableDesktops.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Select Desktop
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableDesktops.map((desktop: any) => (
                      <button
                        key={desktop.id}
                        onClick={() => {
                          if (!desktop.isBooked) {
                            setSelectedDesktopId(desktop.id);
                          }
                        }}
                        disabled={desktop.isBooked}
                        className={`relative p-6 rounded-lg border-2 text-left transition-all ${
                          selectedDesktopId === desktop.id
                            ? "border-blue-500 bg-blue-50"
                            : desktop.isBooked
                              ? "border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed"
                              : "border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-lg font-bold text-gray-900">
                            {desktop.desktop_name}
                          </p>
                          {desktop.isBooked && (
                            <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">
                              BOOKED
                            </span>
                          )}
                          {!desktop.isBooked &&
                            selectedDesktopId === desktop.id && (
                              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                                SELECTED
                              </span>
                            )}
                        </div>
                        {desktop.location && (
                          <p className="text-sm text-gray-600">
                            📍 {desktop.location}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* No computers available message */}
            {selectedTypeId &&
              availableDesktops &&
              availableDesktops.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-semibold">
                    ⚠️ No computers available for this time and type. Please try
                    a different time or type.
                  </p>
                </div>
              )}

            {/* All desktops booked message */}
            {selectedTypeId &&
              availableDesktops &&
              availableDesktops.length > 0 &&
              availableDesktops.every((d: any) => d.isBooked) && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
                  <p className="text-orange-800 font-semibold">
                    ⚠️ All desktops are booked for this time. Please select a
                    different time.
                  </p>
                </div>
              )}

            {/* Availability Check & Book Button */}
            {selectedDesktopId && checkAvailabilityQuery.data && (
              <div>
                {checkAvailabilityQuery.data.isAvailable ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-800 font-semibold text-lg">
                      ✅ Computer is available!
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-800 font-semibold text-lg">
                      ❌ {checkAvailabilityQuery.data.reason}
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleBookNow}
                  disabled={
                    !checkAvailabilityQuery.data.isAvailable ||
                    createBooking.isPending
                  }
                  size="lg"
                  className="w-full text-2xl py-8 bg-gradient-to-r from-green-600 to-blue-600"
                >
                  {createBooking.isPending ? "Booking..." : "🚀 Book Now!"}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
