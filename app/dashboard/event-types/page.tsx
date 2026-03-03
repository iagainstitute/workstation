"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, Copy, Edit, Trash2, ExternalLink } from "lucide-react";

export default function EventTypesPage() {
  const { data: session } = useSession();
  const utils = api.useUtils();
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const { data: eventTypes, isLoading } = api.eventType.list.useQuery();
  const deleteMutation = api.eventType.delete.useMutation({
    onSuccess: () => {
      utils.eventType.list.invalidate();
    },
  });

  const copyLink = (slug: string) => {
    const link = `${window.location.origin}/${session?.user?.username || "admin"}/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteMutation.mutateAsync({ id });
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Event Types
          </h1>
          <p className="text-gray-600 mt-2">Create and manage your meeting types</p>
        </div>
        <Link href="/dashboard/event-types/new">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            New Event Type
          </Button>
        </Link>
      </div>

      {/* Event Types Grid */}
      {!eventTypes || eventTypes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-100">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No event types yet</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first event type</p>
          <Link href="/dashboard/event-types/new">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Event Type
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventTypes.map((eventType) => (
            <div
              key={eventType.id}
              className="bg-white rounded-2xl border-2 border-gray-100 p-6 hover:border-blue-200 hover:shadow-lg transition-all"
            >
              {/* Event Type Info */}
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{eventType.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{eventType.duration} min</span>
                  </div>
                  {eventType.location && (
                    <div className="flex items-center gap-1">
                      <ExternalLink className="w-4 h-4" />
                      <span>{eventType.location}</span>
                    </div>
                  )}
                </div>
                {eventType.description && (
                  <p className="text-gray-600 mt-3 text-sm line-clamp-2">{eventType.description}</p>
                )}
              </div>

              {/* Link */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">Public Link:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-blue-600 flex-1 truncate">
                    /{session?.user?.username || "admin"}/{eventType.slug}
                  </code>
                  <button
                    onClick={() => copyLink(eventType.slug)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {copiedSlug === eventType.slug ? (
                      <span className="text-green-600 text-xs font-medium">Copied!</span>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link href={`/dashboard/event-types/${eventType.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => handleDelete(eventType.id, eventType.title)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
