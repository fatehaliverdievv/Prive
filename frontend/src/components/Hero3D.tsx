import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

type Mouse = React.MutableRefObject<{ x: number; y: number }>;

const vert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`;

/** Cover-fit photo with a liquid ripple under the cursor, RGB split on scroll speed and a slow "heat" drift */
const frag = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex; uniform vec2 uMouse; uniform float uTime, uVel, uScroll, uPlane, uImg, uOpacity;
void main(){
  vec2 s = uPlane > uImg ? vec2(1., uImg / uPlane) : vec2(uPlane / uImg, 1.);
  vec2 uv = (vUv - .5) * s * .9 + .5;
  uv.y += uScroll * .05;
  vec2 d = vUv - uMouse; d.x *= uPlane;
  float r = length(d);
  float ring = sin(r * 34. - uTime * 3.2) * exp(-r * 4.2);
  uv += normalize(d + 1e-4) * ring * (.006 + uVel * .02);
  uv += vec2(sin(uv.y * 7. + uTime * .6), cos(uv.x * 7. + uTime * .5)) * .0014;
  float sp = .0005 + uVel * .011;
  vec3 c = vec3(texture2D(uTex, uv + vec2(sp, 0.)).r, texture2D(uTex, uv).g, texture2D(uTex, uv - vec2(sp, 0.)).b);
  c += ring * .035;
  float vig = smoothstep(1.15, .35, length(vUv - .5) * 1.25);
  c *= mix(.86, 1., vig);
  gl_FragColor = linearToOutputTexel(vec4(c, uOpacity));
}`;

function Photo({ mouse, src }: { mouse: Mouse; src: string }) {
  const mat = useRef<THREE.ShaderMaterial>(null!);
  const mesh = useRef<THREE.Mesh>(null!);
  const { camera, viewport } = useThree();
  const smooth = useRef({ x: 0.5, y: 0.5, vel: 0, lastY: 0 });
  const uniforms = useMemo(() => ({
    uTex: { value: null as THREE.Texture | null }, uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uTime: { value: 0 }, uVel: { value: 0 }, uScroll: { value: 0 }, uPlane: { value: 1 }, uImg: { value: 1.5 }, uOpacity: { value: 0 },
  }), []);

  useEffect(() => {
    let alive = true;
    new THREE.TextureLoader().load(src, (t) => {
      if (!alive) return;
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      uniforms.uTex.value = t; uniforms.uImg.value = t.image.width / t.image.height;
    });
    return () => { alive = false; };
  }, [uniforms, src]);

  useFrame((st, dt) => {
    const sm = smooth.current;
    const sy = window.scrollY, sv = Math.abs(sy - sm.lastY) / Math.max(dt, 0.001) / 2400; sm.lastY = sy;
    const mx = (mouse.current.x + 1) / 2, my = (mouse.current.y + 1) / 2;
    const mv = Math.hypot(mx - sm.x, my - sm.y) * 6;
    sm.x += (mx - sm.x) * 0.08; sm.y += (my - sm.y) * 0.08;
    sm.vel += (Math.min(1.5, sv + mv) - sm.vel) * 0.08;
    const vp = viewport.getCurrentViewport(camera, [0, 0, -2]);
    mesh.current.scale.set(vp.width * 1.12, vp.height * 1.12, 1);
    mesh.current.position.set(-mouse.current.x * 0.12, -mouse.current.y * 0.08, -2);
    mesh.current.rotation.set(mouse.current.y * 0.03, -mouse.current.x * 0.04, 0);
    const u = mat.current.uniforms;
    u.uTime.value = st.clock.elapsedTime; u.uMouse.value.set(sm.x, sm.y); u.uVel.value = sm.vel;
    u.uScroll.value = Math.min(1.2, sy / window.innerHeight); u.uPlane.value = vp.width / vp.height;
    if (u.uTex.value) u.uOpacity.value = Math.min(1, u.uOpacity.value + dt * 1.2);
  });

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={uniforms} transparent toneMapped={false} />
    </mesh>
  );
}

