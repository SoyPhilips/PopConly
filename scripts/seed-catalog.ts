// Módulo 2 — siembra inicial del catálogo en MongoDB.
// Uso (cuando tengas Mongo en Oracle o local):
//   npm run db:seed:catalog   (lee MONGODB_URI del .env)
import "dotenv/config";
import { MongoClient } from "mongodb";
import { allTitles } from "../lib/findTitle";
import { slugify } from "../lib/slugs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Falta MONGODB_URI en el entorno.");
  process.exit(1);
}

async function main() {
  const client = new MongoClient(uri as string);
  const db = client.db();
  const col = db.collection("titles");

  let upserted = 0;
  for (const t of allTitles()) {
    const doc = {
      ...t,
      slug: slugify(t.title),
      cast: [],
      videoUrl: "",
      updatedAt: new Date().toISOString(),
    };
    await col.updateOne({ slug: doc.slug }, { $set: doc }, { upsert: true });
    upserted++;
  }

  await col.createIndex({ slug: 1 }, { unique: true });
  // Solo texto en `title`: el compuesto con `genres` (arreglo) lo rechaza Mongo.
  await col.createIndex({ title: "text" });
  await client.close();
  console.log(`Catálogo sembrado: ${upserted} títulos.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
