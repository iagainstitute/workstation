"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

const eventTypeSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  slug: z.string().min(1, "URL slug is required").max(100).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  duration: z.number().min(5).max(480),
  description: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
});

type EventTypeForm = z.infer<typeof eventTypeSchema>;

export default function EditEventTypePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: eventType, isLoading } = api.eventType.get.useQuery({ id });
  const utils = api.useUtils();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventTypeForm>({
    resolver: zodResolver(eventTypeSchema),
  });

  const updateMutation = api.eventType.update.useMutation({
    onSuccess: () => {
      utils.eventType.list.invalidate();
      router.push("/dashboard/event-types");
    },
  });

  useEffect(() => {
    if (eventType) {
      setValue("title", eventType.title);
      setValue("slug", eventType.slug);
      setValue("duration", eventType.duration);
      setValue("description", eventType.description || "");
      setValue("location", eventType.location || "");
    }
  }, [eventType, setValue]);

  const onSubmit = async (data: EventTypeForm) => {
    await updateMutation.mutateAsync({ id, ...data });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!eventType) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Event type not found</h3>
        <Link href="/dashboard/event-types">
          <Button>Back to Event Types</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link href="/dashboard/event-types">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event Types
          </Button>
        </Link>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Edit Event Type
        </h1>
        <p className="text-gray-600 mt-2">Update your meeting type settings</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border-2 border-gray-100 p-8 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <Input {...register("title")} placeholder="e.g., 30 Minute Meeting" className="w-full" />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>

        {/* URL Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            URL Slug <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">/</span>
            <Input {...register("slug")} placeholder="30-minute-meeting" className="flex-1" />
          </div>
          {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>}
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Duration (minutes) <span className="text-red-500">*</span>
          </label>
          <Input
            {...register("duration", { valueAsNumber: true })}
            type="number"
            min="5"
            max="480"
            step="5"
            placeholder="30"
            className="w-full"
          />
          {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration.message}</p>}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Location (Optional)</label>
          <Input {...register("location")} placeholder="e.g., Google Meet, Zoom, Office" className="w-full" />
          {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Description (Optional)</label>
          <textarea
            {...register("description")}
            placeholder="Describe what this meeting is about..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSubmitting ? (
              <>Updating...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          <Link href="/dashboard/event-types">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
