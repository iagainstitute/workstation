// Desktop Booking System - Persistent JSON storage
import fs from "fs";
import path from "path";

const STORAGE_DIR = path.join(process.cwd(), "data");
const DESKTOPS_FILE = path.join(STORAGE_DIR, "desktops.json");
const ALLOCATIONS_FILE = path.join(STORAGE_DIR, "allocations.json");
const DESKTOP_TYPES_FILE = path.join(STORAGE_DIR, "desktop-types.json");

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

export type DesktopStatus = "available" | "allocated" | "maintenance" | "inactive";

export interface DesktopType {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
}

export interface Desktop {
  id: string;
  desktopName: string;
  desktopTypeId: string;
  status: DesktopStatus;
  ipAddress: string | null;
  macAddress: string | null;
  specifications: any;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  desktopType?: DesktopType;
}

export interface Allocation {
  id: string;
  desktopId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  purpose: string | null;
  notes: string | null;
  status: "active" | "completed" | "cancelled";
  cancelReason: string | null;
  createdAt: Date;
  desktop?: Desktop;
}

class DesktopStorage {
  // Desktop Types
  private loadDesktopTypes(): DesktopType[] {
    try {
      if (fs.existsSync(DESKTOP_TYPES_FILE)) {
        const data = fs.readFileSync(DESKTOP_TYPES_FILE, "utf-8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.error("Error loading desktop types:", error);
    }
    return this.initializeDesktopTypes();
  }

  private initializeDesktopTypes(): DesktopType[] {
    const defaultTypes: DesktopType[] = [
      {
        id: "type_basic",
        name: "basic",
        displayName: "Basic Computer",
        description: "Standard desktop for basic tasks",
        color: "#3b82f6",
        icon: "💻",
      },
      {
        id: "type_gaming",
        name: "gaming",
        displayName: "Gaming Computer",
        description: "High-performance desktop for gaming",
        color: "#8b5cf6",
        icon: "🎮",
      },
      {
        id: "type_design",
        name: "design",
        displayName: "Design Computer",
        description: "Powerful desktop for graphic design and video editing",
        color: "#ec4899",
        icon: "🎨",
      },
    ];

    this.saveDesktopTypes(defaultTypes);
    return defaultTypes;
  }

  private saveDesktopTypes(types: DesktopType[]) {
    try {
      fs.writeFileSync(DESKTOP_TYPES_FILE, JSON.stringify(types, null, 2));
    } catch (error) {
      console.error("Error saving desktop types:", error);
    }
  }

  getDesktopTypes(): DesktopType[] {
    return this.loadDesktopTypes();
  }

  // Desktops
  private loadDesktops(): Desktop[] {
    try {
      if (fs.existsSync(DESKTOPS_FILE)) {
        const data = fs.readFileSync(DESKTOPS_FILE, "utf-8");
        const parsed = JSON.parse(data);
        return parsed.map((d: any) => ({
          ...d,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt),
        }));
      }
    } catch (error) {
      console.error("Error loading desktops:", error);
    }
    return [];
  }

  private saveDesktops(desktops: Desktop[]) {
    try {
      fs.writeFileSync(DESKTOPS_FILE, JSON.stringify(desktops, null, 2));
    } catch (error) {
      console.error("Error saving desktops:", error);
    }
  }

  getDesktops(): Desktop[] {
    const desktops = this.loadDesktops();
    const types = this.loadDesktopTypes();
    return desktops.map((desktop) => ({
      ...desktop,
      desktopType: types.find((t) => t.id === desktop.desktopTypeId),
    }));
  }

  getDesktop(id: string): Desktop | undefined {
    const desktops = this.loadDesktops();
    const types = this.loadDesktopTypes();
    const desktop = desktops.find((d) => d.id === id);
    if (!desktop) return undefined;
    return {
      ...desktop,
      desktopType: types.find((t) => t.id === desktop.desktopTypeId),
    };
  }

  getAvailableDesktops(typeId?: string): Desktop[] {
    const desktops = this.getDesktops();
    return desktops.filter(
      (d) =>
        d.status === "available" &&
        d.isActive &&
        (!typeId || d.desktopTypeId === typeId)
    );
  }

  createDesktop(
    data: Omit<Desktop, "id" | "createdAt" | "updatedAt">
  ): Desktop {
    const desktops = this.loadDesktops();
    const id = `desk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const desktop: Desktop = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    desktops.push(desktop);
    this.saveDesktops(desktops);
    console.log("✅ Desktop saved to disk:", desktop.desktopName);

    const types = this.loadDesktopTypes();
    return {
      ...desktop,
      desktopType: types.find((t) => t.id === desktop.desktopTypeId),
    };
  }

  updateDesktop(id: string, data: Partial<Desktop>): Desktop | null {
    const desktops = this.loadDesktops();
    const index = desktops.findIndex((d) => d.id === id);
    if (index === -1) return null;

    const updated = { ...desktops[index], ...data, updatedAt: new Date() };
    desktops[index] = updated;
    this.saveDesktops(desktops);
    console.log("✅ Desktop updated on disk:", updated.desktopName);

    const types = this.loadDesktopTypes();
    return {
      ...updated,
      desktopType: types.find((t) => t.id === updated.desktopTypeId),
    };
  }

  deleteDesktop(id: string): boolean {
    const desktops = this.loadDesktops();
    const filtered = desktops.filter((d) => d.id !== id);
    if (filtered.length === desktops.length) return false;
    this.saveDesktops(filtered);
    console.log("✅ Desktop deleted from disk");
    return true;
  }

  // Allocations
  private loadAllocations(): Allocation[] {
    try {
      if (fs.existsSync(ALLOCATIONS_FILE)) {
        const data = fs.readFileSync(ALLOCATIONS_FILE, "utf-8");
        const parsed = JSON.parse(data);
        return parsed.map((a: any) => ({
          ...a,
          startTime: new Date(a.startTime),
          endTime: new Date(a.endTime),
          createdAt: new Date(a.createdAt),
        }));
      }
    } catch (error) {
      console.error("Error loading allocations:", error);
    }
    return [];
  }

  private saveAllocations(allocations: Allocation[]) {
    try {
      fs.writeFileSync(ALLOCATIONS_FILE, JSON.stringify(allocations, null, 2));
    } catch (error) {
      console.error("Error saving allocations:", error);
    }
  }

  getAllocations(): Allocation[] {
    const allocations = this.loadAllocations();
    const desktops = this.loadDesktops();
    const types = this.loadDesktopTypes();

    return allocations
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((allocation) => {
        const desktop = desktops.find((d) => d.id === allocation.desktopId);
        return {
          ...allocation,
          desktop: desktop
            ? {
                ...desktop,
                desktopType: types.find((t) => t.id === desktop.desktopTypeId),
              }
            : undefined,
        };
      });
  }

  getAllocation(id: string): Allocation | undefined {
    const allocations = this.loadAllocations();
    const allocation = allocations.find((a) => a.id === id);
    if (!allocation) return undefined;

    const desktops = this.loadDesktops();
    const types = this.loadDesktopTypes();
    const desktop = desktops.find((d) => d.id === allocation.desktopId);

    return {
      ...allocation,
      desktop: desktop
        ? {
            ...desktop,
            desktopType: types.find((t) => t.id === desktop.desktopTypeId),
          }
        : undefined,
    };
  }

  checkAvailability(
    desktopId: string,
    startTime: Date,
    endTime: Date
  ): boolean {
    const allocations = this.loadAllocations();
    const conflicts = allocations.filter(
      (a) =>
        a.desktopId === desktopId &&
        a.status === "active" &&
        ((startTime >= a.startTime && startTime < a.endTime) ||
          (endTime > a.startTime && endTime <= a.endTime) ||
          (startTime <= a.startTime && endTime >= a.endTime))
    );
    return conflicts.length === 0;
  }

  createAllocation(
    data: Omit<Allocation, "id" | "createdAt" | "status" | "cancelReason">
  ): Allocation {
    const allocations = this.loadAllocations();
    const id = `alloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const allocation: Allocation = {
      ...data,
      id,
      status: "active",
      cancelReason: null,
      createdAt: new Date(),
    };
    allocations.push(allocation);
    this.saveAllocations(allocations);
    console.log("✅ Desktop allocation saved:", allocation.studentName);

    const desktops = this.loadDesktops();
    const types = this.loadDesktopTypes();
    const desktop = desktops.find((d) => d.id === allocation.desktopId);

    return {
      ...allocation,
      desktop: desktop
        ? {
            ...desktop,
            desktopType: types.find((t) => t.id === desktop.desktopTypeId),
          }
        : undefined,
    };
  }

  cancelAllocation(id: string, reason: string): Allocation | null {
    const allocations = this.loadAllocations();
    const index = allocations.findIndex((a) => a.id === id);
    if (index === -1) return null;

    allocations[index] = {
      ...allocations[index],
      status: "cancelled",
      cancelReason: reason,
    };
    this.saveAllocations(allocations);
    console.log("✅ Allocation cancelled on disk");

    const desktops = this.loadDesktops();
    const types = this.loadDesktopTypes();
    const desktop = desktops.find((d) => d.id === allocations[index].desktopId);

    return {
      ...allocations[index],
      desktop: desktop
        ? {
            ...desktop,
            desktopType: types.find((t) => t.id === desktop.desktopTypeId),
          }
        : undefined,
    };
  }
}

export const desktopStorage = new DesktopStorage();
