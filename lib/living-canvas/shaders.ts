export const LIVING_FIELD_VERTEX_SHADER = `
  attribute vec2 a_position;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

/**
 * One restrained field, four readable signals:
 * - ambient filaments communicate section pacing;
 * - the pointer creates a local current, never a page-wide distortion;
 * - the fish writes a velocity-aligned V wake;
 * - plucks/cards/controls/creature actions get distinct pulse signatures.
 */
export const LIVING_FIELD_FRAGMENT_SHADER = `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_pointer;
  uniform vec2 u_creature;
  uniform vec2 u_velocity;
  uniform float u_scroll;
  uniform float u_scrollProgress;
  uniform float u_activity;
  uniform float u_zoneEnergy;
  uniform float u_warmth;
  uniform float u_intent;
  uniform vec4 u_pulses[4];
  uniform float u_pulseKinds[4];

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * valueNoise(p);
      p = mat2(1.62, 1.18, -1.18, 1.62) * p + 7.3;
      amplitude *= 0.5;
    }
    return value;
  }

  float segmentDistance(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
    return length(pa - ba * h);
  }

  float cross2(vec2 a, vec2 b) {
    return a.x * b.y - a.y * b.x;
  }

  void main() {
    vec2 normalized = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / max(1.0, u_resolution.y);
    vec2 uv = (normalized - 0.5) * vec2(aspect, 1.0);
    vec2 pointer = (u_pointer - 0.5) * vec2(aspect, 1.0);
    vec2 creature = (u_creature - 0.5) * vec2(aspect, 1.0);
    vec2 velocity = u_velocity * vec2(aspect, 1.0);

    float slowTime = u_time * (0.045 + u_zoneEnergy * 0.035);
    vec2 flowUv = uv * 3.0;
    flowUv.x += u_scroll * 0.16 + u_scrollProgress * 0.7;
    float warpA = fbm(flowUv + vec2(slowTime, -slowTime * 0.62));
    float warpB = fbm(flowUv * 1.45 + vec2(-slowTime * 0.72, slowTime));

    float bandPhase = (uv.y + warpA * 0.14 + warpB * 0.065) * 28.0;
    float caustic = pow(max(0.0, sin(bandPhase - u_time * 0.2)), 10.0);
    caustic *= 0.32 + warpB * 0.68;

    // Thin current filaments echo the hero strings without copying them.
    float filamentWave = sin(
      (uv.y + (warpA - 0.5) * 0.085) * 54.0
      + uv.x * 2.2
      - u_time * 0.11
    );
    float filaments = pow(max(0.0, 1.0 - abs(filamentWave)), 13.0);

    float pointerDistance = length(uv - pointer);
    float pointerCurrent = exp(-pointerDistance * 8.5) * u_activity;
    pointerCurrent *= 0.55 + 0.45 * sin(pointerDistance * 34.0 - u_time * 1.2);

    float velocityMagnitude = length(velocity);
    vec2 direction = velocityMagnitude > 0.0001
      ? normalize(velocity)
      : vec2(-1.0, 0.0);
    vec2 wakeDirection = -direction;
    vec2 creatureDelta = uv - creature;
    float behind = dot(creatureDelta, wakeDirection);
    float across = abs(cross2(creatureDelta, wakeDirection));
    float wakeEnvelope = smoothstep(-0.006, 0.02, behind)
      * (1.0 - smoothstep(0.12, 0.52, behind));
    float wakeAngle = 0.12 + u_intent * 0.055;
    float vWake = exp(-abs(across - behind * wakeAngle) * 82.0)
      * wakeEnvelope;
    vec2 wakeStart = creature - direction * (0.15 + min(0.3, velocityMagnitude));
    float wakeCore = exp(-segmentDistance(uv, wakeStart, creature) * 34.0);
    float wake = (vWake * 0.85 + wakeCore * 0.38)
      * smoothstep(0.003, 0.09, velocityMagnitude);
    wake *= 0.68 + 0.32 * sin(behind * 58.0 - u_time * 2.0);

    vec3 cool = vec3(0.32, 0.78, 0.86);
    vec3 warm = vec3(1.0, 0.28, 0.075);
    vec3 zoneColor = mix(cool, warm, clamp(0.5 + u_warmth * 0.5, 0.0, 1.0));
    float ambientSignal = (caustic * 0.15 + filaments * 0.055) * u_zoneEnergy;
    vec3 color = zoneColor * ambientSignal;
    color += cool * pointerCurrent * (0.055 + u_zoneEnergy * 0.025);
    color += mix(cool, warm, u_intent * 0.42) * wake * 0.27;
    float alpha = ambientSignal * 0.22
      + pointerCurrent * 0.034
      + wake * (0.07 + u_intent * 0.035);

    for (int i = 0; i < 4; i++) {
      vec4 pulse = u_pulses[i];
      float kind = u_pulseKinds[i];
      float pulseStrength = abs(pulse.w);
      float life = 1.0 - smoothstep(0.0, 2.4, pulse.z);
      float radius = pulse.z * 0.095;
      vec2 pulsePoint = (pulse.xy - 0.5) * vec2(aspect, 1.0);
      vec2 pulseDelta = uv - pulsePoint;
      float distanceToPulse = length(pulseDelta);
      float ring = exp(-abs(distanceToPulse - radius) * 72.0);
      float innerRing = exp(-abs(distanceToPulse - radius * 0.62) * 92.0);
      float core = exp(-distanceToPulse * 18.0)
        * max(0.0, 0.34 - pulse.z * 0.2);

      // String impulses travel as a short horizontal harmonic before
      // resolving into the shared circular field.
      float stringMix = 1.0 - smoothstep(0.2, 0.34, kind);
      float harmonicY = pulseDelta.y
        - sin(pulseDelta.x * 34.0 - u_time * 3.1) * 0.0065;
      float harmonic = exp(-abs(harmonicY) * 165.0)
        * exp(-abs(pulseDelta.x) * 4.8)
        * stringMix;

      // Cards receive a quieter second echo; controls remain compact.
      float cardMix = 1.0 - smoothstep(0.12, 0.24, abs(kind - 0.45));
      float controlMix = 1.0 - smoothstep(0.12, 0.25, abs(kind - 0.7));

      // Creature actions curl once around the body rather than impersonating
      // a button ripple.
      float angle = atan(pulseDelta.y, pulseDelta.x);
      float spiralRadius = radius + (angle + 3.14159) * 0.006;
      float creatureMix = smoothstep(0.82, 0.96, kind);
      float spiral = exp(-abs(distanceToPulse - spiralRadius) * 76.0)
        * creatureMix;

      float signal = ring
        + innerRing * cardMix * 0.52
        + core * (0.55 + controlMix * 0.45)
        + harmonic * 0.72
        + spiral * 0.78;
      signal *= pulseStrength * life;
      vec3 pulseColor = pulse.w < 0.0 ? cool : warm;
      color += pulseColor * signal * 0.5;
      alpha += signal * (0.12 + u_zoneEnergy * 0.035);
    }

    float edgeFade = 1.0 - smoothstep(0.28, 0.86, length(normalized - 0.5));
    alpha *= 0.62 + edgeFade * 0.38;
    float grain = hash21(gl_FragCoord.xy + floor(u_time * 6.0)) - 0.5;
    color += grain * 0.009 * (0.4 + u_zoneEnergy * 0.6);

    gl_FragColor = vec4(max(color, 0.0), clamp(alpha, 0.0, 0.22));
  }
`;
