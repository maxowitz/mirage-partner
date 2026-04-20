import { useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import MirageCloud from './MirageCloud'

// Orbital camera path — circles the particle orb through each content section
const PATH_POINTS = [
  new THREE.Vector3(  0,  4,  24),  // 0 landing:  front, elevated
  new THREE.Vector3( 20,  2,   8),  // 1 work:     right flank
  new THREE.Vector3(  8, -4, -14),  // 2 practice: underside right
  new THREE.Vector3(-18,  6,  -2),  // 3 brief:    upper left
  new THREE.Vector3( -2,  2,  20),  // 4 contact:  return front-left
]
const CURVE = new THREE.CatmullRomCurve3(PATH_POINTS, false, 'catmullrom', 0.5)

function CloudCamera({ progressRef }) {
  const { camera } = useThree()
  const smoothRef  = useRef(0)

  useFrame(() => {
    const target = progressRef?.current ?? 0
    smoothRef.current = THREE.MathUtils.lerp(smoothRef.current, target, 0.038)

    const t   = THREE.MathUtils.clamp(smoothRef.current, 0, 1)
    const pos = CURVE.getPoint(t)
    camera.position.copy(pos)
    camera.lookAt(0, 0, 0)
    camera.up.set(0, 1, 0)
  })

  return null
}

export default function SynthCanvas({ progressRef, scrollRef, mouseRef, clickRef, active = true }) {
  // If no external mouse/click refs provided, create internal ones
  const internalMouseRef = useRef({ x: 0, y: 0 })
  const internalClickRef = useRef({ x: 0, y: 0, pending: false })

  const resolvedMouseRef = mouseRef || internalMouseRef
  const resolvedClickRef = clickRef || internalClickRef

  useEffect(() => {
    if (mouseRef && clickRef) return  // managed externally

    const onMove = (e) => {
      internalMouseRef.current.x =  (e.clientX / window.innerWidth)  - 0.5
      internalMouseRef.current.y = -((e.clientY / window.innerHeight) - 0.5)
    }
    const onClick = (e) => {
      internalClickRef.current = {
        x:  (e.clientX / window.innerWidth)  - 0.5,
        y: -((e.clientY / window.innerHeight) - 0.5),
        pending: true,
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('click', onClick)
    }
  }, [mouseRef, clickRef])

  return (
    <Canvas
      camera={{ position: [0, 4, 24], fov: 55, near: 0.1, far: 200 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
      style={{ position: 'fixed', inset: 0, zIndex: 0, width: '100vw', height: '100vh', opacity: active ? 1 : 0, transition: 'opacity 0.7s ease', pointerEvents: active ? 'auto' : 'none' }}
    >
      <color attach="background" args={['#030201']} />
      <fogExp2 attach="fog" args={['#030201', 0.022]} />
      <CloudCamera progressRef={progressRef} />
      <MirageCloud
        mouseRef={resolvedMouseRef}
        clickRef={resolvedClickRef}
        scrollRef={scrollRef}
      />
    </Canvas>
  )
}
