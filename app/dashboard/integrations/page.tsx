"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Check, Plus } from "lucide-react";

export default function IntegrationsPage() {
  const integrations = [
    {
      name: "Google Calendar",
      description: "Sync events and check conflicts with Google Calendar",
      icon: "📅",
      connected: false,
      color: "blue",
    },
    {
      name: "Microsoft Outlook",
      description: "Integrate with Outlook Calendar for seamless scheduling",
      icon: "📧",
      connected: false,
      color: "indigo",
    },
    {
      name: "Zoom",
      description: "Automatically create Zoom meeting links for bookings",
      icon: "🎥",
      connected: false,
      color: "blue",
    },
    {
      name: "Google Meet",
      description: "Generate Google Meet links for virtual meetings",
      icon: "💻",
      connected: false,
      color: "green",
    },
  ];

  const handleConnect = (name: string) => {
    alert(`${name} integration coming soon! For now, you can manually add meeting links in event type settings.`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Integrations
        </h1>
        <p className="text-gray-600 mt-2">Connect your favorite tools and services</p>
      </div>

      {/* Calendar Integrations */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Calendar Sync
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Connect your calendars to automatically check for conflicts and sync events
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.slice(0, 2).map((integration) => (
            <div
              key={integration.name}
              className="bg-white rounded-2xl border-2 border-gray-100 p-6 hover:border-blue-200 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{integration.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                    {integration.connected && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                        <Check className="w-3 h-3" />
                        Connected
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

              <Button
                onClick={() => handleConnect(integration.name)}
                variant={integration.connected ? "outline" : "default"}
                className={
                  !integration.connected
                    ? "w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    : "w-full"
                }
              >
                {integration.connected ? (
                  <>Disconnect</>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Video Conferencing */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">🎥</span>
          Video Conferencing
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Automatically generate meeting links for your bookings
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.slice(2, 4).map((integration) => (
            <div
              key={integration.name}
              className="bg-white rounded-2xl border-2 border-gray-100 p-6 hover:border-blue-200 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{integration.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                    {integration.connected && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                        <Check className="w-3 h-3" />
                        Connected
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

              <Button
                onClick={() => handleConnect(integration.name)}
                variant={integration.connected ? "outline" : "default"}
                className={
                  !integration.connected
                    ? "w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    : "w-full"
                }
              >
                {integration.connected ? (
                  <>Disconnect</>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-2xl border-2 border-blue-100 p-6">
        <h3 className="font-semibold text-blue-900 mb-3">🔧 Coming Soon</h3>
        <p className="text-sm text-blue-800">
          Full OAuth integrations with Google Calendar, Outlook, Zoom, and Google Meet are currently in development.
          For now, you can manually add meeting links in your event type settings.
        </p>
      </div>
    </div>
  );
}
