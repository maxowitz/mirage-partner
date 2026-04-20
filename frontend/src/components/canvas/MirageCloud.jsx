import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ── 2D Simplex noise + curl-like 3D flow field ─────────────────────────────

const VERT = `
  // 2D Simplex noise
  vec3 _mod289(vec3 x) { return x - floor(x*(1./289.))*289.; }
  vec2 _mod289v(vec2 x){ return x - floor(x*(1./289.))*289.; }
  vec3 _permute(vec3 x){ return _mod289(((x*34.)+1.)*x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1  = (x0.x > x0.y) ? vec2(1.,0.) : vec2(0.,1.);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = _mod289v(i);
    vec3 p = _permute(_permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
    vec3 m = max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
    m=m*m; m=m*m;
    vec3 x2=2.*fract(p*C.www)-1.;
    vec3 h=abs(x2)-.5;
    vec3 ox=floor(x2+.5);
    vec3 a0=x2-ox;
    m *= 1.79284291400159-.85373472095314*(a0*a0+h*h);
    vec3 g;
    g.x =a0.x *x0.x +h.x *x0.y;
    g.yz=a0.yz*x12.xz+h.yz*x12.yw;
    return 130.*dot(m,g);
  }

  // Curl-like flow field — swirling incompressible-ish streams
  vec3 flowField(vec3 p, float t) {
    float s = 0.19;
    float n1 = snoise(vec2(p.y*s + t*0.04,        p.z*s + 0.31));
    float n2 = snoise(vec2(p.z*s + t*0.035 + 1.7, p.x*s + 0.73));
    float n3 = snoise(vec2(p.x*s + t*0.05  + 3.4, p.y*s + 0.59));
    return vec3(n2-n3, n3-n1, n1-n2);
  }

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

    // Slow global rotation — the whole nebula revolves as one organic mass
    float rot = u_time * 0.013;
    pos = vec3(
      pos.x * cos(rot) - pos.z * sin(rot),
      pos.y,
      pos.x * sin(rot) + pos.z * cos(rot)
    );

    // Phase-staggered volumetric drift (original stable formula)
    // aOffset spreads particles along slightly different Lissajous paths,
    // producing visible streaming structure in motion without convergence.
    float drift = u_time * aSpeed * 0.06;
    pos.x += sin(drift        + aOffset * 6.28318) * 0.18;
    pos.y += cos(drift * 0.73 + aOffset * 6.28318) * 0.14;
    pos.z += sin(drift * 0.51 + aOffset * 3.14159 + 1.57) * 0.16;

    // Heat shimmer
    float eq      = 1.0 - abs(normalize(pos + 0.001).y) * 0.65;
    float shimmer = sin(u_time * 2.2 + aOffset * 18.7 + pos.x * 0.4) * eq * 0.09;
    pos.y += shimmer;

    // Scroll surge
    pos.z += u_scroll_v * 4.5 * (aOffset - 0.5);

    // Click shockwave
    float clickAge = max(0.0, u_time - u_click_t);
    float waveR    = clickAge * 9.0;
    float waveDist = abs(length(position) - waveR);
    float wave     = exp(-waveDist * waveDist * 1.5) * exp(-clickAge * 0.8);
    pos += normalize(pos + 0.001) * wave * 2.5;

    // Mouse repulsion
    vec4 mvPos0  = modelViewMatrix * vec4(pos, 1.0);
    vec4 proj0   = projectionMatrix * mvPos0;
    vec2 screen0 = proj0.xy / max(proj0.w, 0.001) * 0.5;
    float depth0 = max(-mvPos0.z, 0.5);

    float mouseDist   = length(screen0 - u_mouse);
    float mouseActive = step(0.01, length(u_mouse));
    float repelStr    = smoothstep(0.22, 0.0, mouseDist) * mouseActive;
    float mouseGlow   = repelStr * 0.7;

    vec2 repelDir = normalize(screen0 - u_mouse + 0.001);
    pos.x += repelDir.x * repelStr * 0.04 * depth0 / 1.9;
    pos.y += repelDir.y * repelStr * 0.04 * depth0 / 1.9;

    // Final projection
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    vec4 proj  = projectionMatrix * mvPos;
    float depth = max(-mvPos.z, 0.5);

    // Gaussian ring fade — peaks at r=8, dark at centre, dim at outer edge.
    // Creates nebula depth: glowing shell with a dark core, matching Anadol aesthetic.
    float coreR       = length(position);
    float rNorm       = (coreR - 8.0) / 4.5;
    float fade        = exp(-rNorm * rNorm);
    float pulse       = sin(u_time * 0.18 + aOffset * 6.28) * 0.20 + 0.80;
    float scrollFlash = u_scroll_v * 0.55;

    vAlpha = fade * pulse * 0.55 + mouseGlow * 0.15 + wave * 0.65 + scrollFlash * 0.5;
    vAlpha = clamp(vAlpha, 0.0, 1.0);
    if (aHaze > 0.5) vAlpha *= 0.16;

    vWarmth = clamp(aWarmth + mouseGlow * 0.18 + wave * 0.4 + scrollFlash * 0.3, 0.0, 1.0);

    float swell   = 1.0 + repelStr * 0.7 + wave * 2.5 + scrollFlash;
    float hazeMlt = aHaze > 0.5 ? 5.0 : 1.0;
    gl_PointSize  = aSize * swell * hazeMlt * (160.0 / depth);
    gl_PointSize  = clamp(gl_PointSize, 0.3, 8.0);

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

    // Soft glow + hot core (liquid metal layering)
    float soft = exp(-d * d * 4.2);
    float core = exp(-d * d * 18.0);

    // Liquid metal gold palette
    vec3 hot    = vec3(1.0,  0.97, 0.78);  // white-hot center
    vec3 bright = vec3(0.98, 0.82, 0.44);  // gold stream
    vec3 deep   = vec3(0.60, 0.42, 0.16);  // deep amber edge

    vec3 col = mix(deep, bright, vWarmth);
    col = mix(col, hot, core * vWarmth * 0.75);

    // Slight cool iridescence on dim particles (gives depth variation)
    col += vec3(-0.02, 0.01, 0.05) * (1.0 - vWarmth) * 0.4;

    gl_FragColor = vec4(col, vAlpha * (soft + core * 0.25));
  }
`

export default function MirageCloud({ mouseRef, clickRef, scrollRef }) {
  const meshRef = useRef()
  const COUNT        = 20000
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
      // Cluster near shell surface for stream density (Anadol effect)
      const r = isHaze
        ? (0.3 + Math.random() * 0.7) * MAX_RADIUS
        : Math.pow(Math.random(), 0.40) * MAX_RADIUS

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      offsets[i] = Math.random()
      speeds[i]  = 0.4 + Math.random() * 0.8
      sizes[i]   = isHaze
        ? 1.5 + Math.random() * 2.5
        : 0.4 + Math.random() * Math.random() * 3.8
      warmths[i] = isHaze
        ? 0.3 + Math.random() * 0.4
        : Math.max(0, (1.0 - r / MAX_RADIUS) * 0.80 + Math.random() * 0.35 - 0.08)
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
      u.u_scroll_v.value = THREE.MathUtils.lerp(u.u_scroll_v.value, scrollRef.current, 0.10)
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
