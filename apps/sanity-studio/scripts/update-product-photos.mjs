import { createClient } from '@sanity/client';
import { createReadStream, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const folder = process.argv[2];
if (!folder) throw new Error('Provide the image folder.');
const apply = process.argv.includes('--apply');
const square = process.argv.includes('--square');
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || 'production',
  apiVersion: '2025-01-01', token: process.env.SANITY_API_TOKEN, useCdn: false,
});
const mappings = [
  { match: /kesar.*chandan/i, files: ['1 (3).png', '2 (3).png', '3 (3).png'] },
  { match: /^hawas.*the marine/i, files: ['hf_20261009_195553_58039fc2-c3be-4fd8-bc15-b708c743b175 (1).png'] },
  { match: /dark.*cherry/i, files: ['hf_20261020_154521_a0938d3e-be6b-41ed-bd17-b3b788b5062f.png'] },
  { match: /maracuja.*wood/i, files: ['hf_20261020_154802_2b5fb7f4-b77a-44fc-a21b-af25193c2bc4.png'] },
];
const originalFiles = mappings.flatMap(mapping => mapping.files);
const replacedRefs = new Set(process.argv.includes('--replace-import')
  ? await client.fetch('*[_type == "sanity.imageAsset" && originalFilename in $files]._id', { files: originalFiles }) : []);
if (square) for (const mapping of mappings) mapping.files = mapping.files.map(file => file.replace(/\.png$/i, '.webp'));
const products = await client.fetch('*[_type == "product" && !(_id in path("drafts.**"))]{_id,_rev,title,images}');
const plans = mappings.map(mapping => {
  const matches = products.filter(p => mapping.match.test(p.title) && !/gift|combo|pack|discovery|set/i.test(p.title));
  if (matches.length !== 1) throw new Error(`Expected one match for ${mapping.match}: ${matches.map(p => p.title).join(', ')}`);
  for (const file of mapping.files) if (!existsSync(join(folder, file))) throw new Error(`Missing ${file}`);
  return { ...mapping, product: matches[0] };
});
for (const plan of plans) console.log(`${plan.product.title}: ${plan.files.join(', ')}`);
if (apply) {
  const backup = join(tmpdir(), `leyros-product-photos-${Date.now()}.json`);
  writeFileSync(backup, JSON.stringify(plans.map(p => p.product), null, 2));
  console.log(`Previous galleries saved: ${backup}`);
  for (const plan of plans) {
    const images = [];
    for (const filename of plan.files) {
      const asset = await client.assets.upload('image', createReadStream(join(folder, filename)), { filename });
      images.push({ _type: 'image', _key: asset._id.slice(6, 26), alt: plan.product.title, asset: { _type: 'reference', _ref: asset._id } });
    }
    // Keep the previous gallery available after the new photos.
    const refs = new Set(images.map(i => i.asset._ref));
    const retained = (plan.product.images || []).filter(i => !refs.has(i.asset?._ref) && !replacedRefs.has(i.asset?._ref));
    await client.patch(plan.product._id).ifRevisionId(plan.product._rev).set({ images: [...images, ...retained] }).commit();
    const saved = await client.getDocument(plan.product._id);
    if (!images.every((image, i) => saved.images[i].asset._ref === image.asset._ref)) throw new Error(`Verification failed: ${plan.product.title}`);
    console.log(`Updated and verified: ${plan.product.title} (${images.length} new images)`);
  }
}
