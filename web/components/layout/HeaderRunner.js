'use client';

import { Component, Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { report } from './RunnerDiag';

const MODEL_URL = '/models/retargeted_animations.glb';
const DEBUG = false;
const RUN_W = DEBUG ? 320 : 56;
const RUN_H = DEBUG ? 180 : 36;
const FIT_H = 1.175;
const LOCAL_TEXTURE = '/models/textures/packed/Image_0.png';
if (typeof window !== 'undefined') {
  report('stage', 'chunk-loaded', '3D chunk loaded — mounting runner');
}

// Warm the fetch so the first traversal already has the model.
useGLTF.preload(MODEL_URL);

// Error boundary: useGLTF throws if the file 404s or fails to parse.
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
    report('error', 'model', `three.js threw while loading ${MODEL_URL} — see console`);
    console.error(`[HeaderRunner] ERROR: failed to load ${MODEL_URL}`, error);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function RunnerModel({ onReady }) {
  const group = useRef(null);
  const gltf = useGLTF(MODEL_URL);
  // The retargeted GLB uses generic bone names (root, pelvis, spine_01, ...),
  // not Mixamo's mixamorig* names; useAnimations resolves tracks by name
  // against the group's descendants just the same.
  const { actions, mixer, names } = useAnimations(gltf.animations, group);
  const fitted = useRef(false);
  const frames = useRef(0);

  // Diagnostic: what did the file actually bring?
  useEffect(() => {
    let meshes = 0;
    gltf.scene.traverse((o) => {
      if (o.isMesh) meshes += 1;
    });
    console.log(`[HeaderRunner] loaded ${MODEL_URL}: ${meshes} mesh(es)`);
    console.log(
      '[HeaderRunner] animation clips:',
      gltf.animations.map((a) => ({
        name: a.name || '(unnamed)',
        duration: Number(a.duration.toFixed(3)),
        tracks: a.tracks.length,
      }))
    );
    if (gltf.animations.length === 0) {
      report('error', 'animation', 'GLB has zero animation clips — the character renders static');
      console.error(
        '[HeaderRunner] ERROR: GLB has zero animation clips — the character will render static. Re-export with the run animation baked.'
      );
    }
  }, [gltf]);

  // Play the first available clip on a loop. The retargeted GLB's run cycle
  // targets generic bone names. The pelvis (hip-equivalent) carries
  // translation; if the clip bakes forward root motion the DOM flyer already
  // translates the character across the bar, so pin pelvis X/Z and keep Y
  // (the run bob). Track name format: "pelvis.translation".
  useEffect(() => {
    if (names.length === 0) {
      report('error', 'animation', 'no playable clip found in gltf.animations');
      console.error('[HeaderRunner] ERROR: no playable clip found in gltf.animations.');
      return;
    }
    const clip = gltf.animations[0];
    clip.tracks.forEach((t) => {
      if (t.name === 'pelvis.translation' && t.values.length >= 3) {
        const x0 = t.values[0];
        const z0 = t.values[2];
        for (let i = 0; i + 2 < t.values.length; i += 3) {
          t.values[i] = x0;
          t.values[i + 2] = z0;
        }
        t.needsUpdate = true;
      }
    });
    console.log('[HeaderRunner] root motion pinned (pelvis X/Z locked, Y bob kept).');
    const clipName = names[0];
    const action = actions[clipName];
    if (!action) {
      report('error', 'animation', `clip "${clipName}" has no action — bone names may not match`);
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

  // Auto-fit once the skeleton is bound and the clip is posing the rig
  // (bones are garbage before the first mixer updates, so measuring earlier
  // frames gives the wrong box). Measure the posed world box, then scale/center
  // the outer group so the character sits ~FIT_H tall at the origin.
  useFrame((state, delta) => {
    mixer.update(Math.min(delta, 0.05));
    frames.current += 1;
    if (!fitted.current && frames.current === 12 && group.current) {
      fitted.current = true;
      const box = new THREE.Box3().setFromObject(group.current);
      if (box.isEmpty()) {
        report('error', 'framing', 'posed bounds are empty — cannot frame the model');
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
        report('error', 'framing', 'posed bounds have no height — cannot frame the model');
        console.error('[HeaderRunner] ERROR: posed bounds have no height — cannot frame the model.');
        return;
      }
      const s = FIT_H / size.y;
      group.current.scale.setScalar(s);
      group.current.position.set(-center.x * s, -center.y * s, -center.z * s);
      console.log(`[HeaderRunner] auto-fit scale ${Number(s.toFixed(5))}; character centered at origin.`);
      onReady?.();
    }
  });

  // The GLB carries its own embedded textures (baseColor + possibly normal),
  // so the materials render correctly without a manual override. Keep the
  // poster fallback pointed at the existing Image_0.png so the header is
  // never empty while the GLB loads or if WebGL fails.
  return (
    <group ref={group}>
      {/* Mixamo rigs face +Z; the retargeted GLB's forward axis needs a visual
          check — start with the same +Z → +X rotation so the character runs right.
          If the character runs left, flip to rotation={[0, 0, 0]} or Math.PI. */}
      <group rotation={[0, Math.PI / 2, 0]}>
        <primitive object={gltf.scene} />
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
  // True once the 3D character is fitted and rendering. Until then — and forever
  // if WebGL/three fails — a static poster (same character pixels) travels the
  // loop instead, so the header is never empty.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    report('stage', 'runner-mounted', 'component mounted — checking files + WebGL');
    (async () => {
      try {
        const glbRes = await fetch(MODEL_URL, { method: 'HEAD' });
        if (!alive) return;
        console.log(`[HeaderRunner] diag glb ${glbRes.status} ${MODEL_URL} (${glbRes.headers.get('content-type') || 'no-ctype'})`);
        if (!glbRes.ok) {
          report('error', 'glb', `GLB ${glbRes.status} — check Vercel Root Directory is web`);
          console.error(`[HeaderRunner] ERROR: GLB ${glbRes.status} — check Vercel Root Directory is web and web/public/models/retargeted_animations.glb is deployed.`);
        }
      } catch (e) {
        report('error', 'glb', `GLB fetch failed — likely 404 or network: ${MODEL_URL}`);
        console.error(`[HeaderRunner] ERROR: GLB fetch failed — likely 404 or network: ${MODEL_URL}`, e);
      }
      try {
        const texRes = await fetch(LOCAL_TEXTURE, { method: 'HEAD' });
        if (!alive) return;
        console.log(`[HeaderRunner] diag poster ${texRes.status} ${LOCAL_TEXTURE} (${texRes.headers.get('content-type') || 'no-ctype'})`);
        if (!texRes.ok) {
          report('error', 'texture', `poster ${texRes.status} — check Image_0.png is deployed`);
          console.error(`[HeaderRunner] ERROR: poster ${texRes.status} — check web/public/models/textures/packed/Image_0.png is deployed.`);
        }
      } catch (e) {
        report('error', 'texture', `poster fetch failed: ${LOCAL_TEXTURE}`);
        console.error(`[HeaderRunner] ERROR: poster fetch failed: ${LOCAL_TEXTURE}`, e);
      }
      try {
        const c = document.createElement('canvas');
        const gl = c.getContext('webgl2') || c.getContext('webgl');
        console.log(`[HeaderRunner] diag webgl: ${gl ? 'available' : 'UNAVAILABLE'}`);
        if (!gl) {
          report('error', 'webgl', 'WebGL unavailable — 3D cannot render, poster stays');
          console.error('[HeaderRunner] ERROR: WebGL unavailable — 3D cannot render, poster stays.');
        }
      } catch (e) {
        report('error', 'webgl', 'WebGL check threw — 3D cannot render');
        console.error('[HeaderRunner] ERROR: WebGL check threw', e);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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
        {!ready ? (
          <img
            src={LOCAL_TEXTURE}
            className="runner-poster"
            alt=""
            aria-hidden="true"
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
        <RunnerErrorBoundary>
          <Canvas
            gl={{ alpha: true, antialias: true }}
            dpr={[1, 1.5]}
            camera={{ position: [0, 0.62, 2.15], fov: 35 }}
            style={{ background: 'transparent' }}
            onCreated={(state) => {
              report('stage', 'canvas-created', 'WebGL canvas created');
              console.log('[HeaderRunner] WebGL canvas created');
            }}
          >
            <ambientLight intensity={1.15} />
            <directionalLight position={[1.5, 2.5, 2]} intensity={1.6} />
            <directionalLight position={[-1.5, 1, 1]} intensity={0.45} />
            <RunnerErrorBoundary>
              <Suspense fallback={null}>
                <RunnerModel
                  onReady={() => {
                    report('stage', 'fitted-ready', 'character fitted, scaled, and running');
                    setReady(true);
                  }}
                />
              </Suspense>
            </RunnerErrorBoundary>
          </Canvas>
        </RunnerErrorBoundary>
      </div>
    </div>
  );
}
