# Ingredient cutouts

Generated with the built-in image generation tool for the product note pyramid.
These are photorealistic generated illustrations, not documentary ingredient photographs.

Prompt brief: square transparent PNG atlas, exactly five equal rows and columns;
25 isolated photorealistic botanical or fragrance ingredient still lifes; uniform soft
studio lighting; no text, labels, circles, frames, grid lines, or background scenery;
each ingredient centered in its own cell with transparent padding. Flowers use
blossoms and a small leaf, fruit uses whole and cut fruit, woods use natural chips.
The exact ingredient order for each atlas is recorded in
`scripts/build-note-cutouts.cjs`.

Abstract notes are represented visually: ambrette seeds for musk, ivory wool for
cashmere, clear droplets and a vial for aldehydes, resin for amber, fragrance
crystals for ambroxan. Accessible image descriptions identify these representations.

Original RGBA atlases are retained here. The preparation script extracts their
grid cells and exports 192 × 160 WebP images with alpha into
`public/leyros/ingredients/cutouts/`. No color-key removal is used.

## October 20 note audit

Expanded the same built-in generation prompt to sheets 5–7 for missing botanical
ingredients, gourmand notes and abstract accords found across 166 live product pages.
The final audit found 48 description-based note pyramids and 200 distinct note
labels; every label resolves to an existing cutout. The library now contains 176
optimized transparent WebP assets. `scripts/check-note-images.cjs` checks spelling,
parentheses, description prose and the two reported missing-image examples.
The exact cell order is recorded in the preparation script. Abstract accords use
clearly identified representative ingredients in their accessible descriptions.
`citron.png` is a separate transparent cutout generated with the prompt: isolated
photorealistic whole yellow Citrus medica and sliced half, thick bumpy rind and
white pith, small green leaf, soft studio light, no text, frame or background.

Aliases and phrase matching live in `src/lib/note-images.ts`. Unknown note names
stay text-only rather than receiving an unrelated photo. Add a dedicated cutout
and alias when adding a new ingredient.
