// Persistent JSON file storage (data saved to disk)
import fs from "fs";
import path from "path";

const STORAGE_DIR = path.join(process.cwd(), "data");
const EVENT_TYPES_FILE = path.join(STORAGE_DIR, "event-types.json");
const BOOKINGS_FILE = path.join(STORAGE_DIR, "bookings.json");

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

interface EventType {
  id: string;
  userId: string;
  title: string;
  slug: string;
  duration: number;
  description: string | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Booking {
  id: string;
  eventTypeId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  attendeeName: string;
  attendeeEmail: string;
  attendeeTimezone: string;
  attendeeNotes: string | null;
  status: "ACCEPTED" | "CANCELLED" | "PENDING";
  cancelReason: string | null;
  createdAt: Date;
  eventType?: EventType;
}

class PersistentStorage {
  // Load data from JSON file
  private loadEventTypes(): EventType[] {
    try {
      if (fs.existsSync(EVENT_TYPES_FILE)) {
        const data = fs.readFileSync(EVENT_TYPES_FILE, "utf-8");
        const parsed = JSON.parse(data);
        // Convert date strings back to Date objects
        return parsed.map((et: any) => ({
          ...et,
          createdAt: new Date(et.createdAt),
          updatedAt: new Date(et.updatedAt),
        }));
      }
    } catch (error) {
      console.error("Error loading event types:", error);
    }
    return [];
  }

  private saveEventTypes(eventTypes: EventType[]) {
    try {
      fs.writeFileSync(EVENT_TYPES_FILE, JSON.stringify(eventTypes, null, 2));
    } catch (error) {
      console.error("Error saving event types:", error);
    }
  }

  private loadBookings(): Booking[] {
    try {
      if (fs.existsSync(BOOKINGS_FILE)) {
        const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
        const parsed = JSON.parse(data);
        return parsed.map((b: any) => ({
          ...b,
          startTime: new Date(b.startTime),
          endTime: new Date(b.endTime),
          createdAt: new Date(b.createdAt),
        }));
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
    }
    return [];
  }

  private saveBookings(bookings: Booking[]) {
    try {
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
    } catch (error) {
      console.error("Error saving bookings:", error);
    }
  }

  // Event Types
  getEventTypes(userId: string): EventType[] {
    const eventTypes = this.loadEventTypes();
    return eventTypes
      .filter((et) => et.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getEventType(id: string): EventType | undefined {
    const eventTypes = this.loadEventTypes();
    return eventTypes.find((et) => et.id === id);
  }

  getEventTypeBySlug(userId: string, slug: string): EventType | undefined {
    const eventTypes = this.loadEventTypes();
    return eventTypes.find((et) => et.userId === userId && et.slug === slug);
  }

  createEventType(data: Omit<EventType, "id" | "createdAt" | "updatedAt">): EventType {
    const eventTypes = this.loadEventTypes();
    const id = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const eventType: EventType = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    eventTypes.push(eventType);
    this.saveEventTypes(eventTypes);
    console.log("✅ Event type saved to disk:", eventType.title);
    return eventType;
  }

  updateEventType(id: string, data: Partial<EventType>): EventType | null {
    const eventTypes = this.loadEventTypes();
    const index = eventTypes.findIndex((et) => et.id === id);
    if (index === -1) return null;

    const updated = { ...eventTypes[index], ...data, updatedAt: new Date() };
    eventTypes[index] = updated;
    this.saveEventTypes(eventTypes);
    console.log("✅ Event type updated on disk:", updated.title);
    return updated;
  }

  deleteEventType(id: string): boolean {
    const eventTypes = this.loadEventTypes();
    const filtered = eventTypes.filter((et) => et.id !== id);
    if (filtered.length === eventTypes.length) return false;
    this.saveEventTypes(filtered);
    console.log("✅ Event type deleted from disk");
    return true;
  }

  // Bookings
  getBookings(userId: string): Booking[] {
    const bookings = this.loadBookings();
    const eventTypes = this.loadEventTypes();
    return bookings
      .filter((b) => b.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((booking) => ({
        ...booking,
        eventType: eventTypes.find((et) => et.id === booking.eventTypeId),
      }));
  }

  getBooking(id: string): Booking | undefined {
    const bookings = this.loadBookings();
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return undefined;

    const eventTypes = this.loadEventTypes();
    return {
      ...booking,
      eventType: eventTypes.find((et) => et.id === booking.eventTypeId),
    };
  }

  createBooking(
    data: Omit<Booking, "id" | "createdAt" | "status" | "cancelReason">
  ): Booking {
    const bookings = this.loadBookings();
    const id = `bkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const booking: Booking = {
      ...data,
      id,
      status: "ACCEPTED",
      cancelReason: null,
      createdAt: new Date(),
    };
    bookings.push(booking);
    this.saveBookings(bookings);
    console.log("✅ Booking saved to disk:", booking.attendeeName);

    const eventTypes = this.loadEventTypes();
    return {
      ...booking,
      eventType: eventTypes.find((et) => et.id === booking.eventTypeId),
    };
  }

  cancelBooking(id: string, reason: string): Booking | null {
    const bookings = this.loadBookings();
    const index = bookings.findIndex((b) => b.id === id);
    if (index === -1) return null;

    bookings[index] = { ...bookings[index], status: "CANCELLED", cancelReason: reason };
    this.saveBookings(bookings);
    console.log("✅ Booking cancelled on disk");

    const eventTypes = this.loadEventTypes();
    return {
      ...bookings[index],
      eventType: eventTypes.find((et) => et.id === bookings[index].eventTypeId),
    };
  }
}

export const storage = new PersistentStorage();
