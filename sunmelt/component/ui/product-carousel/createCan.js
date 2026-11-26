import * as THREE from "three";

export const flavors = [
    { id: "mango", name: "Mango Glow" },
    { id: "peach", name: "Peach Glow" },
    { id: "grapefruit", name: "Grapefruit Fizz" },
    { id: "pomegranate", name: "Pomegranate Aura" },
    { id: "grape", name: "Grape Aura" },
];

export const frontRotation = Math.PI;
const height = 1.48;
const radius = height * (1536 / 1152) / (2 * Math.PI);

// Keep the original UV aspect ratio and use height, not profile arc length, for V.
const lathe = (points, segments, planar = false, top = true) => {
    const geometry = new THREE.LatheGeometry(points.map(([r, y]) =>
        new THREE.Vector2(r * radius, y)), segments);
    const uv = geometry.attributes.uv;
    const position = geometry.attributes.position;
    for (let i = 0; i < uv.count; i++) {
        if (planar) {
            uv.setXY(i, 0.5 + position.getX(i) / (radius * 1.8),
                0.5 + (top ? -1 : 1) * position.getZ(i) / (radius * 1.8));
        } else {
            uv.setY(i, (position.getY(i) + height / 2) / height);
        }
    }
    uv.needsUpdate = true;
    return geometry;
};

const microSurface = () => {
    const size = 64;
    const rough = new Uint8Array(size * size * 4);
    const normal = new Uint8Array(size * size * 4);
    let seed = 42;
    for (let i = 0; i < rough.length; i += 4) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const v = (seed >>> 24) / 255;
        rough.set([225 + v * 28, 225 + v * 28, 225 + v * 28, 255], i);
        normal.set([127 + v * 4, 129 - v * 4, 255, 255], i);
    }
    return [rough, normal].map(data => {
        const texture = new THREE.DataTexture(data, size, size);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(8, 5);
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.generateMipmaps = true;
        texture.needsUpdate = true;
        return texture;
    });
};

const capsule = (w, h) => {
    const s = new THREE.Shape();
    const r = w / 2;
    const y = h / 2 - r;
    s.moveTo(-r, -y);
    s.absarc(0, -y, r, Math.PI, 2 * Math.PI, false);
    s.lineTo(r, y);
    s.absarc(0, y, r, 0, Math.PI, false);
    s.closePath();
    return s;
};

