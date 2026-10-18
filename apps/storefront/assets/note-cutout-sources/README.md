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

Aliases and phrase matching live in `src/lib/note-images.ts`. Unknown note names
stay text-only rather than receiving an unrelated photo. Add a dedicated cutout
and alias when adding a new ingredient.
