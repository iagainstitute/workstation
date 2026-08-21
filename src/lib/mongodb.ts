import { MongoClient, Db, Collection, Document } from "mongodb";

const MONGO_URI =
  process.env.MONGODB_URI ||
  "mongodb://iaga_admin:iaga%402026@147.93.30.126:27017/iaga_admin?authSource=admin";
const DB_NAME = "iaga_admin";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(MONGO_URI, {
      maxPoolSize: 20,
      minPoolSize: 2,
    });
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(MONGO_URI, {
    maxPoolSize: 50,
    minPoolSize: 5,
  });
  clientPromise = client.connect();
}

let dbInstance: Db | null = null;

export async function getMongoDb(): Promise<Db> {
  if (dbInstance) return dbInstance;

  const client = await clientPromise;
  dbInstance = client.db(DB_NAME);
  return dbInstance;
}

export async function getCollection<T extends Document = Document>(
  name: string,
): Promise<Collection<T>> {
  const database = await getMongoDb();
  return database.collection<T>(name);
}

export async function closeMongoDb(): Promise<void> {
  dbInstance = null;
}
