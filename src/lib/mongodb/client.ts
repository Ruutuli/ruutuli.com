import "server-only";

import { MongoClient } from "mongodb";

const options = {
  serverSelectionTimeoutMS: 10_000,
  connectTimeoutMS: 10_000,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let moduleClientPromise: Promise<MongoClient> | undefined;

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function getUri(): string {
  const direct = process.env.MONGODB_URI?.trim();
  if (direct) return stripQuotes(direct);

  const username = process.env.MONGODB_USERNAME?.trim();
  const password = process.env.MONGODB_PASSWORD?.trim();
  const cluster = process.env.MONGODB_CLUSTER?.trim() ?? process.env.MONGODB_HOST?.trim();

  if (username && password && cluster) {
    return `mongodb+srv://${encodeURIComponent(stripQuotes(username))}:${encodeURIComponent(stripQuotes(password))}@${stripQuotes(cluster)}`;
  }

  throw new Error(
    "Missing MongoDB configuration. Set MONGODB_URI (or MONGODB_USERNAME + MONGODB_PASSWORD + MONGODB_CLUSTER) in .env, save, and restart the dev server.",
  );
}

function createClientPromise(): Promise<MongoClient> {
  const client = new MongoClient(getUri(), options);
  return client.connect();
}

export default function getMongoClient(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = createClientPromise();
    }
    return global._mongoClientPromise;
  }

  if (!moduleClientPromise) {
    moduleClientPromise = createClientPromise();
  }
  return moduleClientPromise;
}
