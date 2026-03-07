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
import { LogOut, CheckCircle2, Calendar, List } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  // Real-time subscription to profile changes
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to profile changes for real-time updates
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          refreshProfile();
        },
      )
      .subscribe();

    // Also refresh when window gains focus
    const handleFocus = () => {
      refreshProfile();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user?.id]);

  const refreshProfile = async () => {
    if (!user?.id) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // Check if student account is active
      if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        alert(
          "Your account has been disabled. Please contact the administrator.",
        );
        router.push("/student/login");
        return;
      }

      setStudentProfile(profile);
    } catch (error) {
      console.error("❌ Profile refresh error:", error);
    }
  };

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

      // Check if student account is active
      if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        alert(
          "Your account has been disabled. Please contact the administrator.",
        );
        router.push("/student/login");
        return;
      }

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
      enabled: !!studentProfile?.id,
      refetchInterval: 5000, // Refresh every 5 seconds to keep usage updated
    },
  );

  // Calculate remaining hours using student's custom time limit
  const maxHoursPerDay = studentProfile?.daily_time_limit_hours || 3;
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
      refetchInterval: 1000, // Auto-refresh every 1 second for instant booking status updates
      refetchOnWindowFocus: true, // Refresh when user comes back to the tab
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

  // Auto-adjust duration if it exceeds remaining time
  useEffect(() => {
    if (selectedDate && remainingMinutes < duration) {
      // Set duration to the highest valid option that fits in remaining time
      if (remainingMinutes >= 180) {
        setDuration(180);
      } else if (remainingMinutes >= 120) {
        setDuration(120);
      } else if (remainingMinutes >= 90) {
        setDuration(90);
      } else if (remainingMinutes >= 60) {
        setDuration(60);
      } else if (remainingMinutes >= 45) {
        setDuration(45);
      } else if (remainingMinutes >= 30) {
        setDuration(30);
      } else if (remainingMinutes >= 15) {
        setDuration(15);
      }
    }
  }, [selectedDate, remainingMinutes]);

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

  // Fetch student's bookings using Supabase directly
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<any>(null);

  const fetchBookings = async () => {
    if (!studentProfile?.id) return;

    setBookingsLoading(true);
    setBookingsError(null);

    try {
      const { data, error } = await supabase
        .from("desktop_allocations")
        .select(
          `
          *,
          desktop:desktops(*)
        `,
        )
        .eq("student_id", studentProfile.id)
        .order("start_time", { ascending: false });

      if (error) throw error;

      setMyBookings(data || []);
    } catch (err: any) {
      console.error("❌ Error fetching bookings:", err);
      setBookingsError(err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const createBooking = api.allocation.create.useMutation({
    onSuccess: (data) => {
      setBookingData(data);
      setBookingSuccess(true);
      // Immediately refresh bookings list
      fetchBookings();
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  // Fetch bookings on mount and when studentProfile changes
  useEffect(() => {
    fetchBookings();

    // Refresh every 5 seconds
    const interval = setInterval(fetchBookings, 5000);
    return () => clearInterval(interval);
  }, [studentProfile?.id]);

  // Generate available dates (always show 2 options: Today/Tomorrow)
  const getAvailableDates = () => {
    const dates = [];
    const holidayDates = new Set(holidays?.map((h: any) => h.date) || []);

    // Find next 2 available dates
    let daysChecked = 0;
    let foundDates = 0;

    while (foundDates < 2 && daysChecked < 7) {
      const date = new Date();
      date.setDate(date.getDate() + daysChecked);
      const dateStr = date.toISOString().split("T")[0];
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

      // Check if Sunday or Holiday
      const isSunday = dayOfWeek === 0;
      const isHoliday = holidayDates.has(dateStr);
      const isDisabled = isSunday || isHoliday;

      if (!isDisabled) {
        // Determine label: Always show "Today" and "Tomorrow"
        const label = foundDates === 0 ? "Today" : "Tomorrow";

        dates.push({
          value: dateStr,
          label: label,
          disabled: false,
          reason: null,
        });
        foundDates++;
      }

      daysChecked++;
    }

    return dates;
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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center border-gray-200 shadow-lg">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Booking Confirmed! 🎉
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Your computer is ready for you!
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3 text-left border border-gray-200">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Student:</span>
                <span className="text-gray-900">
                  {studentProfile?.full_name ||
                    studentProfile?.email ||
                    "Student"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Computer:</span>
                <span className="text-gray-900">
                  {bookingData.desktop?.desktop_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Date:</span>
                <span className="text-gray-900">
                  {new Date(bookingData.start_time).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    },
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Time:</span>
                <span className="text-gray-900">
                  {new Date(bookingData.start_time).toLocaleTimeString(
                    "en-US",
                    {
                      hour: "numeric",
                      minute: "2-digit",
                    },
                  )}{" "}
                  -{" "}
                  {new Date(bookingData.end_time).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Duration:</span>
                <span className="text-gray-900">
                  {Math.floor(
                    (new Date(bookingData.end_time).getTime() -
                      new Date(bookingData.start_time).getTime()) /
                      (1000 * 60),
                  )}{" "}
                  minutes
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleBackToHome}
                size="lg"
                className="w-full h-12 text-base font-semibold bg-[#ee4a62] hover:bg-[#d43f55]"
              >
                Book Another Computer
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="lg"
                className="w-full h-12 text-base font-semibold"
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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-01.png"
              alt="Logo"
              width={1000}
              height={1000}
              className="rounded-lg h-16 w-40 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Book Your Computer
              </h1>
              <p className="text-sm text-gray-600">
                Hello, {studentProfile?.full_name || user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Daily Time Limit</p>
              <p
                className={`text-sm font-semibold ${
                  remainingHours < 0.5
                    ? "text-red-600"
                    : remainingHours <= 1
                      ? "text-orange-600"
                      : "text-green-600"
                }`}
              >
                {usedHours.toFixed(1)}h / {maxHoursPerDay}h used
              </p>
              <p className="text-xs text-gray-600">
                {remainingHours.toFixed(1)}h remaining
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs for Book Desktop and My Bookings */}
      <div className="max-w-5xl mx-auto">
        <Tabs defaultValue="book" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-1 rounded-lg h-14">
            <TabsTrigger
              value="book"
              className="flex items-center justify-center gap-2 text-gray-700 data-[state=active]:bg-[#ee4a62] data-[state=active]:text-white h-12 rounded-md font-medium transition-all"
            >
              <Calendar className="w-5 h-5" />
              Book Desktop
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="flex items-center justify-center gap-2 text-gray-700 data-[state=active]:bg-[#ee4a62] data-[state=active]:text-white h-12 rounded-md font-medium transition-all"
            >
              <List className="w-5 h-5" />
              My Bookings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="book">
            {/* Daily Limit Info */}
            {/* {selectedDate && todayUsage && (
        <div className="max-w-5xl mx-auto mb-6">
          <Card className="p-6 border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Daily Booking Limit
              </h3>
              <span
                className={`text-sm font-medium ${
                  remainingMinutes < 15
                    ? "text-red-600"
                    : remainingHours <= 1
                      ? "text-yellow-600"
                      : "text-green-600"
                }`}
              >
                {remainingHours.toFixed(1)} hours remaining
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className={`h-3 rounded-full transition-all ${
                  remainingMinutes < 15
                    ? "bg-red-500"
                    : remainingHours <= 1
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{
                  width: `${(remainingHours / maxHoursPerDay) * 100}%`,
                }}
              />
            </div>
            <p className="text-sm text-gray-600">
              {usedHours.toFixed(1)} of {maxHoursPerDay} hours used today
            </p>
            {remainingMinutes < 15 && remainingMinutes > 0 && (
              <p className="text-red-600 text-sm font-medium mt-2">
                ⚠️ Not enough time for minimum 15-minute booking
              </p>
            )}
          </Card>
        </div>
      )} */}

            {/* Main Booking Interface */}
            {/* Show error if no time remaining */}
            {selectedDate && remainingMinutes < 15 && (
              <Card className="p-6 mb-6 bg-red-50 border-red-200">
                <h2 className="text-xl font-bold text-red-800 mb-2">
                  ❌ Daily Limit Reached
                </h2>
                <p className="text-red-700">
                  You have used your maximum {maxHoursPerDay} hours for today.
                  Please try again tomorrow!
                </p>
              </Card>
            )}

            <div className="space-y-6">
              {/* Select Date, Time & Duration */}
              <Card className="p-6 border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Select Date, Time & Duration
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Date
                    </Label>
                    <Select
                      value={selectedDate}
                      onValueChange={setSelectedDate}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Choose a date" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableDates().map((date) => (
                          <SelectItem key={date.value} value={date.value}>
                            {date.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Time
                    </Label>
                    <Select
                      value={selectedTime}
                      onValueChange={setSelectedTime}
                      disabled={selectedDate !== "" && remainingMinutes < 15}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Choose a time" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {getTimeOptions().map((time) => (
                          <SelectItem
                            key={time.value}
                            value={time.value}
                            disabled={time.disabled}
                          >
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Duration
                    </Label>
                    <Select
                      value={duration.toString()}
                      onValueChange={(value) => setDuration(parseInt(value))}
                      disabled={selectedDate !== "" && remainingMinutes < 15}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {remainingMinutes >= 15 && (
                          <SelectItem value="15">15 minutes</SelectItem>
                        )}
                        {remainingMinutes >= 30 && (
                          <SelectItem value="30">30 minutes</SelectItem>
                        )}
                        {remainingMinutes >= 45 && (
                          <SelectItem value="45">45 minutes</SelectItem>
                        )}
                        {remainingMinutes >= 60 && (
                          <SelectItem value="60">1 hour</SelectItem>
                        )}
                        {remainingMinutes >= 90 && (
                          <SelectItem value="90">1.5 hours</SelectItem>
                        )}
                        {remainingMinutes >= 120 && (
                          <SelectItem value="120">2 hours</SelectItem>
                        )}
                        {remainingMinutes >= 180 && (
                          <SelectItem value="180">3 hours</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              {/* Select Computer Type (2D or 3D only) */}
              {selectedDate && selectedTime && (
                <Card className="p-6 border-gray-200 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Choose Computer Type
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredTypes?.map((type: any) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedTypeId(type.id)}
                        className={`p-6 rounded-xl border-2 text-left transition-all ${
                          selectedTypeId === type.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
                        }`}
                      >
                        <h3 className="text-xl font-bold text-gray-900">
                          {type.display_name}
                        </h3>
                      </button>
                    ))}
                  </div>
                </Card>
              )}

              {/* Show all desktops with booking status */}
              {selectedTypeId &&
                availableDesktops &&
                availableDesktops.length > 0 && (
                  <Card className="p-6 border-gray-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Select Desktop
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {availableDesktops.map((desktop: any) => (
                        <button
                          key={desktop.id}
                          onClick={() => {
                            if (!desktop.isBooked) {
                              setSelectedDesktopId(desktop.id);
                            }
                          }}
                          disabled={desktop.isBooked}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            selectedDesktopId === desktop.id
                              ? "border-blue-500 bg-blue-50"
                              : desktop.isBooked
                                ? "border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed"
                                : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-semibold text-gray-900">
                              {desktop.desktop_name}
                            </p>
                            {desktop.isBooked && (
                              <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                                BOOKED
                              </span>
                            )}
                            {!desktop.isBooked &&
                              selectedDesktopId === desktop.id && (
                                <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
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
                  </Card>
                )}

              {/* No computers available message */}
              {selectedTypeId &&
                availableDesktops &&
                availableDesktops.length === 0 && (
                  <Card className="p-4 bg-yellow-50 border-yellow-300">
                    <p className="text-yellow-800 font-medium text-sm">
                      ⚠️ No computers available for this time and type. Please
                      try a different time or type.
                    </p>
                  </Card>
                )}

              {/* All desktops booked message */}
              {selectedTypeId &&
                availableDesktops &&
                availableDesktops.length > 0 &&
                availableDesktops.every((d: any) => d.isBooked) && (
                  <Card className="p-4 bg-orange-50 border-orange-300">
                    <p className="text-orange-800 font-medium text-sm">
                      ⚠️ All desktops are booked for this time. Please select a
                      different time.
                    </p>
                  </Card>
                )}

              {/* Availability Check & Book Button */}
              {selectedDesktopId && (
                <div className="space-y-4">
                  {/* Check if selected desktop is booked */}
                  {availableDesktops?.find(
                    (d: any) => d.id === selectedDesktopId,
                  )?.isBooked ? (
                    <Card className="p-4 bg-red-50 border-red-300">
                      <p className="text-red-800 font-medium">
                        ❌ This desktop is already booked for this time slot
                      </p>
                    </Card>
                  ) : checkAvailabilityQuery.data ? (
                    <>
                      {checkAvailabilityQuery.data.isAvailable ? (
                        <Card className="p-4 bg-green-50 border-green-300">
                          <p className="text-green-800 font-medium">
                            ✅ Computer is available!
                          </p>
                        </Card>
                      ) : (
                        <Card className="p-4 bg-red-50 border-red-300">
                          <p className="text-red-800 font-medium">
                            ❌ {checkAvailabilityQuery.data.reason}
                          </p>
                        </Card>
                      )}
                    </>
                  ) : null}

                  <Button
                    onClick={handleBookNow}
                    disabled={
                      !checkAvailabilityQuery.data?.isAvailable ||
                      createBooking.isPending ||
                      availableDesktops?.find(
                        (d: any) => d.id === selectedDesktopId,
                      )?.isBooked
                    }
                    size="lg"
                    className="w-full h-14 text-lg font-semibold bg-[#ee4a62] hover:bg-[#d43f55] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createBooking.isPending ? "Booking..." : "Book Now!"}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bookings">
            <div className="space-y-4">
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  My Bookings
                </h2>

                {bookingsLoading ? (
                  <div className="text-center py-12">
                    <div className="mb-4">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#ee4a62] mx-auto"></div>
                    </div>
                    <p className="text-gray-500">Loading bookings...</p>
                  </div>
                ) : bookingsError ? (
                  <div className="text-center py-12">
                    <p className="text-red-600 mb-2">Error loading bookings</p>
                    <p className="text-sm text-gray-400">
                      {bookingsError.message}
                    </p>
                  </div>
                ) : !myBookings || myBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mb-4">
                      <Calendar className="w-16 h-16 mx-auto text-gray-300" />
                    </div>
                    <p className="text-gray-500 mb-2">No bookings yet</p>
                    <p className="text-sm text-gray-400">
                      Your booking history will appear here after you book a
                      desktop.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myBookings.map((booking: any) => (
                      <Card key={booking.id} className="p-4 border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-xl text-gray-900">
                                {booking.desktop?.desktop_name || "Desktop"}
                              </h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  booking.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : booking.status === "pending"
                                      ? "bg-blue-100 text-blue-700"
                                      : booking.status === "completed"
                                        ? "bg-gray-100 text-gray-700"
                                        : "bg-red-100 text-red-700"
                                }`}
                              >
                                {booking.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Date:</span>{" "}
                                {new Date(
                                  booking.start_time,
                                ).toLocaleDateString()}
                              </div>
                              <div>
                                <span className="font-medium">Time:</span>{" "}
                                {new Date(
                                  booking.start_time,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                -{" "}
                                {new Date(booking.end_time).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span>{" "}
                                {booking.duration_minutes} minutes
                              </div>
                              <div>
                                <span className="font-medium">Type:</span>{" "}
                                {booking.desktop?.desktop_type_id || "N/A"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
