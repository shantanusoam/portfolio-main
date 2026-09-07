import { FieldParams, cell_index } from "./field-common.wgsl";
@group(0) @binding(0) var<uniform> params: FieldParams;
@group(0) @binding(1) var<storage, read> source: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> diagnostics: array<vec2f>;
@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= u32(params.grid.x) || id.y >= u32(params.grid.y)) { return; }
  let p = vec2i(id.xy);
  let left = source[cell_index(p + vec2i(-1, 0), params.grid.xy)].xy;
  let right = source[cell_index(p + vec2i(1, 0), params.grid.xy)].xy;
  let up = source[cell_index(p + vec2i(0, -1), params.grid.xy)].xy;
  let down = source[cell_index(p + vec2i(0, 1), params.grid.xy)].xy;
  diagnostics[cell_index(p, params.grid.xy)] = vec2f((right.y - left.y - down.x + up.x) * 0.5, (right.x - left.x + down.y - up.y) * 0.5);
}
