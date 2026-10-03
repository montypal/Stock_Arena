'use client';

import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import cloneRig from './cloneRig';

// One buddy on a transparent canvas. Everything is props -- the model url, a
// mood -> clip-name map, and the mood to play -- so a new character is one
// catalogue entry in lib/rewards/buddies.js and no code here changes. A mood
// the model has no clip for falls back to idle, and a rig whose clips nobody
// has mapped yet still moves.
//
// The framing and lighting are the header runner's
// (components/layout/HeaderRunner.js), retuned for a tall corner box: measure
// the posed character once the rig is bound, then scale and park it.

const FOV = 35;
// Frame height at the character = 2 * CAM_Z * tan(FOV / 2) ~= 1.89 units.
const CAM_Z = 3;
// Character height in units: ~38% of the frame. The rest is headroom, because
// the canvas is taller than the glass box it stands in (.buddy-stage in
// styles/screens/home.css) and this GLB's backflip lifts the hips about 1.2
// body heights -- a buddy clipped off mid-jump reads as a glitch, not a trick.
const FIT_H = 0.72;
// Parks the character low in the frame: its feet land just inside the bottom of
// the glass box, which leaves every bit of that headroom above its head.
const FOOT_Y = -0.41;
const RATE = 0.85;
const FADE = 0.35;
// Bones hold garbage until the mixer has posed the rig a few times, so the
// measurement waits for them; measuring earlier scales the character wrongly.
const FIT_FRAME = 12;

// useGLTF throws if the file 404s or fails to parse, and Canvas throws when
// WebGL is unavailable. Either way the widget shows its glass box with no
// character in it -- never a stand-in image for a model that didn't load.
class BuddyBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(`[Buddy] ERROR: could not render ${this.props.model}`, error);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function pickClip(clips, mood, names) {
  for (const want of [clips?.[mood], clips?.idle]) {
    if (want && names.includes(want)) return want;
  }
  return names[0] ?? null;
}

function Rig({ model, clips, mood, reduced, onFit }) {
  const group = useRef(null);
  const gltf = useGLTF(model);
  // Own copy of the rig and of the clips: the header runner has the shared
  // ones mounted in its canvas and edits tracks on the clips it plays.
  const scene = useMemo(() => cloneRig(gltf.scene), [gltf]);
  const clipList = useMemo(() => gltf.animations.map((a) => a.clone()), [gltf]);
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  const names = useMemo(() => clipList.map((a) => a.name), [clipList]);
  const [fitted, setFitted] = useState(false);
  const frames = useRef(0);
  const framed = useRef(false);
  const playing = useRef(null);

  const idleName = pickClip(clips, 'idle', names);
  const moodName = pickClip(clips, mood, names);

  // three.js culls the skinned mesh against bind-pose bounds that sit outside
  // the camera until the fit below moves the group. The stale volume tests as
  // off-screen, so without this the canvas clears every frame and draws nothing.
  useEffect(() => {
    scene.traverse((o) => {
      if (o.isMesh) o.frustumCulled = false;
    });
  }, [scene]);

  useEffect(
    () => () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    },
    [mixer, scene]
  );

  // Play the clip for the mood, cross-fading out of whatever was playing --
  // Home refreshes itself every 30s (components/layout/refresh.js), so a mood
  // can change under a mounted canvas.
  //
  // The first pass is always idle: the fit below measures whatever pose is on
  // screen, so starting from the same clip every time keeps the character one
  // size in every mood. Measured mid-backflip it would be scaled to the height
  // of a tucked body. Reduced motion stays on that idle pose for good.
  useEffect(() => {
    const name = fitted && !reduced ? moodName : idleName;
    const clip = clipList.find((c) => c.name === name);
    if (!clip) {
      console.error(`[Buddy] ERROR: ${model} has no playable clip`);
      return;
    }
    const next = mixer.clipAction(clip);
    if (next === playing.current) return;
    next.reset().setLoop(THREE.LoopRepeat, Infinity);
    next.timeScale = RATE;
    next.play();
    if (playing.current) next.crossFadeFrom(playing.current, FADE, false);
    playing.current = next;
  }, [mixer, clipList, idleName, moodName, fitted, reduced, model]);

  useFrame((state, delta) => {
    frames.current += 1;
    // Reduced motion: pose and frame the rig, then hold that frame for good.
    // Framing has to finish either way, or the character is never in shot.
    if (!reduced || !framed.current) mixer.update(Math.min(delta, 0.05));
    if (framed.current || frames.current < FIT_FRAME || !group.current) return;
    framed.current = true;

    const box = new THREE.Box3().setFromObject(group.current);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    if (box.isEmpty() || !(size.y > 0) || !Number.isFinite(size.y)) {
      console.error(`[Buddy] ERROR: posed bounds of ${model} have no height -- cannot frame it`);
      return;
    }

    const s = FIT_H / size.y;
    group.current.scale.setScalar(s);
    group.current.position.set(-center.x * s, -center.y * s + FOOT_Y, -center.z * s);
    setFitted(true);
    onFit?.();
  });

  // Mixamo-style rigs face +Z, which is where the camera is, so the buddy
  // looks out of its box unrotated. A future model that faces away wants
  // rotation={[0, Math.PI, 0]} on this group.
  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

export default function Buddy({ model, clips, mood = 'idle' }) {
  const [frameloop, setFrameloop] = useState('always');
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (!model) return null;

  return (
    <BuddyBoundary model={model}>
      <Canvas
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.5]}
        frameloop={frameloop}
        camera={{ position: [0, 0, CAM_Z], fov: FOV }}
        // r3f's own wrapper div sets pointer-events:auto, which wins over
        // .buddy-stage's none -- the canvas is twice the height of the glass
        // box, so the invisible overhang was swallowing taps meant for the
        // cards behind it. style is spread last inside Canvas, so this wins.
        style={{ background: 'transparent', pointerEvents: 'none' }}
        onCreated={(state) => {
          // R3F defaults to ACESFilmic, whose midtone rolloff darkens the
          // character against the glass; exposure above 1 brings it back.
          state.gl.toneMappingExposure = 1.5;
        }}
      >
        {/* Physical units -- three r155 removed the legacy lighting path, so
            these have to stay well above the old 1.15/1.6/0.45 style rig or
            the character renders nearly black. */}
        <ambientLight intensity={2.6} />
        <hemisphereLight args={['#ffffff', '#93a7c4', 1.9]} />
        <directionalLight position={[1.5, 2.5, 2]} intensity={3.4} />
        <directionalLight position={[-1.5, 1, 1]} intensity={1.5} />
        <directionalLight position={[0.4, 1.2, 3]} intensity={1.8} />
        <BuddyBoundary model={model}>
          <Suspense fallback={null}>
            <Rig
              model={model}
              clips={clips}
              mood={mood}
              reduced={reduced}
              onFit={() => {
                // Parked: stop rendering frames that can never change.
                if (reduced) setFrameloop('demand');
              }}
            />
          </Suspense>
        </BuddyBoundary>
      </Canvas>
    </BuddyBoundary>
  );
}
