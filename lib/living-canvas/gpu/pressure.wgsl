import { FieldParams, cell_index } from "./field-common.wgsl";
@group(0) @binding(0) var<uniform> params: FieldParams;
@group(0) @binding(1) var<storage, read> source: array<f32>;
@group(0) @binding(2) var<storage, read> diagnostics: array<vec2f>;
@group(0) @binding(3) var<storage, read_write> destination: array<f32>;
@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= u32(params.grid.x) || id.y >= u32(params.grid.y)) { return; }
  let p = vec2i(id.xy);
  let index = cell_index(p, params.grid.xy);
  let sum = source[cell_index(p + vec2i(-1, 0), params.grid.xy)]
    + source[cell_index(p + vec2i(1, 0), params.grid.xy)]
    + source[cell_index(p + vec2i(0, -1), params.grid.xy)]
    + source[cell_index(p + vec2i(0, 1), params.grid.xy)];
  destination[index] = clamp((sum - diagnostics[index].y) * 0.25, -12.0, 12.0);
}