export const createCanAssets = async (renderer, base = "/textures") => {
    const loader = new THREE.TextureLoader();
    const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const paths = [...flavors.map(f => base + "/uv/" + f.id + ".webp"),
        base + "/metal/can-top.png", base + "/metal/can-bottom.png"];
    const loaded = await Promise.allSettled(paths.map(path => loader.loadAsync(path)));
    const failed = paths.filter((_, i) => loaded[i].status === "rejected");
    if (failed.length) {
        loaded.forEach(result => { if (result.status === "fulfilled") result.value.dispose(); });
        throw new Error("Missing textures: " + failed.join(", "));
    }
    const textures = loaded.map(result => result.value);
    textures.forEach(texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = anisotropy;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.needsUpdate = true;
    });
    const segments = 96;
    const [roughnessMap, normalMap] = microSurface();
    const body = lathe([
        [.88,-.74],[.91,-.735],[.95,-.72],[.98,-.695],[.995,-.67],
        [1,-.64],[1,.53],[.999,.57],[.994,.60],[.98,.63],
        [.958,.655],[.932,.68],[.908,.705],[.9,.72],[.9,.74],
    ], segments);
    // Recessed end panels: profile order maintains outward-facing normals.
    const top = lathe([
        [.90,.739],[.89,.727],[.86,.713],[.82,.711],[.80,.719],
        [.76,.723],[.70,.713],[.63,.707],[.4,.707],[0,.707],
    ], segments, true, true);
    const bottom = lathe([
        [0,-.648],[.19,-.65],[.36,-.659],[.53,-.68],[.65,-.705],
        [.73,-.735],[.79,-.749],[.84,-.751],[.88,-.74],
    ], segments, true, false);
    const rim = new THREE.TorusGeometry(radius * .895, .0125, 12, segments);
    const foot = new THREE.TorusGeometry(radius * .825, .010, 10, segments);
    const score = new THREE.TorusGeometry(.064, .0028, 8, 48);
    const rivet = new THREE.SphereGeometry(.023, 20, 10);
    // Extruded pull tab with an actual finger hole and softened edges.
    const tabShape = capsule(.118, .252);
    const hole = new THREE.Path();
    hole.absellipse(0, .063, .036, .043, 0, Math.PI * 2, true);
    tabShape.holes.push(hole);
    const tab = new THREE.ExtrudeGeometry(tabShape, {
        depth: .009, bevelEnabled: true, bevelSize: .004,
        bevelThickness: .003, bevelSegments: 3, curveSegments: 18, steps: 1,
    });
    const geometries = [body, top, bottom, rim, foot, score, rivet, tab];

    // Satin clear-coated printed aluminum; keep all artwork and color textures intact.
    const labels = flavors.map((_, i) => new THREE.MeshPhysicalMaterial({
        map: textures[i], roughness: .46, metalness: .11,
        roughnessMap, normalMap, normalScale: new THREE.Vector2(.055, .055),
        clearcoat: .29, clearcoatRoughness: .42,
        envMapIntensity: .85, emissive: 0xffffff, emissiveMap: textures[i], emissiveIntensity: .10,
    }));
    const metal = new THREE.MeshPhysicalMaterial({
        color: 0xc9cdd1, metalness: .94, roughness: .27,
        roughnessMap, envMapIntensity: 1.15,
    });
    const lid = new THREE.MeshPhysicalMaterial({
        map: textures[5], metalness: .68, roughness: .38,
        envMapIntensity: 1.0, roughnessMap,
    });
    const baseMetal = new THREE.MeshPhysicalMaterial({
        map: textures[6], metalness: .82, roughness: .33,
        envMapIntensity: 1.1, roughnessMap,
    });
    const groove = new THREE.MeshStandardMaterial({
        color: 0x656970, metalness: .72, roughness: .42,
    });
    const createCan = (index) => {
        const travel = new THREE.Group();
        const tilt = new THREE.Group();
        const spin = new THREE.Group();
        travel.name = "carousel-travel";
        tilt.name = "selected-tilt";
        spin.name = "local-y-spin";
        travel.add(tilt);
        tilt.add(spin);
        travel.userData.tilt = tilt;
        travel.userData.spin = spin;
        spin.rotation.y = frontRotation;

        const add = (geometry, material, y = 0, xAngle = 0, z = 0) => {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(0, y, z);
            mesh.rotation.x = xAngle;
            spin.add(mesh);
            return mesh;
        };
        add(body, labels[index]);
        add(top, lid);
        add(bottom, baseMetal);
        add(rim, metal, .744, Math.PI / 2);
        add(foot, metal, -.748, Math.PI / 2);
        // Align modeled hardware to the existing lid artwork (front U = .5).
        const pull = add(tab, metal, .727, -Math.PI / 2);
        pull.rotation.z = 0;
        const opener = add(score, groove, .717, -Math.PI / 2, .114);
        opener.scale.set(.82, 1.07, 1);
        const pin = add(rivet, metal, .748, 0, .02);
        pin.scale.set(1, .27, 1);
        return travel;
    };
    const dispose = () => {
        geometries.forEach(g => g.dispose());
        [...labels, metal, lid, baseMetal, groove].forEach(m => m.dispose());
        [...textures, roughnessMap, normalMap].forEach(t => t.dispose());
    };
    return {
        createCan, dispose,
        preload: () => [...textures, roughnessMap, normalMap].forEach(t => renderer.initTexture(t)),
    };
};
