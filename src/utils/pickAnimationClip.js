/** Pick the best GLTF animation clip name from loaded actions. */
export function pickAnimationClip(actions, animations) {
  if (!actions || !animations?.length) return null;

  const names = animations.map((clip) => clip.name).filter(Boolean);
  if (names.length === 0) return null;

  const preferred = [
    'idle',
    'rotate',
    'spin',
    'orbit',
    'animation',
    'chip',
    'formation',
    'loop',
  ];

  for (const key of preferred) {
    const match = names.find((name) => name.toLowerCase().includes(key));
    if (match && actions[match]) return match;
  }

  const first = names.find((name) => actions[name]);
  return first ?? null;
}
