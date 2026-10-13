import { createClient } from "@sanity/client";
import { createReadStream, readdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const folder = process.argv[2];
const publish = process.argv.includes("--publish");
if (!folder) throw new Error("Provide the source video folder.");
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || "production",
  apiVersion: "2025-01-01", token: process.env.SANITY_API_TOKEN, useCdn: false,
});
const products = await client.fetch('*[_type == "product" && !(_id in path("drafts.**"))]{_id,title,"handle":handle.current}');
const existing = await client.fetch('*[_type == "shoppableVideo" && !(_id in path("drafts.**"))]{_id,order}');
console.log(`Found ${products.length} products and ${existing.length} existing reels.`);
if (process.argv.includes("--remove-import-drafts")) {
  const expected = readdirSync(folder).filter((name) => /\.mp4$/i.test(name)).map((filename) => `drafts.reel-import-${createHash("sha256").update(filename).digest("hex").slice(0, 20)}`);
  const drafts = await client.fetch('*[_type == "shoppableVideo" && _id in $ids]{_id}', { ids: expected });
  let transaction = client.transaction();
  for (const draft of drafts) transaction = transaction.delete(draft._id);
  if (drafts.length) await transaction.commit();
  console.log(`Removed ${drafts.length} unpublished import drafts; published reels unchanged.`);
  process.exit(0);
}
if (process.argv.includes("--verify")) {
  console.log(JSON.stringify(await client.fetch('*[_type == "shoppableVideo" && _id match "reel-import-*" && !(_id in path("drafts.**"))]{_id,order,"product":product->title,"videoUrl":videoFile.asset->url}')));
  process.exit(0);
}
const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const skipped = [];
let order = Math.max(0, ...existing.map((v) => v.order || 0)) + 1;
for (const filename of readdirSync(folder).filter((name) => /\.mp4$/i.test(name))) {
  const name = normalize(filename);
  const aliases = ["angel nikki", "aqualis", "aventine", "femme radiance", "kesar chandan", "crimson 540", "miss stylish", "oud of kashmir"];
  const keyword = aliases.find((alias) => name.includes(alias));
  const candidates = keyword ? products.filter((p) => {
    const title = normalize(p.title);
    return title.includes(keyword) && !/gift|discovery|set of|hamper/.test(title) && (keyword === "kesar chandan" || !/attar/.test(title));
  }) : [];
  if (candidates.length !== 1) {
    skipped.push(filename);
    if (process.argv.includes("--draft-unmatched")) {
      const id = `drafts.reel-import-${createHash("sha256").update(filename).digest("hex").slice(0, 20)}`;
      if (await client.getDocument(id)) { console.log(`Draft exists: ${filename}`); continue; }
      console.log(`Uploading draft: ${filename}`);
      const asset = await client.assets.upload("file", createReadStream(join(folder, filename)), { filename, contentType: "video/mp4" });
      await client.createIfNotExists({ _id: id, _type: "shoppableVideo", title: filename.replace(/\.mp4$/i, ""), videoFile: { _type: "file", asset: { _type: "reference", _ref: asset._id } }, order: order++ });
      console.log(`Saved admin draft: ${filename}`);
    }
    continue;
  }
  const product = candidates[0];
  const id = `reel-import-${createHash("sha256").update(filename).digest("hex").slice(0, 20)}`;
  if (existing.some((v) => v._id === id)) { console.log(`Already imported: ${filename}`); continue; }
  console.log(`${publish ? "Uploading" : "Matched"}: ${filename} -> ${product.title}`);
  if (!publish) continue;
  const asset = await client.assets.upload("file", createReadStream(join(folder, filename)), { filename, contentType: "video/mp4" });
  await client.createIfNotExists({ _id: id, _type: "shoppableVideo", videoFile: { _type: "file", asset: { _type: "reference", _ref: asset._id } }, product: { _type: "reference", _ref: product._id }, order: order++ });
  console.log(`Published: ${filename}`);
}
console.log(JSON.stringify({ unmatched: skipped }));