/** Warm light dust floating at different depths — gives the photo real parallax volume */
function Dust({ mouse }: { mouse: Mouse }) {
  const ref = useRef<THREE.Points>(null!);
  const pos = useMemo(() => {
    const n = 420, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = (Math.random() - 0.5) * 9; a[i * 3 + 1] = (Math.random() - 0.5) * 5.5; a[i * 3 + 2] = Math.random() * 4 - 1.5; }
    return a;
  }, []);
  useFrame((st, dt) => {
    const p = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) + dt * (0.05 + (p.getZ(i) + 1.5) * 0.035);
      if (y > 2.8) y = -2.8;
      p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(st.clock.elapsedTime * 0.4 + i) * dt * 0.03);
    }
    p.needsUpdate = true;
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, -mouse.current.x * 0.35, 0.04);
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, -mouse.current.y * 0.2, 0.04);
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
      <pointsMaterial size={0.035} color="#ffd9a0" transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
}

/** Fibonacci-sphere "world" made of dots, an orbit ring and a little plane circling it */
function World({ mouse }: { mouse: Mouse }) {
  const group = useRef<THREE.Group>(null!);
  const plane = useRef<THREE.Group>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const points = useMemo(() => {
    const n = 2000, a = new Float32Array(n * 3), g = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), t = g * i;
      a[i * 3] = Math.cos(t) * r; a[i * 3 + 1] = y; a[i * 3 + 2] = Math.sin(t) * r;
    }
    return a;
  }, []);
  useFrame((state, dt) => {
    const m = mouse.current;
    group.current.rotation.y += dt * 0.18;
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, m.y * 0.35, 0.05);
    ring.current.rotation.z += dt * 0.05;
    const t = state.clock.elapsedTime * 0.55;
    const pos = (k: number) => new THREE.Vector3(Math.cos(k) * 1.55, Math.sin(k * 0.8) * 0.55, Math.sin(k) * 1.55);
    plane.current.position.copy(pos(t)); plane.current.lookAt(pos(t + 0.08));
  });
  return (
    <>
      <group ref={group}>
        <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[points, 3]} /></bufferGeometry>
          <pointsMaterial size={0.024} color="#ffffff" sizeAttenuation transparent opacity={0.95} depthWrite={false} /></points>
        <mesh><sphereGeometry args={[0.985, 40, 40]} /><meshBasicMaterial color="#0e2a2f" transparent opacity={0.4} /></mesh>
        <mesh ref={ring} rotation={[Math.PI / 2.3, 0, 0]}><torusGeometry args={[1.55, 0.004, 8, 200]} /><meshBasicMaterial color="#ff9a80" /></mesh>
      </group>
      <group ref={plane}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.05, 0.18, 4]} /><meshBasicMaterial color="#e8553a" /></mesh>
        <mesh scale={[1, 1, 0.25]}><boxGeometry args={[0.2, 0.01, 0.1]} /><meshBasicMaterial color="#ffffff" /></mesh>
      </group>
    </>
  );
}

function Scene({ mouse, src }: { mouse: Mouse; src: string }) {
  const holder = useRef<THREE.Group>(null!);
  const { viewport } = useThree();
  useFrame(() => {
    const wide = viewport.width > 6;
    holder.current.position.set(wide ? viewport.width * 0.3 : 0, wide ? viewport.height * 0.2 : viewport.height * 0.26, 0.4);
    holder.current.scale.setScalar(wide ? 0.5 : 0.38);
  });
  return (
    <>
      <Photo mouse={mouse} src={src} />
      <Dust mouse={mouse} />
      <group ref={holder}><World mouse={mouse} /></group>
    </>
  );
}

export default function Hero3D({ src = '/images/hero.webp' }: { src?: string }) {
  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const on = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', on);
    return () => window.removeEventListener('mousemove', on);
  }, []);
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 4.4], fov: 45 }} gl={{ alpha: true, antialias: true }} style={{ pointerEvents: 'none' }}>
      <Scene mouse={mouse} src={src} />
    </Canvas>
  );
}
