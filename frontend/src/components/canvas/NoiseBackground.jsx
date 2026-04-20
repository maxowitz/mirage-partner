import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.999, 1.0);
  }
`

const FRAG = `
  uniform float u_time;
  uniform float u_warmth;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y);
  }
  float fbm(vec2 p) {
    float v=0.0; float a=0.5;
    for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.1+vec2(1.7,9.2);a*=0.5;}
    return v;
  }

  void main() {
    vec2 p = vUv * 2.5;
    float n = fbm(p + vec2(u_time * 0.04, u_time * 0.03));
    float n2 = fbm(p * 1.8 + vec2(-u_time * 0.02, u_time * 0.025) + n * 0.4);

    vec3 dark   = vec3(0.012, 0.009, 0.008);
    vec3 mid    = vec3(0.038, 0.028, 0.022);
    vec3 bright = vec3(0.085, 0.062, 0.050);

    vec3 col = mix(dark, mid,    smoothstep(0.3, 0.6, n2));
    col      = mix(col,  bright, smoothstep(0.6, 0.9, n2));

    float warmth = u_warmth;
    col += vec3(0.040, 0.015, 0.0) * max(0.0, warmth);
    col += vec3(0.0, 0.015, 0.040) * max(0.0, -warmth);

    gl_FragColor = vec4(col, 1.0);
  }
`

export default function NoiseBackground({ warmth }) {
  const meshRef = useRef()
  const uniforms = useMemo(() => ({
    u_time:   { value: 0 },
    u_warmth: { value: 0 },
  }), [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    uniforms.u_time.value = clock.getElapsedTime()
    uniforms.u_warmth.value = THREE.MathUtils.lerp(uniforms.u_warmth.value, warmth, 0.02)
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}
