"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Save, Plus, Trash2 } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState<TimeSlot[]>([
    { day: "Monday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Tuesday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Wednesday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Thursday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Friday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Saturday", startTime: "09:00", endTime: "17:00", enabled: false },
    { day: "Sunday", startTime: "09:00", endTime: "17:00", enabled: false },
  ]);

  const [isSaving, setIsSaving] = useState(false);

  const updateSlot = (index: number, field: keyof TimeSlot, value: string | boolean) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save - in real app, call API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert("Availability saved successfully!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Availability
        </h1>
        <p className="text-gray-600 mt-2">Set your weekly availability for meetings</p>
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
        </div>

        {schedule.map((slot, index) => (
          <div
            key={slot.day}
            className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors"
          >
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={slot.enabled}
              onChange={(e) => updateSlot(index, "enabled", e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />

            {/* Day */}
            <div className="w-32">
              <span className={`font-medium ${slot.enabled ? "text-gray-900" : "text-gray-400"}`}>
                {slot.day}
              </span>
            </div>

            {/* Time Inputs */}
            {slot.enabled ? (
              <>
                <Input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateSlot(index, "startTime", e.target.value)}
                  className="w-32"
                />
                <span className="text-gray-400">to</span>
                <Input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateSlot(index, "endTime", e.target.value)}
                  className="w-32"
                />
              </>
            ) : (
              <span className="text-gray-400">Unavailable</span>
            )}
          </div>
        ))}

        {/* Save Button */}
        <div className="pt-6">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Availability
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-2xl border-2 border-blue-100 p-6">
        <h3 className="font-semibold text-blue-900 mb-3">💡 Tips</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Enable the days you want to accept bookings</li>
          <li>• Set realistic time ranges to avoid back-to-back meetings</li>
          <li>• Consider adding buffer time between meetings in Event Type settings</li>
          <li>• You can override specific dates in Date Overrides (coming soon)</li>
        </ul>
      </div>
    </div>
  );
}
