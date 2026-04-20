import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const VERT = `
  attribute float aOffset;
  attribute float aSpeed;
  attribute float aSize;
  attribute float aWarmth;
  attribute float aHaze;
  uniform float u_time;
  uniform vec2  u_mouse;
  uniform float u_click_t;
  uniform float u_scroll_v;
  varying float vAlpha;
  varying float vWarmth;

  void main() {
    vec3 pos = position;

    // Slow volumetric drift
    float drift = u_time * aSpeed * 0.06;
    pos.x += sin(drift        + aOffset * 6.28318) * 0.18;
    pos.y += cos(drift * 0.73 + aOffset * 6.28318) * 0.14;
    pos.z += sin(drift * 0.51 + aOffset * 3.14159 + 1.57) * 0.16;

    // Heat shimmer
    float eq      = 1.0 - abs(normalize(pos + 0.001).y) * 0.65;
    float shimmer = sin(u_time * 2.2 + aOffset * 18.7 + pos.x * 0.4) * eq * 0.09;
    pos.y += shimmer;

    // Scroll surge — particles gust on fast scroll
    pos.z += u_scroll_v * 4.5 * (aOffset - 0.5);

    // Click shockwave — sphere expands from center
    float clickAge = max(0.0, u_time - u_click_t);
    float waveR    = clickAge * 9.0;
    float dist0    = length(position);
    float waveDist = abs(dist0 - waveR);
    float wave     = exp(-waveDist * waveDist * 1.5) * exp(-clickAge * 0.8);
    pos += normalize(pos + 0.001) * wave * 2.5;

    // ── Mouse repulsion (opposite magnet) ───────────────────────────────
    // Compute screen pos BEFORE applying repulsion (to avoid circular dep.)
    vec4 mvPos0  = modelViewMatrix * vec4(pos, 1.0);
    vec4 proj0   = projectionMatrix * mvPos0;
    vec2 screen0 = proj0.xy / max(proj0.w, 0.001) * 0.5;
    float depth0 = max(-mvPos0.z, 0.5);

    float mouseDist = length(screen0 - u_mouse);
    // Only repel when mouse has actually entered the canvas (not default 0,0)
    float mouseActive = step(0.01, length(u_mouse));
    float repelStr  = smoothstep(0.22, 0.0, mouseDist) * mouseActive;
    float mouseGlow = repelStr * 1.8;

    // Push away in screen space, back-projected to world space
    vec2  repelDir  = normalize(screen0 - u_mouse + 0.001);
    float projScale = 1.9;  // ~1/tan(fov/2) at fov=55°
    pos.x += repelDir.x * repelStr * 0.05 * depth0 / projScale;
    pos.y += repelDir.y * repelStr * 0.05 * depth0 / projScale;
    // ────────────────────────────────────────────────────────────────────

    // Final projection with repelled pos
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    vec4 proj  = projectionMatrix * mvPos;
    float depth = max(-mvPos.z, 0.5);

    // Alpha
    float coreR = length(position);
    float fade  = exp(-coreR * 0.072);
    float pulse = sin(u_time * 0.18 + aOffset * 6.28) * 0.20 + 0.80;
    float scrollFlash = u_scroll_v * 0.55;
    vAlpha = fade * pulse * 0.68 + mouseGlow * 0.4 + wave * 0.7 + scrollFlash;
    vAlpha = clamp(vAlpha, 0.0, 1.0);

    if (aHaze > 0.5) vAlpha *= 0.16;

    vWarmth = clamp(aWarmth + mouseGlow * 0.4 + wave * 0.4 + scrollFlash * 0.3, 0.0, 1.0);

    // Point size
    float swell   = 1.0 + repelStr * 1.5 + wave * 3.0 + scrollFlash;
    float hazeMlt = aHaze > 0.5 ? 6.0 : 1.0;
    gl_PointSize  = aSize * swell * hazeMlt * (270.0 / depth);
    gl_PointSize  = clamp(gl_PointSize, 0.3, 14.0);

    gl_Position = proj;
  }
`

const FRAG = `
  varying float vAlpha;
  varying float vWarmth;

  void main() {
    vec2  uv = gl_PointCoord - 0.5;
    float d  = length(uv);
    if (d > 0.5) discard;

    float soft   = exp(-d * d * 5.5);
    vec3  bright = vec3(0.98, 0.82, 0.44);
    vec3  deep   = vec3(0.68, 0.50, 0.24);
    vec3  col    = mix(deep, bright, vWarmth);
    col += vec3(0.06, 0.03, -0.02) * (1.0 - soft) * 0.7;

    gl_FragColor = vec4(col, vAlpha * soft);
  }
`

export default function MirageCloud({ mouseRef, clickRef, scrollRef }) {
  const meshRef    = useRef()
  const COUNT      = 20000
  const HAZE_COUNT = 600
  const TOTAL      = COUNT + HAZE_COUNT
  const MAX_RADIUS = 14

  const { positions, offsets, speeds, sizes, warmths, hazes } = useMemo(() => {
    const positions = new Float32Array(TOTAL * 3)
    const offsets   = new Float32Array(TOTAL)
    const speeds    = new Float32Array(TOTAL)
    const sizes     = new Float32Array(TOTAL)
    const warmths   = new Float32Array(TOTAL)
    const hazes     = new Float32Array(TOTAL)

    for (let i = 0; i < TOTAL; i++) {
      const isHaze = i >= COUNT
      const theta  = Math.random() * Math.PI * 2
      const phi    = Math.acos(2 * Math.random() - 1)
      const r      = isHaze
        ? (0.3 + Math.random() * 0.7) * MAX_RADIUS
        : Math.pow(Math.random(), 0.40) * MAX_RADIUS

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      offsets[i] = Math.random()
      speeds[i]  = 0.3 + Math.random() * 0.9
      sizes[i]   = isHaze
        ? 1.5 + Math.random() * 2.5
        : 0.5 + Math.random() * Math.random() * 4.2
      warmths[i] = isHaze
        ? 0.3 + Math.random() * 0.4
        : Math.max(0, (1.0 - r / MAX_RADIUS) * 0.82 + Math.random() * 0.3 - 0.05)
      hazes[i]   = isHaze ? 1.0 : 0.0
    }
    return { positions, offsets, speeds, sizes, warmths, hazes }
  }, [])

  const uniforms = useMemo(() => ({
    u_time:     { value: 0 },
    u_mouse:    { value: new THREE.Vector2(0, 0) },
    u_click_t:  { value: -999 },
    u_scroll_v: { value: 0 },
  }), [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const u = meshRef.current.material.uniforms
    u.u_time.value = clock.getElapsedTime()

    if (mouseRef?.current) {
      u.u_mouse.value.set(mouseRef.current.x, mouseRef.current.y)
    }

    if (clickRef?.current?.pending) {
      u.u_click_t.value = clock.getElapsedTime()
      clickRef.current.pending = false
    }

    if (scrollRef?.current !== undefined) {
      u.u_scroll_v.value = THREE.MathUtils.lerp(
        u.u_scroll_v.value, scrollRef.current, 0.10
      )
    }
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aOffset"  args={[offsets, 1]} />
        <bufferAttribute attach="attributes-aSpeed"   args={[speeds, 1]} />
        <bufferAttribute attach="attributes-aSize"    args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aWarmth"  args={[warmths, 1]} />
        <bufferAttribute attach="attributes-aHaze"    args={[hazes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
