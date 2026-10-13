import { createClient } from "@sanity/client";
const client = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_TOKEN, useCdn: false });
const id = "demo-shoppable-video-1";
const reel = await client.fetch('*[_id == $id][0]{...,"productTitle":product->title}', { id });
if (!reel) { console.log("Reel already unpublished."); process.exit(0); }
if (!/champagne gel candle/i.test(reel.productTitle || "")) throw new Error("Unexpected reel product; no changes made.");
console.log(`Removing published reel: ${reel.productTitle}`);
const { _rev, _createdAt, _updatedAt, productTitle, ...draft } = reel;
await client.transaction().createIfNotExists({ ...draft, _id: `drafts.${id}` }).delete(id).commit();
const published = await client.getDocument(id);
if (published) throw new Error("Reel is still published.");
console.log("Verified: candle reel unpublished; saved in admin drafts.");
