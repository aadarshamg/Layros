import { createClient } from "@sanity/client";
import { createReadStream, readdirSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const folder = process.argv[2];
const encoder = process.argv[3];
if (!folder || !encoder) throw new Error("Provide the source folder and FFmpeg executable path.");
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || "production",
  apiVersion: "2025-01-01", token: process.env.SANITY_API_TOKEN, useCdn: false,
});
const reels = await client.fetch('*[_type == "shoppableVideo" && _id match "reel-import-*" && !(_id in path("drafts.**"))]{_id,product,order}');
const output = join(folder, "compressed");
mkdirSync(output, { recursive: true });
const results = [];
for (const filename of readdirSync(folder).filter((name) => /\.mp4$/i.test(name))) {
  const id = `reel-import-${createHash("sha256").update(filename).digest("hex").slice(0, 20)}`;
  const reel = reels.find((item) => item._id === id);
  if (!reel) continue;
  const source = join(folder, filename);
  const target = join(output, filename);
  console.log(`Compressing: ${filename}`);
  const encoded = spawnSync(encoder, ["-y", "-v", "error", "-i", source,
    "-map", "0:v:0", "-map", "0:a:0?", "-vf", "scale=w='min(720,iw)':h='min(1280,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
    "-c:v", "libx264", "-preset", "medium", "-crf", "26", "-pix_fmt", "yuv420p", "-r", "30",
    "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", target], { encoding: "utf8" });
  if (encoded.status !== 0) throw new Error(encoded.stderr || "Encoding failed");
  const checked = spawnSync(encoder, ["-v", "error", "-i", target, "-f", "null", "-"], { encoding: "utf8" });
  if (checked.status !== 0 || checked.stderr.trim()) throw new Error(`Decode verification failed: ${checked.stderr}`);
  const originalBytes = statSync(source).size;
  const compressedBytes = statSync(target).size;
  if (compressedBytes >= originalBytes) throw new Error(`Compression did not reduce ${filename}; original admin asset retained.`);
  const asset = await client.assets.upload("file", createReadStream(target), { filename, contentType: "video/mp4" });
  await client.patch(id).set({ videoFile: { _type: "file", asset: { _type: "reference", _ref: asset._id } } }).commit();
  const verified = await client.fetch('*[_id == $id][0]{product,order,"asset":videoFile.asset->_id,"size":videoFile.asset->size}', { id });
  if (verified.asset !== asset._id || verified.size !== compressedBytes || verified.product._ref !== reel.product._ref || verified.order !== reel.order) throw new Error(`Admin verification failed: ${filename}`);
  results.push({ filename, id, originalBytes, compressedBytes, asset: asset._id });
  writeFileSync(join(output, "compression-report.json"), JSON.stringify(results, null, 2));
  console.log(`Updated and verified: ${filename} (${(originalBytes / 1e6).toFixed(1)} MB → ${(compressedBytes / 1e6).toFixed(1)} MB)`);
}
const original = results.reduce((sum, item) => sum + item.originalBytes, 0);
const compressed = results.reduce((sum, item) => sum + item.compressedBytes, 0);
console.log(JSON.stringify({ reels: results.length, originalBytes: original, compressedBytes: compressed, reductionPercent: Math.round((1 - compressed / original) * 100), output }));
