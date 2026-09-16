import {
  ACESFilmicToneMapping,
  CircleGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OrthographicCamera,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from "three";
import type { HomeOctocatMotion } from "./motion";
import { CanvasOctocatRenderer } from "./canvasRenderer";
import {
  mochiPose,
  CHARACTER_SIZE,
  CHARACTER_ORIGIN_X as OX,
  CHARACTER_ORIGIN_Y as OY,
} from "./pose";

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

/** A single plush body; attached ear pivots provide controlled follow-through. */
export class MochiRig {
  readonly scene = new Scene();
  readonly camera = new OrthographicCamera(
    -OX,
    OX,
    OY,
    OY - CHARACTER_SIZE,
    0.1,
    1000,
  );

  private readonly body = new Group();
  private readonly face = new Group();
  private readonly ears = [new Group(), new Group()];
  private readonly eyes = [new Group(), new Group()];
  private readonly feet: Mesh[] = [];
  private readonly shadow: Mesh<CircleGeometry, MeshBasicMaterial>;
  constructor() {
    this.camera.position.z = 400;
    this.scene.add(new HemisphereLight(0xfff9e9, 0x858379, 2.4));
    const key = new DirectionalLight(0xfff4df, 2.5);
    key.position.set(-60, 130, 180);
    this.scene.add(key);
    const rim = new DirectionalLight(0xb1dccc, 1.4);
    rim.position.set(90, 40, -70);
    this.scene.add(rim);
    const fur = new MeshStandardMaterial({ color: 0xeee0c4, roughness: 0.8 });
    const pink = new MeshStandardMaterial({ color: 0xe5ad99, roughness: 0.95 });
    const dark = new MeshBasicMaterial({ color: 0x343d3c });
    const white = new MeshBasicMaterial({ color: 0xfffef4 });
    const nose = new MeshBasicMaterial({ color: 0xb58479 });
    const sphere = new SphereGeometry(1, 32, 24);
    const ball = (
      parent: Group,
      material: Material,
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
    ball(this.body, fur, 0, 22, 0, 21, 22, 16);
    for (let i = 0; i < 2; i++) {
      const side = i ? 1 : -1;
      const ear = this.ears[i];
      ear.position.set(side * 10, 35, -1);
      ball(ear, fur, 0, 10, 0, 6.5, i ? 17 : 15, 5);
      ball(ear, pink, 0, 12, 4.1, 2.7, i ? 10.5 : 9, 0.9);
      this.body.add(ear);
      this.feet.push(ball(this.body, fur, side * 10, 1, 6, 8, 4.2, 7));
      ball(this.body, fur, side * 17, 13, 5, 4.5, 7, 5);
      ball(this.face, pink, side * 12, 18.5, 12.9, 3.7, 2.2, 1.3);
      const eye = this.eyes[i];
      eye.position.set(side * 6.6, 23, 15.1);
      ball(eye, dark, 0, 0, 0, 2.2, 3, 1.1);
      ball(eye, white, -0.5, 1, 1, 0.65, 0.75, 0.4);
      this.face.add(eye);
    }
    ball(this.face, nose, 0, 17, 15.5, 1.3, 0.95, 0.7);
    for (const side of [-1, 1]) {
      const smile = ball(
        this.face,
        dark,
        side * 1.05,
        14.3,
        15.2,
        1.5,
        0.38,
        0.35,
      );
      smile.rotation.z = side * 0.25;
    }
    this.body.add(this.face);
    this.scene.add(this.body);
    this.shadow = new Mesh(
      new CircleGeometry(1, 32),
      new MeshBasicMaterial({
        color: 0x071716,
        transparent: true,
        opacity: 0.19,
        depthWrite: false,
      }),
    );
    this.shadow.position.set(0, -1, -25);
    this.shadow.scale.set(21, 3, 1);
    this.scene.add(this.shadow);
  }

  update(m: HomeOctocatMotion) {
    const pose = mochiPose(m);
    this.body.position.y = 2 + pose.bob;
    this.body.scale.set(pose.sx, pose.sy, pose.sx);
    this.body.rotation.z = -pose.tilt;
    this.face.position.set(pose.look, -pose.lookY, 0);
    for (let i = 0; i < 2; i++) {
      this.ears[i].rotation.z = -pose.ears[i];
      this.eyes[i].scale.y = pose.blink;
      this.feet[i].position.y = 1 + pose.feet[i];
    }
    this.shadow.visible = m.grounded;
  }

  destroy() {
    const geometries = new Set<BufferGeometry>();
    const materials = new Set<Material>();
    this.scene.traverse((object) => {
      if (object instanceof Mesh) {
        geometries.add(object.geometry);
        (Array.isArray(object.material)
          ? object.material
          : [object.material]
        ).forEach((m) => materials.add(m));
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  }
}

export class HomeOctocatRenderer {
  private readonly renderer: WebGLRenderer;
  private readonly rig = new MochiRig();

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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(CHARACTER_SIZE, CHARACTER_SIZE, false);
    this.renderer.setClearColor(0, 0);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
  }

  render(m: HomeOctocatMotion, alpha = 1) {
    const x =
      m.previousX + (m.x - m.previousX) * alpha + (m.playing ? m.fieldLeft : 0);
    const y =
      m.previousY +
      (m.y - m.previousY) * alpha +
      m.previousCamera +
      (m.camera - m.previousCamera) * alpha;
    this.canvas.style.transform = `translate3d(${x - OX}px,${y - OY}px,0)`;
    this.canvas.style.opacity = m.phase === "over" ? "0" : "1";
    this.rig.update(m);
    this.renderer.render(this.rig.scene, this.rig.camera);
    return { x, y };
  }

  destroy() {
    this.rig.destroy();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
