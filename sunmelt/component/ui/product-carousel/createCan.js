import * as THREE from "three";

export const flavors = [
    { id: "mango", name: "Mango Glow" },
    { id: "peach", name: "Peach Glow" },
    { id: "grapefruit", name: "Grapefruit Fizz" },
    { id: "pomegranate", name: "Pomegranate Aura" },
    { id: "grape", name: "Grape Aura" },
];

export const frontRotation = Math.PI;

export const createCanAssets = async (renderer, base = "/textures") => {
    const loader = new THREE.TextureLoader();
    const loaded = await Promise.allSettled([
        ...flavors.map(flavor => loader.loadAsync(base + "/uv/" + flavor.id + ".webp")),
        loader.loadAsync(base + "/metal/can-top.png"),
        loader.loadAsync(base + "/metal/can-bottom.png"),
    ]);

    if (loaded.some(result => result.status === "rejected")) {
        loaded.forEach(result => {
            if (result.status === "fulfilled") result.value.dispose();
        });
        throw new Error("Sunmelt textures could not be loaded.");
    }

    const textures = loaded.map(result => result.value);
    textures.forEach(texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        texture.needsUpdate = true;
        renderer.initTexture(texture);
    });

    // Match label circumference to the supplied 1536 x 1152 UV ratio.
    const height = 1.48;
    const radius = height * (1536 / 1152) / (2 * Math.PI);
    const ratio = radius / 0.32;
    const profile = [
        [0.285, -0.74], [0.305, -0.72], [0.32, -0.675],
        [0.32, 0.60], [0.318, 0.64], [0.306, 0.69], [0.285, 0.74],
    ].map(([x, y]) => new THREE.Vector2(x * ratio, y));

    const bodyGeometry = new THREE.LatheGeometry(profile, 96);
    const uv = bodyGeometry.attributes.uv;
    const positions = bodyGeometry.attributes.position;

    for (let i = 0; i < uv.count; i++) {
        uv.setY(i, (positions.getY(i) + height / 2) / height);
    }
    uv.needsUpdate = true;

    const capGeometry = new THREE.CircleGeometry(0.287 * ratio, 96);
    const rimGeometry = new THREE.TorusGeometry(0.287 * ratio, 0.013, 12, 96);

    // Unlit sRGB materials preserve original label colors and noise.
    const labels = flavors.map((_, index) => new THREE.MeshBasicMaterial({
        map: textures[index], toneMapped: false,
    }));
    const topMaterial = new THREE.MeshBasicMaterial({
        map: textures[flavors.length], toneMapped: false,
    });
    const bottomMaterial = new THREE.MeshBasicMaterial({
        map: textures[flavors.length + 1], toneMapped: false,
    });
    const rimMaterial = new THREE.MeshStandardMaterial({
        color: 0xbfc3c7, metalness: 0.15, roughness: 0.6,
    });

    const createCan = (index) => {
        const can = new THREE.Group();
        can.add(new THREE.Mesh(bodyGeometry, labels[index]));

        for (const [y, sign, material] of [
            [0.745, 1, topMaterial], [-0.745, -1, bottomMaterial],
        ]) {
            const cap = new THREE.Mesh(capGeometry, material);
            cap.rotation.x = -sign * Math.PI / 2;
            cap.position.y = y;
            can.add(cap);

            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            rim.rotation.x = Math.PI / 2;
            rim.position.y = y;
            can.add(rim);
        }

        can.rotation.y = frontRotation;
        return can;
    };

    const dispose = () => {
        [bodyGeometry, capGeometry, rimGeometry].forEach(geometry => geometry.dispose());
        [...labels, topMaterial, bottomMaterial, rimMaterial].forEach(material => material.dispose());
        textures.forEach(texture => texture.dispose());
    };

    return { createCan, dispose };
};
