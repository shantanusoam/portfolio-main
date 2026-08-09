// Dependency-free seeded procedural generators for portfolio micro-textures.
// Usage: drawContours(document.querySelector('canvas'), { seed: 42 });

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const fade = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

export function makeValueNoise(seed = 1) {
  const rand = mulberry32(seed);
  const cache = new Map();
  const lattice = (x, y) => {
    const key = `${x},${y}`;
    if (!cache.has(key)) cache.set(key, rand() * 2 - 1);
    return cache.get(key);
  };
  return (x, y) => {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const tx = fade(x - x0), ty = fade(y - y0);
    return lerp(
      lerp(lattice(x0, y0), lattice(x0 + 1, y0), tx),
      lerp(lattice(x0, y0 + 1), lattice(x0 + 1, y0 + 1), tx),
      ty
    );
  };
}

export function fbm(noise, x, y, octaves = 5) {
  let sum = 0, amp = .5, freq = 1, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * freq, y * freq);
    norm += amp; amp *= .52; freq *= 2.03;
  }
  return sum / norm;
}

export function drawFibers(canvas, {seed=12, density=3200, orange='#ff5a1f'} = {}) {
  const ctx = canvas.getContext('2d');
  const r = mulberry32(seed); const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h); ctx.lineWidth = 1;
  for (let i=0; i<density; i++) {
    const horizontal = r() > .5;
    const x = r()*w, y=r()*h, len=2+r()*24;
    ctx.strokeStyle = r() < .08 ? `${orange}18` : `rgba(220,214,202,${.015+r()*.04})`;
    ctx.beginPath(); ctx.moveTo(x,y);
    ctx.lineTo(horizontal ? x+len : x, horizontal ? y : y+len);
    ctx.stroke();
  }
}

export function drawOrganicRoute(canvas, {seed=8, color='#ff5a1f', dash=[7,13]} = {}) {
  const ctx = canvas.getContext('2d'); const r=mulberry32(seed);
  const w=canvas.width, h=canvas.height;
  ctx.clearRect(0,0,w,h); ctx.strokeStyle=color; ctx.globalAlpha=.72;
  ctx.lineWidth=1.5; ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(w*.03,h*(.2+r()*.4));
  ctx.bezierCurveTo(w*.2,h*(r()), w*.32,h*(.7+r()*.2), w*.5,h*(.35+r()*.2));
  ctx.bezierCurveTo(w*.68,h*(.05+r()*.25), w*.76,h*(.8+r()*.15), w*.97,h*(.35+r()*.25));
  ctx.stroke(); ctx.globalAlpha=1;
}

export function drawContours(canvas, {seed=42, step=6, levels=12, color='#ff5a1f'} = {}) {
  const ctx = canvas.getContext('2d'); const w=canvas.width, h=canvas.height;
  const noise = makeValueNoise(seed); ctx.clearRect(0,0,w,h);
  const cols=Math.ceil(w/step)+1, rows=Math.ceil(h/step)+1;
  const field=Array.from({length:rows},(_,j)=>Array.from({length:cols},(_,i)=>fbm(noise,i*.055,j*.055,5)));
  ctx.strokeStyle=color; ctx.lineWidth=1;
  // Marching-squares segments. Ambiguous cases use two independent segments.
  const edgePoint=(i,j,e,v)=>{
    const a=[[0,0],[1,0],[1,1],[0,1]], pairs=[[0,1],[1,2],[2,3],[3,0]];
    const [p0,p1]=pairs[e], A=a[p0], B=a[p1];
    const va=field[j+A[1]][i+A[0]], vb=field[j+B[1]][i+B[0]];
    const t=(v-va)/((vb-va)||1e-6);
    return [(i+A[0]+(B[0]-A[0])*t)*step,(j+A[1]+(B[1]-A[1])*t)*step];
  };
  const cases={1:[[3,0]],2:[[0,1]],3:[[3,1]],4:[[1,2]],5:[[3,2],[0,1]],6:[[0,2]],7:[[3,2]],8:[[2,3]],9:[[0,2]],10:[[0,3],[1,2]],11:[[1,2]],12:[[1,3]],13:[[0,1]],14:[[3,0]]};
  for(let l=0;l<levels;l++){
    const v=-.7+l*(1.4/(levels-1)); ctx.globalAlpha=.10+(l%4)*.025;
    ctx.beginPath();
    for(let j=0;j<rows-1;j++) for(let i=0;i<cols-1;i++){
      const bits=(field[j][i]>v?1:0)|(field[j][i+1]>v?2:0)|(field[j+1][i+1]>v?4:0)|(field[j+1][i]>v?8:0);
      const segs=cases[bits]||[];
      for(const [e0,e1] of segs){ const p=edgePoint(i,j,e0,v),q=edgePoint(i,j,e1,v); ctx.moveTo(...p); ctx.lineTo(...q); }
    }
    ctx.stroke();
  }
  ctx.globalAlpha=1;
}
