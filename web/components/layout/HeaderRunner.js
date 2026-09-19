'use client';

import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useAnimations, useFBX } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_URL = '/models/running.fbx';
const RUN_W = 56;
const RUN_H = 36;

// Warm the fetch so the first traversal already has the model.
useFBX.preload(MODEL_URL);

function RunnerModel() {
  const group = useRef(null);
  const fbx = useFBX(MODEL_URL);
  const { actions, mixer, names } = useAnimations(fbx.animations, group);
  const fitted = useRef(false);
  const hasClip = names.length > 0;

  // Normalise unknown FBX units: scale so the model stands ~1 unit tall with
  // its feet at y=0, centred on x/z. That makes it ~26px tall in our camera.
  useEffect(() => {
    const node = group.current;
    if (!node || fitted.current) return;
    fitted.current = true;
    const box = new THREE.Box3().setFromObject(fbx);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    if (size.y > 0) {
      const s = 1 / size.y;
      node.scale.setScalar(s);
      node.position.set(-center.x * s, -box.min.y * s, -center.z * s);
    }
  }, [fbx]);

  // Play the run clip looped; mixer is driven in useFrame below.
  useEffect(() => {
    if (!hasClip) return;
    const first = actions[names[0]];
    if (!first) return;
    first.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    return () => {
      first.stop();
    };
  }, [actions, names, hasClip]);

  useFrame((state, delta) => {
    mixer.update(Math.min(delta, 0.05));
    // Files with no animation clip still travel: gentle bob in place.
    if (!hasClip && group.current) {
      const baseY = group.current.userData.baseY ?? 0;
      if (group.current.userData.baseY === undefined) {
        group.current.userData.baseY = group.current.position.y;
      }
      group.current.position.y = baseY + Math.sin(state.clock.elapsedTime * 9) * 0.02;
    }
  });

  return (
    <group ref={group}>
      {/* Faces right: +Z-facing rigs turn toward +X with Y +90deg. */}
      <group rotation={[0, Math.PI / 2, 0]}>
        <primitive object={fbx} />
      </group>
    </group>
  );
}

// Narrow glass-friendly strip between the wordmark and the coin chip. The
// whole flyer translates left->right over RUN_MS, hides for GAP_MS, then
// re-enters from the left forever. DOM-driven (rAF) so the 3D canvas only
// plays the run cycle; canvas stays transparent over the header glass.
export default function HeaderRunner() {
  const trackRef = useRef(null);
  const flyRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    const fly = flyRef.current;
    if (!track || !fly) return;

    const RUN_MS = 2600;
    const GAP_MS = 2000;
    const OFF = 80;

    const place = (x, visible) => {
      fly.style.transform = `translate3d(${x}px,-50%,0)`;
      fly.style.opacity = visible ? '1' : '0';
    };

    // Reduced motion: static runner parked mid-track, no traversal.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const park = () => {
        const w = track.clientWidth || 0;
        place(Math.max(0, (w - RUN_W) / 2), true);
      };
      park();
      window.addEventListener('resize', park);
      return () => window.removeEventListener('resize', park);
    }

    let raf = 0;
    let gapTimer = 0;
    let start = 0;
    let alive = true;

    const tick = (now) => {
      if (!alive) return;
      if (!start) start = now;
      const trackW = track.clientWidth || 0;
      const t = now - start;
      if (t < RUN_MS) {
        const p = t / RUN_MS;
        place(-OFF + p * (trackW + OFF * 2), true);
        raf = requestAnimationFrame(tick);
      } else {
        place(trackW + OFF, false);
        gapTimer = window.setTimeout(() => {
          if (!alive) return;
          place(-OFF, false);
          start = 0;
          raf = requestAnimationFrame(tick);
        }, GAP_MS);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(gapTimer);
    };
  }, []);

  return (
    <div ref={trackRef} className="runner-track" aria-hidden="true">
      <div ref={flyRef} className="runner-fly">
        <Canvas
          gl={{ alpha: true, antialias: true }}
          dpr={[1, 1.5]}
          camera={{ position: [0, 0.62, 2.15], fov: 35 }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={1.15} />
          <directionalLight position={[1.5, 2.5, 2]} intensity={1.6} />
          <directionalLight position={[-1.5, 1, 1]} intensity={0.45} />
          <Suspense fallback={null}>
            <RunnerModel />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
