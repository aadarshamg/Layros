export type CollectionPresentation = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
};

type PresentationInput = {
  handle: string;
  category?: string;
  family?: string;
  gender?: string;
  isNewLaunch?: boolean;
};

const NOTE_PRESENTATIONS: Record<string, Omit<CollectionPresentation, "eyebrow">> = {
  fresh: {
    title: "Fresh • Marine • Citrus Perfumes",
    description: "Made with French-imported perfume oils and premium fixatives, carefully crafted for the Indian climate. Bright citrus, marine, and airy aromatic notes create a fresh, long-lasting, premium, and budget-friendly scent for everyday wear.",
    highlights: ["Bright & refreshing", "Everyday wear", "Made for Indian weather"],
  },
  woody: {
    title: "Woody • Aromatic Perfumes",
    description: "Grounded in elegant woods, aromatic herbs, and warm accents, these perfumes use French-imported oils and premium fixatives for lasting depth. Refined yet easy to wear, they move effortlessly from office hours to evening plans.",
    highlights: ["Warm & refined", "Work to evening", "Long-lasting character"],
  },
  ambry: {
    title: "Ambery Perfumes",
    description: "Warm amber, soft resins, spice, and musk create an enveloping fragrance with rich presence. French-imported perfume oils and quality fixatives give every Leyros blend lasting performance at an accessible price.",
    highlights: ["Warm & enveloping", "Evening ready", "Accessible luxury"],
  },
  floral: {
    title: "Floral • Fruity Perfumes",
    description: "Luminous florals and juicy fruit notes are balanced with French-imported perfume oils and premium fixatives. Smooth, expressive, and long-lasting in the Indian climate, these scents suit daily wear, celebrations, and thoughtful gifting.",
    highlights: ["Bright & expressive", "Day to celebration", "Gift-worthy scents"],
  },
  gourmand: {
    title: "Gourmand • Sweet Perfumes",
    description: "Creamy vanilla, caramel-like sweetness, and warm spice create a deliciously comforting trail. Crafted with French-imported oils and premium fixatives, these long-lasting scents are ideal for evenings, dates, and memorable gifts.",
    highlights: ["Sweet & comforting", "Dates & evenings", "Memorable trail"],
  },
  oriental: {
    title: "Oriental • Spiced Perfumes",
    description: "Layered spices, resins, woods, and soft sweetness give these fragrances a bold, sophisticated character. French-imported oils and premium fixatives deliver impressive longevity for evenings and special occasions.",
    highlights: ["Rich & sophisticated", "Special occasions", "Impressive longevity"],
  },
  oud: {
    title: "Oud Perfumes",
    description: "Deep oud, polished woods, smoke, and spice shape a commanding fragrance experience. Crafted with French-imported perfume oils and premium fixatives, Leyros oud scents offer premium depth, strong presence, and lasting value.",
    highlights: ["Deep & commanding", "Occasion wear", "Premium depth"],
  },
};

const GENDER_PRESENTATIONS: Record<string, Omit<CollectionPresentation, "eyebrow">> = {
  masculine: {
    title: "Perfumes for Men",
    description: "Explore fresh, woody, ambery, and bold signatures made with French-imported perfume oils and premium fixatives. Designed for the Indian climate, these long-lasting scents bring confident, premium character to workdays and evenings alike.",
    highlights: ["Confident profiles", "Day to night", "Premium performance"],
  },
  feminine: {
    title: "Perfumes for Women",
    description: "Discover luminous florals, fresh fruits, warm amber, and elegant woods crafted with French-imported perfume oils and premium fixatives. Expressive and long-lasting, each scent is made for everyday moments and special occasions.",
    highlights: ["Elegant & expressive", "Everyday to occasion", "Long-lasting wear"],
  },
  unisex: {
    title: "Unisex Perfumes",
    description: "Balanced beyond labels, these versatile fragrances blend fresh, woody, floral, and ambery notes with French-imported oils and premium fixatives. Made for the Indian climate, they offer lasting quality and easy everyday appeal.",
    highlights: ["Made for everyone", "Versatile profiles", "Everyday longevity"],
  },
};

function getNoteKey(category: string, family: string) {
  const value = `${family} ${category}`.toLowerCase();
  if (/fresh|marine|citrus/.test(value)) return "fresh";
  if (/woody|aromatic/.test(value)) return "woody";
  if (/ambry|amber/.test(value)) return "ambry";
  if (/floral|fruity/.test(value)) return "floral";
  if (/gourmand|sweet/.test(value)) return "gourmand";
  if (/oriental|spiced/.test(value)) return "oriental";
  if (/oud/.test(value)) return "oud";
  return "";
}

export function getCollectionPresentation({ handle, category = "", family = "", gender = "", isNewLaunch = false }: PresentationInput): CollectionPresentation {
  if (isNewLaunch) {
    return {
      eyebrow: "Fresh from the Leyros atelier",
      title: "New Launch",
      description: "Meet our newest fragrance expressions, crafted with French-imported perfume oils, premium fixatives, and a feel made for the Indian climate.",
      highlights: ["Newly composed", "Premium ingredients", "Made to be remembered"],
    };
  }

  const selectedNote = getNoteKey(category, family);
  if (selectedNote) return { eyebrow: "Explore by fragrance profile", ...NOTE_PRESENTATIONS[selectedNote] };

  const selectedGender = gender.toLowerCase();
  if (GENDER_PRESENTATIONS[selectedGender]) return { eyebrow: "Find a scent that feels like you", ...GENDER_PRESENTATIONS[selectedGender] };

  if (category.toLowerCase() === "collections") {
    return {
      eyebrow: "Every signature, one destination",
      title: "All Perfumes",
      description: "Explore the complete Leyros perfume collection, made with French-imported perfume oils and premium fixatives for expressive, long-lasting wear in the Indian climate.",
      highlights: ["Wide scent variety", "Premium quality", "Budget-friendly luxury"],
    };
  }

  return {
    eyebrow: "Pick a mood. Find your signature.",
    title: handle === "all" ? "Shop All" : handle.replace(/-/g, " "),
    description: "Explore long-lasting perfumes, concentrated attars, candles, and scent-led gifts, crafted with care for the way you actually live.",
    highlights: ["Thoughtfully crafted", "Premium experience", "Made for every mood"],
  };
}
