import { FieldParams, cell_index } from "./field-common.wgsl";
@group(0) @binding(0) var<uniform> params: FieldParams;
@group(0) @binding(1) var<storage, read> source: array<vec4f>;
@group(0) @binding(2) var<storage, read> pressure: array<f32>;
@group(0) @binding(3) var<storage, read> diagnostics: array<vec2f>;
@group(0) @binding(4) var<storage, read_write> destination: array<vec4f>;
@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= u32(params.grid.x) || id.y >= u32(params.grid.y)) { return; }
  let p = vec2i(id.xy);
  let index = cell_index(p, params.grid.xy);
  let l = cell_index(p + vec2i(-1, 0), params.grid.xy);
  let r = cell_index(p + vec2i(1, 0), params.grid.xy);
  let u = cell_index(p + vec2i(0, -1), params.grid.xy);
  let d = cell_index(p + vec2i(0, 1), params.grid.xy);
  let gradient = vec2f(pressure[r] - pressure[l], pressure[d] - pressure[u]) * 0.5;
  let curl_gradient = vec2f(abs(diagnostics[r].x) - abs(diagnostics[l].x), abs(diagnostics[d].x) - abs(diagnostics[u].x));
  let normal = curl_gradient / max(length(curl_gradient), 0.0001);
  let confinement = vec2f(normal.y, -normal.x) * diagnostics[index].x * params.viewport.w * 0.08;
  var velocity = clamp(source[index].xy - gradient + confinement, vec2f(-18.0), vec2f(18.0));
  if (id.x == 0u || id.x + 1u == u32(params.grid.x)) { velocity.x = 0.0; }
  if (id.y == 0u || id.y + 1u == u32(params.grid.y)) { velocity.y = 0.0; }
  destination[index] = vec4f(velocity, source[index].zw);
}
