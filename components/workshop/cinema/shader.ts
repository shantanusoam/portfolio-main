import { frame, subscribe, wake } from "./motion";
const vertex = `attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment = `precision mediump float;
varying vec2 uv; uniform sampler2D photo; uniform vec2 resolution; uniform vec2 imageSize; uniform vec2 pointer; uniform float energy; uniform float progress; uniform float mode;
void main(){
 vec2 cover=vec2(min((resolution.x/resolution.y)/(imageSize.x/imageSize.y),1.),min((imageSize.x/imageSize.y)/(resolution.x/resolution.y),1.));
 vec2 p=uv; float dist=distance(p,pointer); float lens=exp(-dist*dist*22.);
 p += (p-pointer)*lens*.025*energy;
 p.x += sin(p.y*28.+progress*7.)*.002*energy;
 vec2 coord=(p-.5)*cover+.5;
 float split=.0006*abs(energy);
 vec3 color=vec3(texture2D(photo,coord+vec2(split,0.)).r,texture2D(photo,coord).g,texture2D(photo,coord-vec2(split,0.)).b);
 if(mode>.5){vec2 grid=abs(fract(p*vec2(32.,20.))-.5);float line=1.-smoothstep(.015,.04,min(grid.x,grid.y));color=mix(color,vec3(.65,.95,.9),line*.23);}
 color=mix(color,color*vec3(.9,.88,1.08),sin(progress*3.14159)*.12);
 gl_FragColor=vec4(color,1.);
}`;
/** A still image remains underneath; no animation loop or context is owned offscreen. */
export function mountShader(
  canvas: HTMLCanvasElement,
  source: string,
  getMode: () => number,
) {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    powerPreference: "low-power",
    preserveDrawingBuffer: false,
  });
  if (!gl) return () => {};
  let disposed = false,
    ready = false,
    hovering = false,
    interaction = 0,
    energy = 0,
    last = 0,
    slow = 0;
  let dpr = Math.min(
    devicePixelRatio,
    matchMedia("(pointer:coarse)").matches ? 1 : 1.5,
  );
  const shaders: WebGLShader[] = [];
  const compile = (type: number, code: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      throw Error("Shader compile failed");
    }
    shaders.push(shader);
    return shader;
  };
  const program = gl.createProgram()!;
  try {
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw Error("Shader link failed");
  } catch {
    shaders.forEach((s) => gl.deleteShader(s));
    gl.deleteProgram(program);
    return () => {};
  }
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniforms = Object.fromEntries(
    ["resolution", "imageSize", "pointer", "energy", "progress", "mode"].map(
      (name) => [name, gl.getUniformLocation(program, name)],
    ),
  );
  const texture = gl.createTexture();
  const image = new Image();
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    wake();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  image.onload = () => {
    if (disposed) return;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    ready = true;
    resize();
  };
  image.src = source;
  let px = 0.5,
    py = 0.5;
  const pointer = (event: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    px = (event.clientX - r.left) / r.width;
    py = 1 - (event.clientY - r.top) / r.height;
    hovering = true;
    interaction = performance.now();
    wake(1800);
  };
  const leave = () => {
    hovering = false;
    wake(900);
  };
  canvas.addEventListener("pointermove", pointer);
  canvas.addEventListener("pointerleave", leave);
  const lost = (event: Event) => {
    event.preventDefault();
    ready = false;
    canvas.style.opacity = "0";
  };
  canvas.addEventListener("webglcontextlost", lost);
  const off = subscribe((f) => {
    if (!ready || document.hidden) return;
    if (!f.enabled) {
      canvas.style.opacity = "0";
      return;
    }
    const dt = f.time - last;
    last = f.time;
    if (dt > 25 && dt < 150) {
      if (++slow > 35 && dpr > 0.75) {
        dpr = 0.75;
        resize();
        slow = 0;
      }
    } else slow = Math.max(0, slow - 1);
    energy +=
      ((hovering
        ? 0.65 * Math.exp(-Math.max(0, f.time - interaction - 100) / 260)
        : 0) +
        f.velocity * 0.4 -
        energy) *
      0.14;
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.imageSize, image.width, image.height);
    gl.uniform2f(uniforms.pointer, px, py);
    gl.uniform1f(uniforms.energy, energy);
    gl.uniform1f(uniforms.progress, f.progress);
    gl.uniform1f(uniforms.mode, getMode());
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    canvas.style.opacity = "1";
  });
  return () => {
    disposed = true;
    off();
    observer.disconnect();
    image.onload = null;
    canvas.removeEventListener("pointermove", pointer);
    canvas.removeEventListener("pointerleave", leave);
    canvas.removeEventListener("webglcontextlost", lost);
    gl.deleteTexture(texture);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    shaders.forEach((s) => gl.deleteShader(s));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}
