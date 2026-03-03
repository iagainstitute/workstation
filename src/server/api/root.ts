import { createTRPCRouter } from "./trpc";
import { authRouter } from "./routers/auth";
import { desktopRouter } from "./routers/desktop";
import { allocationRouter } from "./routers/allocation";
import { holidayRouter } from "./routers/holiday";
// Legacy Cal.com routes (keeping for backward compatibility)
import { eventTypeRouter } from "./routers/eventType";
import { availabilityRouter } from "./routers/availability";
import { bookingRouter } from "./routers/booking";
import { slotRouter } from "./routers/slot";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  // Desktop Booking System
  desktop: desktopRouter,
  allocation: allocationRouter,
  holiday: holidayRouter,
  // Legacy Cal.com routes
  eventType: eventTypeRouter,
  availability: availabilityRouter,
  booking: bookingRouter,
  slot: slotRouter,
});

export type AppRouter = typeof appRouter;
