/* Regression checks plus optional audit of [{description, details?}] catalog JSON.
   Run from apps/storefront: node scripts/check-note-images.cjs [catalog.json] */
const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");

function load(file) {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("exports", "module", code)(mod.exports, mod);
  return mod.exports;
}
const { productNotePyramid } = load("src/lib/product-labels.ts");
const { getNoteImage } = load("src/lib/note-images.ts");
const details = { notesTop: [], notesHeart: [], notesBase: [] };
const notes = (description) => productNotePyramid({ description, details }).flatMap((g) => g.notes);

assert.deepEqual(notes("Head Notes: Saffron and Nutmeg for an instant impact.\nHeart Notes: Oudh.\nBase Notes: Amber, Sandalwood and Vanilla for deep lingering."), ["Saffron", "Nutmeg", "Oudh", "Amber", "Sandalwood", "Vanilla"]);
assert.deepEqual(notes("Top Notes: Sweet Mandarin, Bergamot.\nHeart: Grasse Rose and Jasmine for a soft and floral core.\nBase: Patchouli and Musk for a gentle and lasting finish."), ["Sweet Mandarin", "Bergamot", "Grasse Rose", "Jasmine", "Patchouli", "Musk"]);
assert.deepEqual(notes("Head-Turning Scent: It has a powerful, captivating character.\nTop Notes: Lemon (bright, energetic opening), Mint.\nHeart: Rose.\nBase: Musk."), ["Lemon", "Mint", "Rose", "Musk"]);
assert.deepEqual(notes("This is a top-tier fragrance with a head-turning scent."), []);
assert.equal(getNoteImage("Oudh").src, getNoteImage("Oud").src);
assert(getNoteImage("Pistachio"));
assert(getNoteImage("Mastic or Lentisque"));
assert.equal(getNoteImage("floral core")?.src.endsWith("floral-bouquet.webp"), true);
assert.equal(getNoteImage("Unconfigured ingredient"), null);

if (process.argv[2]) {
  const catalog = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const unique = new Set();
  let pages = 0;
  for (const product of catalog) {
    const groups = productNotePyramid({ ...product, details: { ...details, ...product.details } });
    if (groups.length) pages += 1;
    for (const note of groups.flatMap((group) => group.notes)) {
      unique.add(note);
      const image = getNoteImage(note);
      assert(image, `Missing mapping for ${note} (${product.url ?? product.title ?? ""})`);
      assert(fs.existsSync(`public${image.src}`), `Missing file: ${image.src}`);
    }
  }
  console.log(`Audited ${catalog.length} pages; ${pages} have parsed note pyramids; ${unique.size} unique note labels all have image files.`);
}
console.log("Passed note parsing, alternate spelling, parentheses and prose regression checks.");
