import { FieldParams, cell_index } from "./field-common.wgsl";

@group(0) @binding(0) var<uniform> params: FieldParams;
@group(0) @binding(1) var<storage, read> source: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> destination: array<vec4f>;

fn sample_field(point: vec2f) -> vec4f {
  let base = vec2i(floor(point));
  let part = fract(point);
  return mix(
    mix(source[cell_index(base, params.grid.xy)], source[cell_index(base + vec2i(1, 0), params.grid.xy)], part.x),
    mix(source[cell_index(base + vec2i(0, 1), params.grid.xy)], source[cell_index(base + vec2i(1, 1), params.grid.xy)], part.x), part.y);
}

fn pulse_impulse(uv: vec2f, pulse: vec4f, kind: f32) -> vec4f {
  if (abs(pulse.w) < 0.001) { return vec4f(0.0); }
  let delta = (uv - pulse.xy) * vec2f(params.viewport.x / max(params.viewport.y, 1.0), 1.0);
  let distance = length(delta);
  let direction = delta / max(distance, 0.003);
  let age = pulse.z;
  let energy = abs(pulse.w) * exp(-age * 4.0);
  let ring = exp(-pow((distance - age * 0.10) * 75.0, 2.0));
  var force = direction;
  var shape = ring;
  if (kind < 0.3) {
    shape = exp(-abs(delta.y) * 170.0) * exp(-abs(abs(delta.x) - age * 0.22) * 35.0);
    force = vec2f(sign(delta.x), sin(delta.x * 80.0) * 0.18);
  } else if (kind < 0.6) {
    shape += exp(-pow((distance - age * 0.067) * 90.0, 2.0)) * 0.45;
  } else if (kind > 0.85) {
    force = vec2f(-direction.y, direction.x) + direction * 0.12;
  }
  return vec4f(force * shape * energy * 9.0, shape * energy * 0.65, shape * energy * 0.2);
}

@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= u32(params.grid.x) || id.y >= u32(params.grid.y)) { return; }
  let point = vec2i(id.xy);
  let index = cell_index(point, params.grid.xy);
  let uv = (vec2f(id.xy) + 0.5) / params.grid.xy;
  let dt = params.viewport.w;
  let old = source[index];
  var value = sample_field(vec2f(id.xy) - old.xy * dt);
  let neighbors = (source[cell_index(point + vec2i(-1, 0), params.grid.xy)]
    + source[cell_index(point + vec2i(1, 0), params.grid.xy)]
    + source[cell_index(point + vec2i(0, -1), params.grid.xy)]
    + source[cell_index(point + vec2i(0, 1), params.grid.xy)]) * 0.25;
  value = mix(value, neighbors, vec4f(params.tuning.xx, params.tuning.zz));
  value *= vec4f(exp(-dt * 0.65), exp(-dt * 0.65), exp(-dt * 1.05), exp(-dt / max(params.tuning.y, 0.5)));
  let aspect = vec2f(params.viewport.x / max(params.viewport.y, 1.0), 1.0);
  let pointer_delta = (uv - params.pointer.xy) * aspect;
  value = vec4f(value.xy + params.pointer.zw * exp(-dot(pointer_delta, pointer_delta) * 700.0) * dt * 26.0, value.zw);
  let koi_delta = (uv - params.koi.xy) * aspect;
  let koi_local = exp(-dot(koi_delta, koi_delta) * 2300.0);
  let koi_speed = length(params.koi.zw);
  let presence = params.interaction.w;
  let activity = clamp(koi_speed * 7.0, 0.0, 1.0) * presence;
  let wake = koi_local * activity;
  let curl = vec2f(-koi_delta.y, koi_delta.x) / max(length(koi_delta), 0.006);
  value += vec4f((params.koi.zw * koi_local * 40.0 + curl * koi_local * params.interaction.z * 8.0) * presence,
    wake * (0.8 + params.weather.w * 0.4), wake * 1.5) * dt;
  let breathe = (0.5 + 0.5 * sin(params.viewport.z * 1.35)) * 0.035 * (1.0 - activity) * presence;
  value.z += exp(-abs(length(koi_delta) - 0.025) * 150.0) * breathe * dt;
  value.y += params.weather.z * params.weather.x * dt * 0.8;
  let center_delta = (params.command.xy - uv) * aspect;
  let lens = exp(-dot(center_delta, center_delta) * 4.0);
  let pull = params.interaction.x * (1.0 - params.interaction.x) * 4.0 - params.command.z * 0.18;
  value = vec4f(value.xy + (center_delta + vec2f(-center_delta.y, center_delta.x) * 0.35) * lens * pull * dt * 8.0, value.zw);
  value += (pulse_impulse(uv, params.pulse0, params.kinds.x)
    + pulse_impulse(uv, params.pulse1, params.kinds.y)
    + pulse_impulse(uv, params.pulse2, params.kinds.z)
    + pulse_impulse(uv, params.pulse3, params.kinds.w)) * dt;
  destination[index] = clamp(value, vec4f(-18.0, -18.0, 0.0, 0.0), vec4f(18.0, 18.0, 1.4, 1.4));
}
