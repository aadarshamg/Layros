/** Realistic transparent cutouts. Abstract accords use a named visual representation. */
const INGREDIENTS: [string, string[]][] = [
  ["bergamot", ["bergamot"]], ["lemon", ["lemon"]],
  ["orange-blossom", ["orange blossom", "orange flower"]],
  ["orange", ["orange"]], ["grapefruit", ["grapefruit"]],
  ["mandarin", ["mandarin", "tangerine"]], ["lime", ["lime"]],
  ["passionfruit", ["passionfruit", "passion fruit"]], ["mango", ["mango"]],
  ["coconut", ["coconut"]], ["peach", ["peach"]], ["pear", ["pear"]],
  ["apple", ["apple"]], ["pineapple", ["pineapple"]], ["watermelon", ["watermelon"]],
  ["blackcurrant", ["blackcurrant", "black currant", "cassis"]],
  ["raspberry", ["raspberry"]], ["plum", ["plum"]], ["cherry", ["cherry"]],
  ["fig", ["fig"]], ["lychee", ["lychee", "litchi"]],
  ["jasmine", ["jasmine", "jasmin"]], ["rose", ["rose"]],
  ["ylang-ylang", ["ylang ylang", "ylang"]], ["neroli", ["neroli"]],
  ["iris", ["iris", "orris"]], ["lily-of-the-valley", ["lily of the valley", "muguet"]],
  ["frangipani", ["frangipani", "plumeria"]], ["lavender", ["lavender"]],
  ["violet", ["violet"]], ["lotus", ["lotus"]], ["tuberose", ["tuberose"]],
  ["magnolia", ["magnolia"]], ["geranium", ["geranium"]], ["mimosa", ["mimosa"]],
  ["sandalwood", ["sandalwood", "sandal"]], ["cedar", ["cedar", "cedarwood"]],
  ["oud", ["oud", "agarwood", "aoud"]], ["vetiver", ["vetiver", "khus"]],
  ["patchouli", ["patchouli"]], ["oakmoss", ["oakmoss", "oak moss"]],
  ["vanilla", ["vanilla"]], ["tonka-bean", ["tonka", "tonka bean"]],
  ["cashmere", ["cashmere", "cashmeran", "cashmirwood"]], ["musk", ["musk", "musky"]],
  ["amber", ["amber", "ambery"]], ["benzoin", ["benzoin"]],
  ["frankincense", ["frankincense", "olibanum", "incense"]], ["myrrh", ["myrrh"]],
  ["leather", ["leather", "suede"]], ["saffron", ["saffron"]],
  ["cardamom", ["cardamom"]], ["pink-pepper", ["pink pepper", "pink peppercorn"]],
  ["black-pepper", ["black pepper", "pepper"]], ["cinnamon", ["cinnamon"]],
  ["clove", ["clove", "cloves"]], ["ginger", ["ginger"]], ["nutmeg", ["nutmeg"]],
  ["mint", ["mint", "peppermint", "spearmint"]], ["basil", ["basil"]],
  ["rosemary", ["rosemary"]], ["sage", ["sage"]], ["tea", ["tea"]],
  ["tobacco", ["tobacco"]], ["coffee", ["coffee"]], ["cacao", ["cacao", "cocoa", "chocolate"]],
  ["caramel", ["caramel"]], ["honey", ["honey"]], ["almond", ["almond"]],
  ["rice", ["rice"]], ["birch", ["birch"]], ["papyrus", ["papyrus"]],
  ["elemi", ["elemi"]], ["styrax", ["styrax", "storax"]], ["aldehydes", ["aldehyde", "aldehydes"]],
  ["sea-water", ["sea water", "seawater", "marine", "aquatic", "ocean", "sea breeze"]],
  ["sea-salt", ["sea salt", "salt"]], ["ambergris", ["ambergris"]], ["ambroxan", ["ambroxan", "ambrox"]],
  ["guaiacwood", ["guaiacwood", "guaiac wood", "guaiac"]], ["cypress", ["cypress"]],
  ["juniper", ["juniper"]], ["coriander", ["coriander"]], ["cumin", ["cumin"]],
  ["anise", ["anise", "star anise"]], ["fennel", ["fennel"]], ["balsam", ["balsam"]],
  ["pine", ["pine"]], ["lily", ["lily"]], ["gardenia", ["gardenia"]], ["osmanthus", ["osmanthus"]],
  ["peony", ["peony"]], ["freesia", ["freesia"]], ["hibiscus", ["hibiscus"]],
  ["champaca", ["champaca", "champak"]], ["chamomile", ["chamomile", "camomile"]],
  ["davana", ["davana"]], ["labdanum", ["labdanum", "cistus"]],
  ["raspberry-leaf", ["raspberry leaf"]], ["sugar", ["sugar"]],
];

const REPRESENTATIONS: Record<string, string> = {
  musk: "Ambrette seeds and petals representing the musk accord",
  cashmere: "Cashmere wool representing the cashmere accord",
  aldehydes: "Clear droplets and a glass vial representing the aldehydic accord",
  amber: "Amber resin representing the amber accord",
  ambroxan: "Fragrance crystals representing the ambroxan accord",
  "sea-water": "A seawater splash representing the marine accord",
};

const MATCHERS = INGREDIENTS.flatMap(([key, aliases]) => aliases.map((alias) => ({ key, alias, pattern: new RegExp(`\\b${alias}\\b`) })))
  .sort((a, b) => b.alias.length - a.alias.length);

export function getNoteImage(note: string): { src: string; alt: string } | null {
  const normalized = note.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[-–—]/g, " ").replace(/\s+/g, " ").trim();
  // Match the most specific phrase first (orange blossom before orange,
  // raspberry leaf before raspberry), regardless of registry order.
  const match = MATCHERS.find(({ pattern }) => pattern.test(normalized));
  if (!match) return null;
  const key = match.key;
  return { src: `/leyros/ingredients/cutouts/${key}.webp`, alt: REPRESENTATIONS[key] ?? note };
}
