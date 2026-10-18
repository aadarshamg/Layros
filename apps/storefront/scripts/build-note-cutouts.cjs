/* Split generated transparent atlases without replacing or synthesizing pixels.
   Usage: node scripts/build-note-cutouts.cjs <atlas1.png> ... <atlas4.png> */
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("../../../node_modules/.pnpm/sharp@0.35.4_@types+node@20.19.43/node_modules/sharp");

const sheets = [
  "bergamot lemon orange grapefruit mandarin lime passionfruit mango coconut peach pear apple pineapple watermelon blackcurrant raspberry plum cherry fig lychee jasmine rose ylang-ylang neroli iris",
  "lily-of-the-valley orange-blossom frangipani lavender violet lotus tuberose magnolia geranium mimosa sandalwood cedar oud vetiver patchouli oakmoss vanilla tonka-bean cashmere musk amber benzoin frankincense myrrh leather",
  "saffron cardamom pink-pepper black-pepper cinnamon clove ginger nutmeg mint basil rosemary sage tea tobacco coffee cacao caramel honey almond rice birch papyrus elemi styrax aldehydes",
  "sea-water sea-salt ambergris ambroxan guaiacwood cypress juniper coriander cumin anise fennel balsam pine lily gardenia osmanthus peony freesia hibiscus champaca chamomile davana labdanum raspberry-leaf sugar",
].map((s) => s.split(" "));

async function main() {
  const dest = path.resolve(__dirname, "../public/leyros/ingredients/cutouts");
  const sourceDir = path.resolve(__dirname, "../assets/note-cutout-sources");
  fs.mkdirSync(dest, { recursive: true });
  fs.mkdirSync(sourceDir, { recursive: true });
  for (const [i, input] of process.argv.slice(2).entries()) {
    if (input === "-") continue;
    const original = path.join(sourceDir, `ingredients-${i + 1}.png`);
    if (path.resolve(input) !== original) fs.copyFileSync(input, original);
    const meta = await sharp(original).metadata();
    if (!meta.hasAlpha || meta.width !== meta.height) throw Error("Expected a square RGBA atlas");
    for (const [j, name] of sheets[i].entries()) {
      const col = j % 5, row = Math.floor(j / 5);
      const left = Math.round(col * meta.width / 5), top = Math.round(row * meta.height / 5);
      const width = Math.round((col + 1) * meta.width / 5) - left;
      const height = Math.round((row + 1) * meta.height / 5) - top;
      const cell = await sharp(original).extract({ left, top, width, height }).png().toBuffer();
      await sharp(cell).trim({ threshold: 12 }).resize(192, 160, { fit: "contain", background: "#00000000" }).webp({ quality: 88, alphaQuality: 100 }).toFile(path.join(dest, `${name}.webp`));
    }
    console.log(`Prepared ${sheets[i].length} transparent cutouts from sheet ${i + 1}`);
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
