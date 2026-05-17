import { useGLTF } from '@react-three/drei';

/** Warm GPU assets during loader — reduces first-frame hitch. */
useGLTF.preload('/models/chip.glb');
useGLTF.preload('/models/tunnel.glb');
