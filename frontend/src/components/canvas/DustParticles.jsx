import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const VERT = `
  attribute float aOffset;
  attribute float aSpeed;
  attribute float aSize;
  uniform float u_time;
  uniform float u_vw;
  uniform float u_vh;
  uniform vec2  u_mouse;
  uniform float u_click_t;
  uniform vec2  u_click_pos;
  uniform float u_scroll;
  varying float vAlpha;
  varying float vWarm;

  void main() {
    vec3 pos = position;

    // Base lifecycle — slow vertical drift cycle
    float t = mod(u_time * aSpeed * 0.07 + aOffset, 1.0);
    pos.y += (t - 0.5) * u_vh * 1.5;
    pos.x += sin(u_time * aSpeed * 0.04 + aOffset * 6.28) * u_vw * 0.025;

    // Scroll surge — particles rush upward proportional to scroll velocity
    pos.y -= u_scroll * u_vh * 0.65;

    // Mouse attraction — particles within radius pulled toward cursor
    vec2 mouseWorld = u_mouse * vec2(u_vw, u_vh);
    vec2 toMouse    = mouseWorld - pos.xy;
    float mouseDist = length(toMouse) / (u_vw * 0.20);
    float attract   = smoothstep(1.0, 0.0, mouseDist);
    pos.xy += normalize(toMouse + 0.001) * attract * attract * u_vw * 0.12;

    // Click burst — radial explosion that decays over ~2s
    float clickAge   = max(0.0, u_time - u_click_t);
    vec2 clickWorld  = u_click_pos * vec2(u_vw, u_vh);
    vec2 fromClick   = pos.xy - clickWorld;
    float clickNorm  = length(fromClick) / (u_vw * 0.38);
    float proximity  = smoothstep(1.0, 0.0, clickNorm);
    float burst      = exp(-clickAge * 1.3) * proximity * u_vw * 0.30;
    pos.xy += normalize(fromClick + 0.001) * burst;

    // Alpha — base fade by cycle + mouse glow + scroll pulse + click flash
    float fade      = 1.0 - abs(t - 0.5) * 2.0;
    float mouseGlow = attract * 0.7;
    float scrollPls = u_scroll * 0.55;
    float clickFlsh = exp(-clickAge * 0.9) * proximity * 0.6;
    vAlpha = fade * 0.5 + mouseGlow + scrollPls + clickFlsh;
    vAlpha = clamp(vAlpha, 0.0, 1.0);

    // Warm color near mouse, cool click flash
    vWarm = attract * 0.8 + exp(-clickAge * 0.6) * proximity * 0.4;

    // Size — swell near mouse and at click
    float swell = 1.0 + attract * 2.2 + exp(-clickAge * 0.7) * proximity * 3.5;
    gl_PointSize = aSize * swell;
    gl_PointSize = clamp(gl_PointSize, 0.8, 6.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const FRAG = `
  varying float vAlpha;
  varying float vWarm;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.05, d);
    // Cool blue-grey baseline → warm ochre near mouse/click
    vec3 col = mix(vec3(0.48, 0.60, 0.74), vec3(0.88, 0.72, 0.52), vWarm);
    gl_FragColor = vec4(col, vAlpha * soft);
  }
`

export default function DustParticles({ mouseRef, clickRef, scrollRef }) {
  const meshRef = useRef()
  const COUNT = 12000
  const { viewport } = useThree()
  const vw = viewport.width
  const vh = viewport.height

  const { positions, offsets, speeds, sizes } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const offsets   = new Float32Array(COUNT)
    const speeds    = new Float32Array(COUNT)
    const sizes     = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * vw
      positions[i * 3 + 1] = (Math.random() - 0.5) * vh
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2
      offsets[i] = Math.random()
      speeds[i]  = 0.3 + Math.random() * 0.7
      sizes[i]   = 1.5 + Math.random() * 2.5
    }
    return { positions, offsets, speeds, sizes }
  }, [vw, vh])

  const uniforms = useMemo(() => ({
    u_time:      { value: 0 },
    u_vw:        { value: vw },
    u_vh:        { value: vh },
    u_mouse:     { value: new THREE.Vector2(0, 0) },
    u_click_t:   { value: -999 },
    u_click_pos: { value: new THREE.Vector2(0, 0) },
    u_scroll:    { value: 0 },
  }), [vw, vh])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const u = meshRef.current.material.uniforms
    u.u_time.value = clock.getElapsedTime()

    if (mouseRef?.current) {
      u.u_mouse.value.set(mouseRef.current.x, mouseRef.current.y)
    }

    if (clickRef?.current?.pending) {
      u.u_click_t.value = clock.getElapsedTime()
      u.u_click_pos.value.set(clickRef.current.x, clickRef.current.y)
      clickRef.current.pending = false
    }

    if (scrollRef?.current !== undefined) {
      u.u_scroll.value = THREE.MathUtils.lerp(u.u_scroll.value, scrollRef.current, 0.12)
      scrollRef.current = THREE.MathUtils.lerp(scrollRef.current, 0, 0.055)
    }
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aOffset"  args={[offsets, 1]} />
        <bufferAttribute attach="attributes-aSpeed"   args={[speeds, 1]} />
        <bufferAttribute attach="attributes-aSize"    args={[sizes, 1]} />
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
