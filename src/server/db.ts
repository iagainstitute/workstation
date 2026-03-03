// Dummy database object - not used since we use JSON file storage
// This prevents Prisma errors while keeping the code structure intact

export const db = {
  eventType: {
    findMany: async () => { throw new Error("Using JSON storage"); },
    findUnique: async () => { throw new Error("Using JSON storage"); },
    findFirst: async () => { throw new Error("Using JSON storage"); },
    create: async () => { throw new Error("Using JSON storage"); },
    update: async () => { throw new Error("Using JSON storage"); },
    delete: async () => { throw new Error("Using JSON storage"); },
  },
  booking: {
    findMany: async () => { throw new Error("Using JSON storage"); },
    findUnique: async () => { throw new Error("Using JSON storage"); },
    create: async () => { throw new Error("Using JSON storage"); },
    update: async () => { throw new Error("Using JSON storage"); },
    delete: async () => { throw new Error("Using JSON storage"); },
  },
  user: {
    findUnique: async () => { throw new Error("Using JSON storage"); },
    findFirst: async () => { throw new Error("Using JSON storage"); },
    create: async () => { throw new Error("Using JSON storage"); },
  },
} as any;
