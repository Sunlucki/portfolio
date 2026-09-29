import { useFrame, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { Vector2 } from 'three';

// @react-three/postprocessing sizes a new EffectComposer from one size vector shared by every composer on
// the page, so a canvas that mounts while another one renders comes up with the other's size (the About
// scene drawn at the manifesto's full-screen size, cropped by its stage). This puts the renderer back.
export function KeepSize() {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const current = useMemo(() => new Vector2(), []);
  useFrame(() => {
    gl.getSize(current);
    if (current.x !== size.width || current.y !== size.height) gl.setSize(size.width, size.height);
  });
  return null;
}
