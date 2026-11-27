# Sunmelt product carousel

The runtime assets are the supplied UV WebP textures (1536 x 1152) and the original PNG metal caps. Keep the paths in the asset kit unchanged:

- public/textures/uv/{mango,peach,grapefruit,pomegranate,grape}.webp
- public/textures/metal/can-top.png
- public/textures/metal/can-bottom.png

Copy the asset kit's public/textures folder into sunmelt/public/textures before running the carousel. No label artwork is generated or rewritten by the component.

Run from sunmelt: npm ci, then npm run dev.

Layout and snap math: node --test component/ui/product-carousel/carouselMath.test.mjs

The existing header is independent of the carousel. The supplied nutrition and barcode content is illustrative, not verified for retail use.

## Studio rendering

Can mesh parts are all procedural and share geometry/materials. The UV label files remain unchanged. The travel group owns carousel placement and scale; the tilt group owns a negative 12-degree Z rotation and floating; the spin group owns local Y rotation. At rest only the selected can tilts and floats. Pointer and keyboard interactions retain the existing cyclic snap math. Reduced motion disables the continuous effects and animated snap.

The environment is baked once from luminous softbox lightformer meshes using PMREM. It does not require a downloaded HDRI. Contact shadows use a procedural radial texture instead of an expensive real-time shadow map. Labels use sRGB, anisotropic filtering and mipmaps. The hero uses a CSS module for flavor-specific layered gradients; no global CSS changes.
