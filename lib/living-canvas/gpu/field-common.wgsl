export struct FieldParams {
  viewport: vec4f,
  pointer: vec4f,
  koi: vec4f,
  weather: vec4f,
  interaction: vec4f,
  command: vec4f,
  grid: vec4f,
  pulse0: vec4f,
  pulse1: vec4f,
  pulse2: vec4f,
  pulse3: vec4f,
  kinds: vec4f,
  hero0: vec4f,
  hero1: vec4f,
  hero2: vec4f,
  hero3: vec4f,
  node0: vec4f,
  node1: vec4f,
  node2: vec4f,
  tuning: vec4f,
}

export fn signal_color(warmth: f32) -> vec3f {
  return mix(vec3f(0.32, 0.77, 0.84), vec3f(1.0, 0.30, 0.10), clamp(warmth * 0.5 + 0.5, 0.0, 1.0));
}

export fn rectangle_distance(point: vec2f, rect: vec4f) -> f32 {
  let q = abs(point - (rect.xy + rect.zw) * 0.5) - max((rect.zw - rect.xy) * 0.5, vec2f(0.00001));
  return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0);
}

export fn valid_rect(rect: vec4f) -> f32 {
  return select(0.0, 1.0, rect.z > rect.x && rect.w > rect.y);
}

export fn line_distance(point: vec2f, start: vec2f, end: vec2f) -> f32 {
  let edge = end - start;
  let projection = clamp(dot(point - start, edge) / max(dot(edge, edge), 0.000001), 0.0, 1.0);
  return length(point - start - edge * projection);
}

export fn cell_index(point: vec2i, grid: vec2f) -> u32 {
  let safe = clamp(point, vec2i(0), vec2i(grid) - vec2i(1));
  return u32(safe.y) * u32(grid.x) + u32(safe.x);
}

export fn atmosphere(uv: vec2f, p: FieldParams) -> f32 {
  let t = p.viewport.z;
  let wave = sin(uv.y * 42.0 + sin(uv.x * 9.0 + t * 0.12) * 1.6 + t * 0.15);
  let filament = pow(max(0.0, wave), 22.0);
  let local = exp(-length((uv - p.koi.xy) * vec2f(p.viewport.x / max(p.viewport.y, 1.0), 1.0)) * 8.0);
  return (filament * 0.013 + local * 0.018) * p.weather.x;
}
