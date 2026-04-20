import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Terrain Shader ──────────────────────────────────────────────────────────

const VERT = `
  uniform float u_time;
  uniform float u_speed;
  uniform vec2  u_mouse;
  uniform float u_mouse_held;
  uniform float u_click_t;
  uniform vec2  u_click_screen;
  attribute float aRandom;
  varying float vHeight;
  varying float vFog;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289v(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289v(i);
    vec3 p = permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
    m = m*m; m = m*m;
    vec3 x2 = 2.0*fract(p*C.www)-1.0;
    vec3 h = abs(x2)-0.5;
    vec3 ox = floor(x2+0.5);
    vec3 a0 = x2-ox;
    m *= 1.79284291400159 - 0.85373472095314*(a0*a0+h*h);
    vec3 g;
    g.x  = a0.x *x0.x  + h.x *x0.y;
    g.yz = a0.yz*x12.xz + h.yz*x12.yw;
    return 130.0 * dot(m, g);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for(int i=0;i<4;i++) { v += a*snoise(p); p *= 2.1; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 scrolledPos = vec2(position.x * 0.04, (position.z + u_time * u_speed) * 0.04);
    float n = fbm(scrolledPos);
    float h = n * 2.8 + aRandom * 0.15;

    // Subtle water-wave animation — always alive, independent of scroll
    float wx = sin(position.x * 0.28 + u_time * 0.75) * 0.055;
    float wz = sin(position.z * 0.22 + u_time * 1.05 + 0.9) * 0.048;
    float wd = cos(position.x * 0.14 + position.z * 0.18 + u_time * 0.60) * 0.040;
    h += wx + wz + wd;

    // Mouse repulsion — terrain dips away from cursor
    vec3 flatPos = vec3(position.x, 0.0, position.z);
    vec4 flatMV   = modelViewMatrix * vec4(flatPos, 1.0);
    vec4 flatProj = projectionMatrix * flatMV;
    vec2 flatNDC  = flatProj.xy / max(flatProj.w, 0.001) * 0.5;

    float mouseScreenDist = length(u_mouse - flatNDC);
    float mouseInfluence  = smoothstep(0.13, 0.0, mouseScreenDist);
    h -= mouseInfluence * 2.2;

    // Click: expanding ring on terrain surface
    float clickAge = max(0.0, u_time - u_click_t);
    float ringR    = clickAge * 0.30;
    float ringDist = abs(length(u_mouse - flatNDC) - ringR);
    float ring     = exp(-ringDist * ringDist * 90.0) * exp(-clickAge * 1.6);
    h += ring * 3.8;

    vec3 pos = vec3(position.x, h, position.z);
    vHeight = (h + 1.5) / 3.5;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    vFog = 1.0 - clamp(-mvPos.z / 85.0, 0.0, 1.0);

    gl_PointSize = (1.5 + aRandom * 1.5) * (300.0 / -mvPos.z);
    gl_PointSize = clamp(gl_PointSize, 0.5, 5.0);
    gl_Position  = projectionMatrix * mvPos;
  }
`

const FRAG = `
  varying float vHeight;
  varying float vFog;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    if (length(uv) > 0.5) discard;

    // Gold palette — deep amber base → bright gold at peaks
    vec3 base = vec3(0.40, 0.28, 0.07);
    vec3 peak = vec3(0.95, 0.78, 0.38);
    vec3 col  = mix(base, peak, smoothstep(0.25, 0.85, vHeight));

    // Soft haze highlight at tips
    col += vec3(0.10, 0.08, 0.02) * smoothstep(0.7, 1.0, vHeight);

    float alpha = vFog * mix(0.35, 0.95, vHeight);
    gl_FragColor = vec4(col, alpha);
  }
`

// ─── Terrain Particles ───────────────────────────────────────────────────────

function TerrainMesh({ speedRef, mouseRef, clickRef }) {
  const meshRef = useRef()

  const COUNT_X = 320, COUNT_Z = 320
  const SIZE_X  = 140, SIZE_Z  = 200

  const { positions, randoms } = useMemo(() => {
    const total     = COUNT_X * COUNT_Z
    const positions = new Float32Array(total * 3)
    const randoms   = new Float32Array(total)
    let i = 0
    for (let xi = 0; xi < COUNT_X; xi++) {
      for (let zi = 0; zi < COUNT_Z; zi++) {
        positions[i * 3]     = (xi / COUNT_X - 0.5) * SIZE_X
        positions[i * 3 + 1] = 0
        positions[i * 3 + 2] = (zi / COUNT_Z - 0.5) * SIZE_Z
        randoms[i] = Math.random()
        i++
      }
    }
    return { positions, randoms }
  }, [])

  const uniforms = useMemo(() => ({
    u_time:         { value: 0 },
    u_speed:        { value: 0 },
    u_mouse:        { value: new THREE.Vector2(0, 0) },
    u_mouse_held:   { value: 0 },
    u_click_t:      { value: -999 },
    u_click_screen: { value: new THREE.Vector2(0, 0) },
  }), [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const u = meshRef.current.material.uniforms
    u.u_time.value  = clock.getElapsedTime()
    u.u_speed.value = THREE.MathUtils.lerp(u.u_speed.value, speedRef?.current || 0, 0.08)

    if (mouseRef?.current) {
      u.u_mouse.value.set(mouseRef.current.x, mouseRef.current.y)
      u.u_mouse_held.value = mouseRef.current.down ? 1 : 0
    }

    if (clickRef?.current?.pending) {
      u.u_click_t.value = clock.getElapsedTime()
      u.u_click_screen.value.set(clickRef.current.x, clickRef.current.y)
      clickRef.current.pending = false
    }
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aRandom"  args={[randoms, 1]} />
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

// ─── Camera ─────────────────────────────────────────────────────────────────

function TerrainCamera({ progressRef, speedRef }) {
  const { camera } = useThree()
  const smoothRef  = useRef(0)

  useFrame(() => {
    const target = progressRef?.current ?? 0
    smoothRef.current = THREE.MathUtils.lerp(smoothRef.current, target, 0.040)

    const z = 8 - smoothRef.current * 170
    const t = performance.now() * 0.00024

    camera.position.x = Math.sin(t) * 2.3
    camera.position.y = 2.5 + Math.sin(t * 0.66) * 0.28
    camera.position.z = z
    camera.lookAt(camera.position.x * 0.25, 0, z - 30)

    // Expose speed so TerrainMesh can animate scroll parallax
    if (speedRef) {
      const delta = Math.abs(smoothRef.current - (smoothRef._prev ?? smoothRef.current)) * 60
      speedRef.current = THREE.MathUtils.lerp(speedRef.current, delta * 2.5, 0.12)
      smoothRef._prev = smoothRef.current
    }
  })

  return null
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function TerrainBackground({ progressRef, mouseRef, clickRef, active = true }) {
  const speedRef = useRef(0)

  return (
    <Canvas
      camera={{ position: [0, 2.5, 8], fov: 45, near: 0.1, far: 200 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
      style={{ position: 'fixed', inset: 0, zIndex: 0, width: '100vw', height: '100vh', opacity: active ? 1 : 0, transition: 'opacity 0.7s ease', pointerEvents: active ? 'auto' : 'none' }}
    >
      <color attach="background" args={['#030201']} />
      <fogExp2 attach="fog" args={['#030201', 0.018]} />
      <TerrainCamera progressRef={progressRef} speedRef={speedRef} />
      <TerrainMesh speedRef={speedRef} mouseRef={mouseRef} clickRef={clickRef} />
    </Canvas>
  )
}
