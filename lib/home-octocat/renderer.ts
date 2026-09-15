import {
  ACESFilmicToneMapping,
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  DirectionalLight,
  DynamicDrawUsage,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OrthographicCamera,
  Scene,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";
import { clamp, HomeOctocatMotion, type Limb } from "./motion";
import { CanvasOctocatRenderer } from "./canvasRenderer";

export function createHomeOctocatRenderer(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  canvas.dataset.renderer = context ? "three" : "canvas";
  return context
    ? new HomeOctocatRenderer(canvas, context)
    : new CanvasOctocatRenderer(canvas);
}

const SIZE = 220;
const RINGS = 25;
const SIDES = 8;

/** A persistent tube buffer; rebuilding TubeGeometry each frame creates GC hitches. */
class SoftTube {
  readonly geometry = new BufferGeometry();
  readonly mesh: Mesh;
  private positions = new Float32Array(RINGS * SIDES * 3);
  private normals = new Float32Array(RINGS * SIDES * 3);

  constructor(material: MeshStandardMaterial) {
    const indices: number[] = [];
    for (let r = 0; r < RINGS - 1; r++) {
      for (let s = 0; s < SIDES; s++) {
        const a = r * SIDES + s;
        const b = r * SIDES + ((s + 1) % SIDES);
        indices.push(a, b, a + SIDES, b, b + SIDES, a + SIDES);
      }
    }
    this.geometry.setIndex(indices);
    this.geometry.setAttribute(
      "position",
      new BufferAttribute(this.positions, 3).setUsage(DynamicDrawUsage),
    );
    this.geometry.setAttribute(
      "normal",
      new BufferAttribute(this.normals, 3).setUsage(DynamicDrawUsage),
    );
    this.mesh = new Mesh(this.geometry, material);
    this.mesh.frustumCulled = false;
  }

  private sample(limb: Limb, t: number, axis: "x" | "y") {
    const scaled = clamp(t, 0, 1) * 8;
    const index = Math.min(7, Math.floor(scaled));
    const u = scaled - index;
    const p0 = limb.points[Math.max(0, index - 1)][axis];
    const p1 = limb.points[index][axis];
    const p2 = limb.points[index + 1][axis];
    const p3 = limb.points[Math.min(8, index + 2)][axis];
    return (
      0.5 *
      (2 * p1 +
        (-p0 + p2) * u +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u +
        (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u)
    );
  }

  update(limb: Limb, x: number, y: number) {
    const depth = [-5, 5, -4, 6, 2, 2, -9][limb.index];
    for (let r = 0; r < RINGS; r++) {
      const t = r / (RINGS - 1);
      const cx = this.sample(limb, t, "x") - x;
      const cy = y - this.sample(limb, t, "y");
      const dx =
        this.sample(limb, t + 0.005, "x") - this.sample(limb, t - 0.005, "x");
      const dy =
        this.sample(limb, t - 0.005, "y") - this.sample(limb, t + 0.005, "y");
      const length = Math.hypot(dx, dy) || 1;
      const nx = -dy / length;
      const ny = dx / length;
      const radius =
        (limb.index < 4 ? 4.3 : 3.6) * Math.pow(1 - t, 0.56) + 0.12;
      for (let s = 0; s < SIDES; s++) {
        const a = (s / SIDES) * Math.PI * 2;
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        const i = (r * SIDES + s) * 3;
        this.positions[i] = cx + nx * cos * radius;
        this.positions[i + 1] = cy + ny * cos * radius;
        this.positions[i + 2] = depth + sin * radius;
        this.normals[i] = nx * cos;
        this.normals[i + 1] = ny * cos;
        this.normals[i + 2] = sin;
      }
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.normal.needsUpdate = true;
  }
}

/** Original geometry authored in code, with the reference's large-head / soft-limb proportions. */
export class HomeOctocatRenderer {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera(
    -110,
    110,
    150,
    -70,
    0.1,
    1000,
  );

  private readonly head = new Group();
  private readonly torso: Mesh;
  private readonly eyes = new Group();
  private readonly shadow: Mesh<CircleGeometry, MeshBasicMaterial>;
  private readonly tubes: SoftTube[];

  constructor(
    private readonly canvas: HTMLCanvasElement,
    context: WebGL2RenderingContext,
  ) {
    this.renderer = new WebGLRenderer({
      canvas,
      context,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(SIZE, SIZE, false);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.camera.position.z = 400;
    this.scene.add(new HemisphereLight(0xdcecff, 0x4b5266, 2.4));
    const key = new DirectionalLight(0xfff5e8, 3);
    key.position.set(-70, 150, 180);
    this.scene.add(key);
    const rim = new DirectionalLight(0x8ebcff, 2);
    rim.position.set(90, 35, -80);
    this.scene.add(rim);

    const porcelain = new MeshStandardMaterial({
      color: 0xa7b8ca,
      roughness: 0.48,
      metalness: 0.05,
    });
    const face = new MeshStandardMaterial({ color: 0xe8eef1, roughness: 0.63 });
    const dark = new MeshStandardMaterial({ color: 0x1b283a, roughness: 0.27 });
    const innerEar = new MeshStandardMaterial({
      color: 0x8c9eaf,
      roughness: 0.7,
    });
    const shine = new MeshBasicMaterial({ color: 0xf6fbff });
    const sphere = new SphereGeometry(1, 32, 24);
    const ball = (
      parent: Group | Scene,
      material: MeshStandardMaterial | MeshBasicMaterial,
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
    ) => {
      const mesh = new Mesh(sphere, material);
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      parent.add(mesh);
      return mesh;
    };
    this.torso = ball(this.scene, porcelain, 0, 29, 0, 9.5, 15, 9);
    ball(this.head, porcelain, 0, 0, 0, 23, 21, 16);
    ball(this.head, face, 0, -4, 10, 17.5, 13.5, 8);

    const earShape = new Shape();
    earShape.moveTo(-8, 0);
    earShape.quadraticCurveTo(-9, 7, -7, 17);
    earShape.quadraticCurveTo(-6, 18, 0, 11);
    earShape.quadraticCurveTo(6, 6, 9, 0);
    earShape.closePath();
    const ears = new ExtrudeGeometry(earShape, {
      depth: 5,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 2.5,
      bevelThickness: 3,
      curveSegments: 12,
    });
    ears.translate(0, 0, -4);
    for (const side of [-1, 1]) {
      const ear = new Mesh(ears, porcelain);
      ear.position.set(side * 14, 12, 0);
      ear.scale.x = -side;
      ear.rotation.z = -side * 0.1;
      this.head.add(ear);
      ball(this.head, innerEar, side * 15.5, 21, 4.8, 3.2, 5, 1.5).rotation.z =
        -side * 0.25;
      ball(this.eyes, dark, side * 7.3, -2, 17.5, 2.8, 4.3, 2.2);
      ball(this.eyes, shine, side * 7.3 - 0.75, -0.7, 19.3, 0.85, 1.1, 0.5);
    }
    ball(this.head, dark, 0, -8.2, 18.1, 1.6, 1.1, 1);
    // Tiny cheeks keep the face readable at its actual 70–85 px size.
    ball(this.head, face, -3.8, -10.4, 16.7, 4.7, 2.6, 2);
    ball(this.head, face, 3.8, -10.4, 16.7, 4.7, 2.6, 2);
    this.head.add(this.eyes);
    this.scene.add(this.head);
    this.tubes = Array.from({ length: 7 }, () => new SoftTube(porcelain));
    for (const tube of this.tubes) this.scene.add(tube.mesh);
    this.shadow = new Mesh(
      new CircleGeometry(1, 32),
      new MeshBasicMaterial({
        color: 0x8ca5bd,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    );
    this.shadow.scale.set(27, 2.6, 1);
    this.shadow.position.set(0, -1.5, -30);
    this.scene.add(this.shadow);
  }

  render(m: HomeOctocatMotion, alpha = 1) {
    const x = m.previousX + (m.x - m.previousX) * alpha;
    const y = m.previousY + (m.y - m.previousY) * alpha;
    this.canvas.style.transform = `translate3d(${x - 110}px,${y - 150}px,0)`;
    this.head.position.set(m.head.x - m.x, m.y - m.head.y, 0);
    this.head.rotation.y = m.turn;
    this.head.rotation.z = -m.vx * 0.00055;
    this.head.rotation.x = clamp((m.lookY - (m.y - 50)) / 2000, -0.1, 0.1);
    this.head.scale.set(1 + m.squash * 0.35, 1 - m.squash * 0.4, 1);
    this.torso.position.set(-m.vx * 0.012, 29 - m.squash * 14, -1);
    this.torso.scale.set(9.5 * (1 + m.squash), 15 * (1 - m.squash), 9);
    const blinkPhase = m.time % 4.7;
    this.eyes.scale.y =
      !m.reducedMotion && blinkPhase > 4.52
        ? Math.max(0.08, Math.abs(blinkPhase - 4.61) / 0.09)
        : 1;
    for (let i = 0; i < this.tubes.length; i++)
      this.tubes[i].update(m.limbs[i], m.x, m.y);
    this.shadow.visible = m.grounded;
    this.renderer.render(this.scene, this.camera);
    return { x, y };
  }

  destroy() {
    const geometries = new Set<BufferGeometry>();
    const materials = new Set<MeshStandardMaterial | MeshBasicMaterial>();
    this.scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      geometries.add(object.geometry);
      if (Array.isArray(object.material))
        object.material.forEach((m) =>
          materials.add(m as MeshStandardMaterial),
        );
      else materials.add(object.material as MeshStandardMaterial);
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
