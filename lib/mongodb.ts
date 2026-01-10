import { MongoClient, Db } from "mongodb"

let client: MongoClient | null = null
let db: Db | null = null

const uri = process.env.MONGODB_URI as string
const dbNameEnv = process.env.MONGODB_DB_NAME

if (!uri) {
  throw new Error("MONGODB_URI is not set")
}

function extractDbNameFromUri(connectionString: string): string | null {
  try {
    // Remove query string
    const noQuery = connectionString.split("?")[0]
    // mongodb[+srv]://user:pass@host[:port]/dbname
    const parts = noQuery.split("/")
    const candidate = parts[parts.length - 1]
    if (candidate && !candidate.startsWith("mongodb")) return candidate
    return null
  } catch {
    return null
  }
}

export async function getDb(): Promise<Db> {
  if (db) return db
  if (!client) {
    client = new MongoClient(uri)
  }
  await client.connect()
  const resolvedName = dbNameEnv || extractDbNameFromUri(uri) || "test"
  db = client.db(resolvedName)
  return db
}
