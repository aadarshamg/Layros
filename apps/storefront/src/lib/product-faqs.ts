import type { PerfumeProduct } from "@leyros/types";
import { concentrationLabel, genderLabel, productCardTitle, productNotePyramid, productShortDescription } from "@/lib/product-labels";
import { formatSize } from "@/lib/format";
import { getProductCouponCategory, isBuyTwoGetOneEligible } from "@/lib/promotions";

export type ProductFaq = { question: string; answer: string };

function list(items: string[]) {
  if (items.length < 2) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

/** Use the editor's own answers first; otherwise use this product's actual data. */
export function getProductFaqs(product: PerfumeProduct): ProductFaq[] {
  const custom = (product.faqs ?? []).flatMap(({ question, answer }) => {
    const q = question.trim(), a = answer.trim();
    return q && a ? [{ question: q, answer: a }] : [];
  });
  if (custom.length) return custom;

  const name = productCardTitle(product);
  const eligible = isBuyTwoGetOneEligible(product);
  const hasNotes = product.details.notesTop.length + product.details.notesHeart.length + product.details.notesBase.length > 0;
  const fragrance = !getProductCouponCategory(product) && (eligible || hasNotes);
  const perfume = fragrance && !/attar/i.test(product.category ?? "");
  const groups = fragrance ? productNotePyramid(product) : [];
  const faqs: ProductFaq[] = [];
  if (groups.length) {
    const notes = groups.map((group) => {
      const layer = group.title === "Head notes" ? "Opening notes" : group.title;
      return `${layer}: ${list(group.notes)}.`;
    }).join(" ");
    faqs.push({ question: `What does ${name} smell like?`, answer: `${name}'s fragrance is built around the following notes. ${notes}` });
    const base = groups.find((group) => group.title === "Base notes");
    const opening = groups.find((group) => group.title === "Head notes");
    const heart = groups.find((group) => group.title === "Heart notes");
    if (opening && base) faqs.push({
      question: `How does ${name} develop as I wear it?`,
      answer: `The opening introduces ${list(opening.notes)}. ${heart ? `The heart brings ${list(heart.notes)}. ` : ""}The dry-down centers on ${list(base.notes)}. How these notes come through can vary on your skin.`,
    });
  } else {
    const description = productShortDescription(product.description, 300);
    if (description) faqs.push({ question: `What is ${name} like?`, answer: description });
  }
  const gender = genderLabel(product);
  if (fragrance && gender) faqs.push({
    question: `Who is ${name} for?`,
    answer: gender === "Unisex" ? `${name} is a unisex fragrance. Choose it if its notes match the scents you enjoy, regardless of gender.` : `${name} is listed in our ${gender.toLowerCase()}'s fragrance collection. Anyone who enjoys its scent profile can wear it.`,
  });
  const occasions = [...new Set((product.highlights ?? []).map((h) => h.title.trim()).filter((title) => title && !/long[\s-]*last|best[\s-]*sell|^new$|^popular$/i.test(title)))];
  if (fragrance && occasions.length) faqs.push({ question: `When should I wear ${name}?`, answer: `Leyros highlights ${name} for ${list(occasions).toLowerCase()}. Use these as starting points and choose the occasions that suit your own style.` });
  const sizes = [...new Set(product.variants.map((v) => formatSize(v.sizeMl, v.sizeLabel)).filter(Boolean))];
  if (sizes.length) faqs.push({ question: `Which sizes can I choose for ${name}?`, answer: `${name} is listed in ${list(sizes)}. Select your preferred option above to see its current price and availability.` });
  if (perfume) {
    faqs.push({ question: `What is the perfume concentration of ${name}?`, answer: `${name}'s concentration is ${concentrationLabel(product.details.concentration)}. You can compare this with other fragrance types in the concentration guide above.` });
    faqs.push({ question: `How long does ${name} last?`, answer: `Leyros perfumes are designed for up to 12 hours of wear. Actual longevity depends on your skin, the weather, and how much you apply.` });
  }
  if (eligible) faqs.push({ question: `Does ${name} qualify for Buy 2, Get 1 Free?`, answer: `Yes. Add ${name} with other eligible perfumes or attars to make a group of three. The lowest-priced item in each group of three is free, and the discount is applied automatically in your bag.` });
  return faqs;
}
