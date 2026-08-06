/**
 * Wipe convention and photographer credits from every gallery photo.
 * Use when auto-parsed metadata is wrong and you want to re-tag from scratch.
 *
 * Run:
 *   node scripts/wipe-gallery-credits.mjs              # dry run (default)
 *   node scripts/wipe-gallery-credits.mjs --confirm     # apply changes
 *
 * Options:
 *   --confirm         Actually write to MongoDB (without this, only prints counts)
 *   --conventions     Only clear convention + eventId
 *   --photographers   Only clear photographer
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const COLLECTIONS = {
  galleryItems: "gallery_items",
  galleryVocabulary: "gallery_vocabulary",
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(root, ".env"));

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function getMongoUri() {
  const direct = process.env.MONGODB_URI?.trim();
  if (direct) return stripQuotes(direct);

  const username = process.env.MONGODB_USERNAME?.trim();
  const password = process.env.MONGODB_PASSWORD?.trim();
  const cluster =
    process.env.MONGODB_CLUSTER?.trim() ?? process.env.MONGODB_HOST?.trim();

  if (username && password && cluster) {
    return `mongodb+srv://${encodeURIComponent(stripQuotes(username))}:${encodeURIComponent(stripQuotes(password))}@${stripQuotes(cluster)}`;
  }

  throw new Error(
    "Missing MongoDB config. Set MONGODB_URI (or MONGODB_USERNAME + MONGODB_PASSWORD + MONGODB_CLUSTER) in .env",
  );
}

function parseArgs(argv) {
  const flags = new Set(argv.slice(2));
  const conventionsOnly = flags.has("--conventions");
  const photographersOnly = flags.has("--photographers");
  if (conventionsOnly && photographersOnly) {
    throw new Error("Use at most one of --conventions or --photographers");
  }
  return {
    confirm: flags.has("--confirm"),
    clearConventions: !photographersOnly,
    clearPhotographers: !conventionsOnly,
  };
}

async function main() {
  const { confirm, clearConventions, clearPhotographers } = parseArgs(process.argv);
  const dbName = process.env.MONGODB_DB_NAME?.trim() || "ruutuli";
  const uri = getMongoUri();

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
  });

  await client.connect();
  const db = client.db(dbName);
  const items = db.collection(COLLECTIONS.galleryItems);
  const vocabulary = db.collection(COLLECTIONS.galleryVocabulary);

  const creditFilter = {
    $or: [
      ...(clearConventions
        ? [{ convention: { $exists: true, $nin: [null, ""] } }, { eventId: { $exists: true, $nin: [null, ""] } }]
        : []),
      ...(clearPhotographers
        ? [{ photographer: { $exists: true, $nin: [null, ""] } }]
        : []),
    ],
  };

  const totalItems = await items.countDocuments();
  const affectedItems = await items.countDocuments(creditFilter);

  const conventionCount = clearConventions
    ? await items.countDocuments({ convention: { $exists: true, $nin: [null, ""] } })
    : 0;
  const eventCount = clearConventions
    ? await items.countDocuments({ eventId: { $exists: true, $nin: [null, ""] } })
    : 0;
  const photographerCount = clearPhotographers
    ? await items.countDocuments({ photographer: { $exists: true, $nin: [null, ""] } })
    : 0;

  const vocabFilter = {
    type: {
      $in: [
        ...(clearConventions ? ["convention"] : []),
        ...(clearPhotographers ? ["photographer"] : []),
      ],
    },
  };
  const vocabCount = await vocabulary.countDocuments(vocabFilter);

  console.log("Gallery credit wipe");
  console.log(`  Database:           ${dbName}`);
  console.log(`  Total photos:       ${totalItems}`);
  console.log(`  Photos to update:   ${affectedItems}`);
  if (clearConventions) {
    console.log(`    with convention:  ${conventionCount}`);
    console.log(`    with event link:  ${eventCount}`);
  }
  if (clearPhotographers) {
    console.log(`    with photographer:${photographerCount}`);
  }
  console.log(`  Vocabulary entries: ${vocabCount}`);

  if (!confirm) {
    console.log("\nDry run only — no changes made. Re-run with --confirm to apply.");
    await client.close();
    return;
  }

  const ts = new Date().toISOString();
  const $unset = {};
  if (clearConventions) {
    $unset.convention = "";
    $unset.eventId = "";
  }
  if (clearPhotographers) {
    $unset.photographer = "";
  }

  const itemResult = await items.updateMany(creditFilter, {
    $unset,
    $set: { updatedAt: ts },
  });

  const vocabResult = await vocabulary.deleteMany(vocabFilter);

  console.log("\nDone.");
  console.log(`  Photos updated:     ${itemResult.modifiedCount}`);
  console.log(`  Vocabulary removed: ${vocabResult.deletedCount}`);

  await client.close();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
