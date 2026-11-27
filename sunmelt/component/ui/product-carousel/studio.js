import * as THREE from "three";

// Lightformers are luminous softbox surfaces baked into a PMREM environment.
// No external HDRI, no additional visible canvas, no React Three Fiber dependency.
const softboxTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(32, 64, 8, 32, 64, 70);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(.55, "#e9e9e9");
    gradient.addColorStop(1, "#101010");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
};

export const createStudio = (renderer, scene) => {
    const environment = new THREE.Scene();
    environment.background = new THREE.Color(0x666666);
    const texture = softboxTexture();
    const panels = [];
    const lightformer = (position, width, height, intensity) => {
        const material = new THREE.MeshBasicMaterial({
            map: texture, color: new THREE.Color(intensity, intensity, intensity),
            side: THREE.DoubleSide, toneMapped: false,
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
        mesh.position.set(...position);
        mesh.lookAt(0, 0, 0);
        environment.add(mesh);
        panels.push(mesh);
    };
    lightformer([-3, 1.4, 3.1], 1.25, 5.8, 4.5);
    lightformer([3.1, .7, 2.5], 1.0, 4.8, 2.5);
    lightformer([0, 4.5, .6], 4.6, 2.3, 3.1);
    lightformer([1.8, 1, -3.8], .85, 5, 4);
    lightformer([-2.6, -.8, -2.1], 2.6, 2.6, 1.2);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const target = pmrem.fromScene(environment, .035, .1, 30);
    scene.environment = target.texture;
    panels.forEach(panel => {
        panel.geometry.dispose();
        panel.material.dispose();
    });
    texture.dispose();
    pmrem.dispose();

    // Neutral key, softer fill and a subtle backlight complement the environment.
    const addLight = (position, intensity) => {
        const light = new THREE.DirectionalLight(0xffffff, intensity);
        light.position.set(...position);
        scene.add(light);
    };
    addLight([-3, 4, 5], 1.55);
    addLight([4, 1.5, 3], .65);
    addLight([1, 3, -4], 1.35);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbfc3cc, .28));

    return () => {
        scene.environment = null;
        target.dispose();
    };
};

// A soft, projected contact shadow for floating objects, without a shadow-map pass.
export const createContactShadows = (size = 128) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    const center = size / 2;
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, "rgba(55,38,35,0.60)");
    gradient.addColorStop(.3, "rgba(55,38,35,0.39)");
    gradient.addColorStop(.65, "rgba(55,38,35,0.10)");
    gradient.addColorStop(1, "rgba(55,38,35,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    const geometry = new THREE.PlaneGeometry(1.45, .9);
    const materials = [];
    const create = () => {
        const material = new THREE.MeshBasicMaterial({
            map, transparent: true, opacity: .62, depthWrite: false,
            toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1,
        });
        materials.push(material);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = -1.07;
        mesh.renderOrder = -1;
        return mesh;
    };
    return { create, dispose: () => {
        materials.forEach(material => material.dispose());
        geometry.dispose();
        map.dispose();
    } };
};
