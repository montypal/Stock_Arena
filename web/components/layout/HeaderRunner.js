'use client';

import { Component, Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useAnimations, useFBX } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_URL = '/models/running.fbx';
// DEBUG: temporarily enlarge the runner while verifying the Mixamo bull
// actually renders. Set false to fit back into the 56x36 header slot.
const DEBUG = false;
const RUN_W = DEBUG ? 320 : 56;
const RUN_H = DEBUG ? 180 : 36;
// Target model height in camera units after auto-fit (bull ~17% larger).
const FIT_H = 1.175;
// The converter baked an absolute server path into the FBX texture slot.
// Remap it to a local file so the real texture applies the moment it is
// exported next to the model at web/public/models/textures/packed/Image_0.
const LOCAL_TEXTURE = '/models/textures/packed/Image_0';
if (typeof window !== 'undefined') {
  THREE.DefaultLoadingManager.setURLModifier((url) =>
    url.includes('Image_0') ? LOCAL_TEXTURE : url
  );
}

// Warm the fetch so the first traversal already has the model.
useFBX.preload(MODEL_URL);

// Error boundary: useFBX throws if the file 404s or fails to parse.
// Surface that as a clear console error instead of a blank header.
class RunnerErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(`[HeaderRunner] ERROR: failed to load ${MODEL_URL}`, error);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function RunnerModel() {
  const group = useRef(null);
  const fbx = useFBX(MODEL_URL);
  // Mixamo clips target `mixamorig*` bone names; the fbx subtree (with its
  // bones) lives under `group`, so useAnimations resolves tracks by name
  // against those descendants — the clip is NOT assumed to sit on `group`.
  const { actions, mixer, names } = useAnimations(fbx.animations, group);
  const fitted = useRef(false);
  const frames = useRef(0);

  // Diagnostic: what did the file actually bring?
  useEffect(() => {
    let meshes = 0;
    fbx.traverse((o) => {
      if (o.isMesh) meshes += 1;
    });
    console.log(`[HeaderRunner] loaded ${MODEL_URL}: ${meshes} mesh(es)`);
    console.log(
      '[HeaderRunner] animation clips:',
      fbx.animations.map((a) => ({
        name: a.name || '(unnamed)',
        duration: Number(a.duration.toFixed(3)),
        tracks: a.tracks.length,
      }))
    );
    if (fbx.animations.length === 0) {
      console.error(
        '[HeaderRunner] ERROR: FBX has zero animation clips — the bull will render static. Re-export from Mixamo with the run animation baked.'
      );
    }
  }, [fbx]);

  // Play the first available Mixamo clip on a loop. Mixamo run clips carry
  // root motion (mixamorigHips.position travels forward), which would sprint
  // the bull off-frame and snap it back every loop — the DOM flyer already
  // moves it across the bar, so pin Hips X/Z to their first keyframe and
  // keep Y (the run bob).
  useEffect(() => {
    if (names.length === 0) {
      console.error('[HeaderRunner] ERROR: no playable clip found in fbx.animations.');
      return;
    }
    const clip = fbx.animations[0];
    clip.tracks.forEach((t) => {
      if (t.name === 'mixamorigHips.position' && t.values.length >= 3) {
        const x0 = t.values[0];
        const z0 = t.values[2];
        for (let i = 0; i + 2 < t.values.length; i += 3) {
          t.values[i] = x0;
          t.values[i + 2] = z0;
        }
        t.needsUpdate = true;
      }
    });
    console.log('[HeaderRunner] root motion pinned (Hips X/Z locked, Y bob kept).');
    if (names.length === 0) {
      console.error('[HeaderRunner] ERROR: no playable clip found in fbx.animations.');
      return;
    }
    const clipName = names[0];
    const action = actions[clipName];
    if (!action) {
      console.error(
        `[HeaderRunner] ERROR: clip "${clipName}" has no action — bone names may not match the hierarchy.`
      );
      return;
    }
    console.log(`[HeaderRunner] playing "${clipName}" looped at 0.75x (timeScale, clip untouched).`);
    action.reset().setLoop(THREE.LoopRepeat, Infinity);
    action.timeScale = 0.75;
    action.play();
    return () => {
      action.stop();
    };
  }, [actions, names]);

  useFrame((state, delta) => {
    mixer.update(Math.min(delta, 0.05));
    frames.current += 1;
    // Auto-fit once the skeleton is bound and the clip is posing the rig
    // (bones are garbage before the first mixer updates, so measuring earlier
    // frames the wrong box). Measure the posed world box, then scale/center
    // the outer group so the bull sits ~FIT_H tall at the origin.
    if (!fitted.current && frames.current === 12 && group.current) {
      fitted.current = true;
      const box = new THREE.Box3().setFromObject(group.current);
      if (box.isEmpty()) {
        console.error('[HeaderRunner] ERROR: posed bounds are empty — cannot frame the model.');
        return;
      }
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      console.log(
        '[HeaderRunner] posed bounds size:',
        size.toArray().map((v) => Number(v.toFixed(3))),
        'center:',
        center.toArray().map((v) => Number(v.toFixed(3)))
      );
      if (!(size.y > 0) || !Number.isFinite(size.y)) {
        console.error('[HeaderRunner] ERROR: posed bounds have no height — cannot frame the model.');
        return;
      }
      const s = FIT_H / size.y;
      group.current.scale.setScalar(s);
      group.current.position.set(-center.x * s, -center.y * s, -center.z * s);
      console.log(`[HeaderRunner] auto-fit scale ${Number(s.toFixed(5))}; bull centered at origin.`);
    }
  });

  // Texture policy: preserve the FBX's own materials — never null the map.
  // The loader resolves the file's texture path relative to /models/; a
  // missing file only logs a 404 while the authored colour still renders.
  useEffect(() => {
    fbx.traverse((o) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (!m) return;
        m.needsUpdate = true;
      });
    });
  }, [fbx]);

  return (
    <group ref={group}>
      {/* Mixamo rigs face +Z; turn toward +X so the bull runs right. */}
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
    <div
      ref={trackRef}
      className="runner-track"
      aria-hidden="true"
      style={DEBUG ? { height: 180, flex: '1 1 auto', minWidth: 320 } : undefined}
    >
      <div
        ref={flyRef}
        className="runner-fly"
        style={DEBUG ? { width: 320, height: 180 } : undefined}
      >
        <Canvas
          gl={{ alpha: true, antialias: true }}
          dpr={[1, 1.5]}
          camera={{ position: [0, 0.62, 2.15], fov: 35 }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={1.15} />
          <directionalLight position={[1.5, 2.5, 2]} intensity={1.6} />
          <directionalLight position={[-1.5, 1, 1]} intensity={0.45} />
          <RunnerErrorBoundary>
            <Suspense fallback={null}>
              <RunnerModel />
            </Suspense>
          </RunnerErrorBoundary>
        </Canvas>
      </div>
    </div>
  );
}
