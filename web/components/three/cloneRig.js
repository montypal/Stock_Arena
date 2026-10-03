// Copy a loaded .glb scene so a second canvas can render it.
//
// The header runner (components/layout/HeaderRunner.js) already renders
// retargeted_animations.glb, and drei's loader cache hands every caller the
// same parsed scene. Mounting that scene here would move it: an Object3D has
// one parent, so the runner would vanish from the header. A plain .clone() is
// no good either -- the copy keeps a reference to the original Skeleton, so it
// would be posed by the runner's mixer instead of ours.
//
// This is three's SkeletonUtils.clone: rebuild the hierarchy, then point each
// skinned mesh at a skeleton made of the copied bones. Geometry and materials
// stay shared, so the copy costs bones, not memory. It lives here rather than
// coming from three/examples because nothing may be added to package.json and
// the addons path is not part of the three entry point the app imports.

function pairwise(source, copy, visit) {
  visit(source, copy);
  for (let i = 0; i < source.children.length; i += 1) {
    const next = copy.children[i];
    if (next) pairwise(source.children[i], next, visit);
  }
}

export default function cloneRig(source) {
  const copy = source.clone();
  const sourceOf = new Map();
  const copyOf = new Map();
  pairwise(source, copy, (from, to) => {
    sourceOf.set(to, from);
    copyOf.set(from, to);
  });

  copy.traverse((node) => {
    if (!node.isSkinnedMesh) return;
    const original = sourceOf.get(node);
    if (!original) return;
    const skeleton = original.skeleton.clone();
    skeleton.bones = original.skeleton.bones.map((bone) => copyOf.get(bone) ?? bone);
    node.bindMatrix.copy(original.bindMatrix);
    node.bind(skeleton, node.bindMatrix);
    // .clone() copies the cached bounding volumes too, and Box3.setFromObject
    // trusts them when they exist -- so the buddy's auto-fit would measure
    // whatever pose the header runner had computed them from. Drop them and
    // let this copy measure itself.
    node.boundingBox = null;
    node.boundingSphere = null;
  });

  return copy;
}
