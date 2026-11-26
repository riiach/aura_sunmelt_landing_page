# Sunmelt product carousel

The runtime assets are the supplied UV WebP textures (1536 x 1152) and the original PNG metal caps. Keep the paths in the asset kit unchanged:

- public/textures/uv/{mango,peach,grapefruit,pomegranate,grape}.webp
- public/textures/metal/can-top.png
- public/textures/metal/can-bottom.png

Copy the asset kit's public/textures folder into sunmelt/public/textures before running the carousel. No label artwork is generated or rewritten by the component.

Run from sunmelt: npm ci, then npm run dev.

Layout and snap math: node --test component/ui/product-carousel/carouselMath.test.mjs

The existing header is independent of the carousel. The supplied nutrition and barcode content is illustrative, not verified for retail use.
