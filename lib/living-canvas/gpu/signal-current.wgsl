import { FieldParams, signal_color, atmosphere } from "./field-common.wgsl";

@group(0) @binding(0) var<uniform> params: FieldParams;

@fragment
fn fs_main(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let uv = position.xy / max(params.viewport.xy, vec2f(1.0));
  let energy = atmosphere(uv, params);
  return vec4f(signal_color(params.weather.y) * energy, energy);
}
