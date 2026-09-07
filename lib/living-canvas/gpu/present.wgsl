import { FieldParams, cell_index, signal_color, atmosphere, rectangle_distance, valid_rect, line_distance } from "./field-common.wgsl";
@group(0) @binding(0) var<uniform> params: FieldParams;
@group(0) @binding(1) var<storage, read> source: array<vec4f>;
@group(0) @binding(2) var<storage, read> pressure: array<f32>;
@group(0) @binding(3) var<storage, read> diagnostics: array<vec2f>;

fn sample_field(uv: vec2f) -> vec4f {
  let point = uv * params.grid.xy - 0.5;
  let base = vec2i(floor(point));
  let part = fract(point);
  return mix(mix(source[cell_index(base, params.grid.xy)], source[cell_index(base + vec2i(1, 0), params.grid.xy)], part.x),
    mix(source[cell_index(base + vec2i(0, 1), params.grid.xy)], source[cell_index(base + vec2i(1, 1), params.grid.xy)], part.x), part.y);
}

fn ray_blocked(origin: vec2f, point: vec2f, rect: vec4f) -> f32 {
  // A source inside its own instrument bounds must not shadow itself.
  if (valid_rect(rect) == 0.0 || rectangle_distance(origin, rect) <= 0.0) { return 0.0; }
  var blocked = 0.0;
  for (var i = 1u; i <= 6u; i++) {
    let sample_point = mix(origin, point, f32(i) / 7.0);
    blocked = max(blocked, select(0.0, 1.0, rectangle_distance(sample_point, rect) < 0.0));
  }
  return blocked * valid_rect(rect);
}

fn string_light(uv: vec2f, pulse: vec4f, kind: f32) -> f32 {
  if (kind <= 0.0 || kind > 0.3 || abs(pulse.w) < 0.001 || params.command.w <= 0.0) { return 0.0; }
  let aspect = vec2f(params.viewport.x / max(params.viewport.y, 1.0), 1.0);
  let radius = length((uv - pulse.xy) * aspect);
  let band = exp(-pow((radius - pulse.z * 0.20) * 100.0, 2.0))
    + exp(-pow((radius - pulse.z * 0.16) * 120.0, 2.0)) * 0.42;
  if (band < 0.001) { return 0.0; }
  let blocked = max(max(ray_blocked(pulse.xy, uv, params.hero0), ray_blocked(pulse.xy, uv, params.hero1)),
    max(ray_blocked(pulse.xy, uv, params.hero2), ray_blocked(pulse.xy, uv, params.hero3)));
  return band * exp(-pulse.z / max(params.tuning.w, 0.15)) * abs(pulse.w) * (1.0 - blocked * 0.8) * params.command.w;
}

fn edge(uv: vec2f, rect: vec4f) -> f32 {
  return exp(-abs(rectangle_distance(uv, rect)) * 650.0) * valid_rect(rect);
}

fn connection(uv: vec2f, start: vec4f, end: vec4f, offset: f32) -> f32 {
  let a = (start.xy + start.zw) * 0.5;
  let b = (end.xy + end.zw) * 0.5;
  let travel = fract(params.viewport.z * 0.26 + offset);
  let packet = exp(-length(uv - mix(a, b, travel)) * 420.0);
  let line = exp(-line_distance(uv, a, b) * 800.0) * 0.12;
  return (line + packet) * valid_rect(start) * valid_rect(end);
}

@fragment
fn fs_main(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let uv = position.xy / max(params.viewport.xy, vec2f(1.0));
  let field = sample_field(uv);
  // Microscope views read the real buffers. No CPU readback or synthetic plots.
  let view_mode = params.grid.z;
  if (view_mode > 0.5 && view_mode < 6.5) {
    let index = cell_index(vec2i(uv * params.grid.xy), params.grid.xy);
    var scalar = 0.0;
    if (view_mode < 1.5) {
      let value = clamp(field.xy * 4.0, vec2f(-1.0), vec2f(1.0));
      let brightness = clamp(length(value), 0.0, 1.0);
      return vec4f(vec3f(max(value.x, 0.0), brightness * 0.65, max(value.y, 0.0) + max(-value.x, 0.0) * 0.7), 1.0);
    } else if (view_mode < 2.5) { scalar = diagnostics[index].x * 7.0; }
    else if (view_mode < 3.5) { scalar = diagnostics[index].y * 7.0; }
    else if (view_mode < 4.5) { scalar = pressure[index] * 5.0; }
    else if (view_mode < 5.5) { scalar = -field.z * 5.0; }
    else { scalar = -field.w * 5.0; }
    let color = select(vec3f(0.35, 0.78, 0.83), vec3f(1.0, 0.36, 0.16), scalar > 0.0);
    return vec4f(color * clamp(abs(scalar), 0.0, 1.0), 1.0);
  }
  let quiet = 1.0 - params.interaction.x * 0.5;
  let wake = field.w * (0.12 + params.weather.w * 0.025);
  var energy = (atmosphere(uv, params) + field.z * 0.095 + wake) * params.weather.x * quiet;
  let light = string_light(uv, params.pulse0, params.kinds.x) + string_light(uv, params.pulse1, params.kinds.y)
    + string_light(uv, params.pulse2, params.kinds.z) + string_light(uv, params.pulse3, params.kinds.w);
  if (view_mode > 6.5) { return vec4f(vec3f(1.0, 0.45, 0.22) * clamp(light, 0.0, 1.0), 1.0); }
  energy += light * 0.10;
  let xray = params.interaction.y;
  let scan_y = mix(params.node0.y, params.node2.w, fract(params.viewport.z * 0.11));
  let scan = exp(-abs(uv.y - scan_y) * 320.0);
  let edges = edge(uv, params.node0) + edge(uv, params.node1) + edge(uv, params.node2);
  let packets = connection(uv, params.node0, params.node1, 0.0) + connection(uv, params.node1, params.node2, 0.5);
  let diagram = (edges * (0.3 + scan * 0.7) + packets * 0.6) * xray * 0.12;
  let color = signal_color(params.weather.y + params.weather.w * 0.08);
  return vec4f(color * min(energy, 0.18) + vec3f(0.48, 0.82, 0.85) * diagram, clamp(energy + diagram, 0.0, 0.24));
}
